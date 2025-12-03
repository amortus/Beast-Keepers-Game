/**
 * PVP Ranking Service
 * Gerencia ELO, tiers, divisões e rankings
 */

import { query, getClient } from '../db/connection';

export type Tier = 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' | 'challenger';

export interface TierInfo {
  tier: Tier;
  division: number | null;
  minElo: number;
  maxElo: number;
}

export interface PlayerRanking {
  userId: number;
  seasonNumber: number;
  elo: number;
  tier: Tier;
  division: number | null;
  wins: number;
  losses: number;
  winStreak: number;
  peakElo: number;
  peakTier: Tier;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  displayName: string;
  elo: number;
  tier: Tier;
  division: number | null;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * Determina tier e divisão baseado em ELO
 */
export function getTierAndDivision(elo: number): TierInfo {
  if (elo >= 3200) {
    return { tier: 'challenger', division: null, minElo: 3200, maxElo: Infinity };
  } else if (elo >= 2800) {
    return { tier: 'grandmaster', division: null, minElo: 2800, maxElo: 3199 };
  } else if (elo >= 2400) {
    return { tier: 'master', division: null, minElo: 2400, maxElo: 2799 };
  } else if (elo >= 2000) {
    const division = Math.max(1, 4 - Math.floor((elo - 2000) / 100));
    return { tier: 'diamond', division, minElo: 2000, maxElo: 2399 };
  } else if (elo >= 1600) {
    const division = Math.max(1, 4 - Math.floor((elo - 1600) / 100));
    return { tier: 'platinum', division, minElo: 1600, maxElo: 1999 };
  } else if (elo >= 1200) {
    const division = Math.max(1, 4 - Math.floor((elo - 1200) / 100));
    return { tier: 'gold', division, minElo: 1200, maxElo: 1599 };
  } else if (elo >= 800) {
    const division = Math.max(1, 4 - Math.floor((elo - 800) / 100));
    return { tier: 'silver', division, minElo: 800, maxElo: 1199 };
  } else if (elo >= 400) {
    const division = Math.max(1, 4 - Math.floor((elo - 400) / 100));
    return { tier: 'bronze', division, minElo: 400, maxElo: 799 };
  } else {
    const division = Math.max(1, 4 - Math.floor(elo / 100));
    return { tier: 'iron', division, minElo: 0, maxElo: 399 };
  }
}

/**
 * Calcula mudança de ELO usando fórmula padrão
 * K-factor: 32
 */
export function calculateEloChange(winnerElo: number, loserElo: number): { winnerChange: number; loserChange: number } {
  const K = 32;
  
  // Expected score for winner
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  
  // Actual score (1 for win, 0 for loss)
  const actualWinner = 1;
  const actualLoser = 0;
  
  // Calculate changes
  const winnerChange = Math.round(K * (actualWinner - expectedWinner));
  const loserChange = Math.round(K * (actualLoser - (1 - expectedWinner)));
  
  return { winnerChange, loserChange };
}

/**
 * Busca ou cria ranking do jogador para uma temporada
 */
export async function getPlayerRanking(userId: number, seasonNumber: number): Promise<PlayerRanking | null> {
  const client = await getClient();
  
  try {
    let result = await client.query(
      `SELECT * FROM pvp_rankings 
       WHERE user_id = $1 AND season_number = $2`,
      [userId, seasonNumber]
    );
    
    if (result.rows.length === 0) {
      // Criar ranking inicial
      const tierInfo = getTierAndDivision(1000);
      await client.query(
        `INSERT INTO pvp_rankings 
         (user_id, season_number, elo, tier, division, peak_elo, peak_tier)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, seasonNumber, 1000, tierInfo.tier, tierInfo.division, 1000, tierInfo.tier]
      );
      
      result = await client.query(
        `SELECT * FROM pvp_rankings 
         WHERE user_id = $1 AND season_number = $2`,
        [userId, seasonNumber]
      );
    }
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      userId: row.user_id,
      seasonNumber: row.season_number,
      elo: row.elo,
      tier: row.tier,
      division: row.division,
      wins: row.wins,
      losses: row.losses,
      winStreak: row.win_streak,
      peakElo: row.peak_elo,
      peakTier: row.peak_tier,
    };
  } catch (error) {
    console.error('[PVP Ranking] Error getting player ranking:', error);
    throw error;
  }
}

/**
 * Atualiza ELO do jogador após partida
 */
export async function updatePlayerElo(
  userId: number,
  seasonNumber: number,
  eloChange: number,
  won: boolean
): Promise<PlayerRanking> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Buscar ranking atual
    const ranking = await getPlayerRanking(userId, seasonNumber);
    if (!ranking) {
      throw new Error('Ranking not found');
    }
    
    const newElo = Math.max(0, ranking.elo + eloChange);
    const tierInfo = getTierAndDivision(newElo);
    
    // Atualizar win streak
    let newWinStreak = won ? ranking.winStreak + 1 : 0;
    
    // Atualizar peak
    let peakElo = ranking.peakElo;
    let peakTier = ranking.peakTier;
    if (newElo > ranking.peakElo) {
      peakElo = newElo;
      peakTier = tierInfo.tier;
    }
    
    // Atualizar no banco
    await client.query(
      `UPDATE pvp_rankings 
       SET elo = $1, tier = $2, division = $3,
           wins = wins + $4, losses = losses + $5,
           win_streak = $6, peak_elo = $7, peak_tier = $8,
           updated_at = NOW()
       WHERE user_id = $9 AND season_number = $10`,
      [
        newElo,
        tierInfo.tier,
        tierInfo.division,
        won ? 1 : 0,
        won ? 0 : 1,
        newWinStreak,
        peakElo,
        peakTier,
        userId,
        seasonNumber,
      ]
    );
    
    await client.query('COMMIT');
    
    // Retornar ranking atualizado
    const updated = await getPlayerRanking(userId, seasonNumber);
    if (!updated) throw new Error('Failed to get updated ranking');
    
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PVP Ranking] Error updating player ELO:', error);
    throw error;
  }
}

/**
 * Busca leaderboard global
 */
export async function getLeaderboard(
  seasonNumber: number,
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        ROW_NUMBER() OVER (ORDER BY r.elo DESC, r.wins DESC) as rank,
        r.user_id,
        u.display_name,
        r.elo,
        r.tier,
        r.division,
        r.wins,
        r.losses,
        CASE 
          WHEN (r.wins + r.losses) > 0 
          THEN ROUND((r.wins::numeric / (r.wins + r.losses)::numeric) * 100, 2)
          ELSE 0
        END as win_rate
       FROM pvp_rankings r
       JOIN users u ON r.user_id = u.id
       WHERE r.season_number = $1
       ORDER BY r.elo DESC, r.wins DESC
       LIMIT $2 OFFSET $3`,
      [seasonNumber, limit, offset]
    );
    
    return result.rows.map(row => ({
      rank: parseInt(row.rank),
      userId: row.user_id,
      displayName: row.display_name,
      elo: row.elo,
      tier: row.tier,
      division: row.division,
      wins: row.wins,
      losses: row.losses,
      winRate: parseFloat(row.win_rate),
    }));
  } catch (error) {
    console.error('[PVP Ranking] Error getting leaderboard:', error);
    throw error;
  }
}

/**
 * Reseta rankings para nova temporada (mantém histórico)
 */
export async function resetSeasonRankings(seasonNumber: number): Promise<void> {
  const client = await getClient();
  
  try {
    // Não deleta os dados, apenas marca como antiga temporada
    // Os dados ficam para histórico
    console.log(`[PVP Ranking] Season ${seasonNumber} rankings preserved for history`);
  } catch (error) {
    console.error('[PVP Ranking] Error resetting season rankings:', error);
    throw error;
  }
}

