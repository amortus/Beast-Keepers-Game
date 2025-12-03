/**
 * PVP Reward Service
 * Calcula recompensas para partidas PVP
 */

import { query, getClient } from '../db/connection';
import { getPlayerRanking } from './pvpRankingService';
import { Match } from './pvpMatchService';

export interface MatchRewards {
  coronas: number;
  experience: number;
  eloChange?: number;
}

/**
 * Calcula recompensas para partida
 */
export async function calculateRewards(
  match: Match,
  winnerId: number
): Promise<{ player1: MatchRewards; player2: MatchRewards }> {
  const client = await getClient();
  
  try {
    // Buscar dados dos beasts
    const beast1Result = await client.query(
      `SELECT level, line FROM beasts WHERE id = $1`,
      [match.player1BeastId]
    );
    const beast2Result = await client.query(
      `SELECT level, line FROM beasts WHERE id = $1`,
      [match.player2BeastId]
    );
    
    if (beast1Result.rows.length === 0 || beast2Result.rows.length === 0) {
      throw new Error('Beast not found');
    }
    
    const beast1 = beast1Result.rows[0];
    const beast2 = beast2Result.rows[0];
    
    const winnerBeast = winnerId === match.player1Id ? beast1 : beast2;
    const loserBeast = winnerId === match.player1Id ? beast2 : beast1;
    
    if (match.matchType === 'ranked') {
      // Partidas rankeadas: recompensas baseadas em tier do oponente
      const loserRanking = await getPlayerRanking(
        winnerId === match.player1Id ? match.player2Id : match.player1Id,
        match.seasonNumber
      );
      
      const tierMultiplier = getTierMultiplier(loserRanking?.tier || 'iron');
      const coronas = Math.round(50 * tierMultiplier);
      const experience = calculateExperienceGain(winnerBeast.level, loserBeast.level);
      
      return {
        player1: {
          coronas: winnerId === match.player1Id ? coronas : Math.round(coronas * 0.3),
          experience: winnerId === match.player1Id ? experience : Math.round(experience * 0.5),
        },
        player2: {
          coronas: winnerId === match.player2Id ? coronas : Math.round(coronas * 0.3),
          experience: winnerId === match.player2Id ? experience : Math.round(experience * 0.5),
        },
      };
    } else {
      // Partidas casuais: recompensas fixas menores
      const coronas = Math.round(25 + Math.random() * 75); // 25-100
      const experience = calculateExperienceGain(winnerBeast.level, loserBeast.level);
      
      return {
        player1: {
          coronas: winnerId === match.player1Id ? coronas : Math.round(coronas * 0.3),
          experience: winnerId === match.player1Id ? experience : Math.round(experience * 0.5),
        },
        player2: {
          coronas: winnerId === match.player2Id ? coronas : Math.round(coronas * 0.3),
          experience: winnerId === match.player2Id ? experience : Math.round(experience * 0.5),
        },
      };
    }
  } catch (error) {
    console.error('[PVP Reward] Error calculating rewards:', error);
    throw error;
  }
}

/**
 * Multiplicador de recompensas baseado em tier
 */
function getTierMultiplier(tier: string): number {
  const multipliers: Record<string, number> = {
    iron: 1.0,
    bronze: 1.2,
    silver: 1.5,
    gold: 2.0,
    platinum: 2.5,
    diamond: 3.0,
    master: 4.0,
    grandmaster: 5.0,
    challenger: 6.0,
  };
  
  return multipliers[tier] || 1.0;
}

/**
 * Calcula XP ganho baseado em níveis (similar ao sistema existente)
 */
function calculateExperienceGain(winnerLevel: number, loserLevel: number): number {
  // Fórmula similar ao sistema de batalha existente
  const baseExp = 50;
  const levelDiff = loserLevel - winnerLevel;
  const expMultiplier = 1 + (levelDiff * 0.1); // +10% por nível de diferença
  
  return Math.max(10, Math.round(baseExp * expMultiplier));
}

/**
 * Aplica recompensas ao jogador
 */
export async function applyRewards(
  userId: number,
  rewards: MatchRewards
): Promise<void> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Adicionar coronas
    await client.query(
      `UPDATE game_saves 
       SET coronas = coronas + $1
       WHERE user_id = $2`,
      [rewards.coronas, userId]
    );
    
    // XP será aplicado no frontend após a batalha
    // (usando o sistema de leveling existente)
    
    await client.query('COMMIT');
    
    console.log(`[PVP Reward] Applied rewards to user ${userId}: ${rewards.coronas} coronas, ${rewards.experience} XP`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PVP Reward] Error applying rewards:', error);
    throw error;
  }
}

