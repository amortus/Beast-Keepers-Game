/**
 * PVP Match Service
 * Gerencia partidas PVP (criação, estado, finalização)
 */

import { query, getClient } from '../db/connection';
import { updatePlayerElo, calculateEloChange, getPlayerRanking } from './pvpRankingService';
import { removeFromQueue } from './pvpMatchmakingService';
import { calculateRewards } from './pvpRewardService';

export type MatchType = 'ranked' | 'casual' | 'direct_challenge';

export interface Match {
  id: number;
  seasonNumber: number;
  player1Id: number;
  player2Id: number;
  player1BeastId: number;
  player2BeastId: number;
  matchType: MatchType;
  winnerId: number | null;
  loserId: number | null;
  eloChangePlayer1: number | null;
  eloChangePlayer2: number | null;
  durationSeconds: number | null;
  battleLog: any[];
  createdAt: Date;
  finishedAt: Date | null;
}

export interface MatchState {
  matchId: number;
  phase: 'waiting' | 'player1_turn' | 'player2_turn' | 'finished';
  player1State: any;
  player2State: any;
  turnNumber: number;
}

/**
 * Cria nova partida
 */
export async function createMatch(
  player1Id: number,
  player2Id: number,
  player1BeastId: number,
  player2BeastId: number,
  matchType: MatchType,
  seasonNumber: number = 1
): Promise<Match> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Remover da fila se estiverem lá
    try {
      await removeFromQueue(player1Id, player2Id);
    } catch (error) {
      // Ignorar se não estiverem na fila (desafio direto)
    }
    
    const result = await client.query(
      `INSERT INTO pvp_matches 
       (season_number, player1_id, player2_id, player1_beast_id, player2_beast_id, match_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [seasonNumber, player1Id, player2Id, player1BeastId, player2BeastId, matchType]
    );
    
    await client.query('COMMIT');
    
    const row = result.rows[0];
    return {
      id: row.id,
      seasonNumber: row.season_number,
      player1Id: row.player1_id,
      player2Id: row.player2_id,
      player1BeastId: row.player1_beast_id,
      player2BeastId: row.player2_beast_id,
      matchType: row.match_type,
      winnerId: row.winner_id,
      loserId: row.loser_id,
      eloChangePlayer1: row.elo_change_player1,
      eloChangePlayer2: row.elo_change_player2,
      durationSeconds: row.duration_seconds,
      battleLog: row.battle_log || [],
      createdAt: row.created_at,
      finishedAt: row.finished_at,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PVP Match] Error creating match:', error);
    throw error;
  }
}

/**
 * Busca dados da partida
 */
export async function getMatch(matchId: number): Promise<Match | null> {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT * FROM pvp_matches WHERE id = $1`,
      [matchId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      seasonNumber: row.season_number,
      player1Id: row.player1_id,
      player2Id: row.player2_id,
      player1BeastId: row.player1_beast_id,
      player2BeastId: row.player2_beast_id,
      matchType: row.match_type,
      winnerId: row.winner_id,
      loserId: row.loser_id,
      eloChangePlayer1: row.elo_change_player1,
      eloChangePlayer2: row.elo_change_player2,
      durationSeconds: row.duration_seconds,
      battleLog: row.battle_log || [],
      createdAt: row.created_at,
      finishedAt: row.finished_at,
    };
  } catch (error) {
    console.error('[PVP Match] Error getting match:', error);
    throw error;
  }
}

/**
 * Atualiza estado da partida
 */
export async function updateMatchState(matchId: number, state: Partial<MatchState>): Promise<void> {
  const client = await getClient();
  
  try {
    // Atualizar battle_log se necessário
    if (state.player1State || state.player2State) {
      const match = await getMatch(matchId);
      if (!match) throw new Error('Match not found');
      
      const battleLog = match.battleLog || [];
      battleLog.push({
        timestamp: new Date().toISOString(),
        turn: state.turnNumber,
        player1State: state.player1State,
        player2State: state.player2State,
      });
      
      await client.query(
        `UPDATE pvp_matches 
         SET battle_log = $1
         WHERE id = $2`,
        [JSON.stringify(battleLog), matchId]
      );
    }
  } catch (error) {
    console.error('[PVP Match] Error updating match state:', error);
    throw error;
  }
}

/**
 * Finaliza partida e atualiza rankings/recompensas
 */
export async function finishMatch(
  matchId: number,
  winnerId: number,
  durationSeconds: number
): Promise<{
  match: Match;
  eloChanges: { player1: number | null; player2: number | null };
  rewards: { player1: any; player2: any };
}> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const match = await getMatch(matchId);
    if (!match) throw new Error('Match not found');
    
    if (match.finishedAt) {
      throw new Error('Match already finished');
    }
    
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
    
    let eloChangePlayer1: number | null = null;
    let eloChangePlayer2: number | null = null;
    
    // Atualizar ELO apenas para partidas rankeadas
    if (match.matchType === 'ranked') {
      const player1Ranking = await getPlayerRanking(match.player1Id, match.seasonNumber);
      const player2Ranking = await getPlayerRanking(match.player2Id, match.seasonNumber);
      
      if (player1Ranking && player2Ranking) {
        const eloChanges = calculateEloChange(
          winnerId === match.player1Id ? player1Ranking.elo : player2Ranking.elo,
          winnerId === match.player1Id ? player2Ranking.elo : player1Ranking.elo
        );
        
        if (winnerId === match.player1Id) {
          eloChangePlayer1 = eloChanges.winnerChange;
          eloChangePlayer2 = eloChanges.loserChange;
          
          await updatePlayerElo(match.player1Id, match.seasonNumber, eloChanges.winnerChange, true);
          await updatePlayerElo(match.player2Id, match.seasonNumber, eloChanges.loserChange, false);
        } else {
          eloChangePlayer1 = eloChanges.loserChange;
          eloChangePlayer2 = eloChanges.winnerChange;
          
          await updatePlayerElo(match.player2Id, match.seasonNumber, eloChanges.winnerChange, true);
          await updatePlayerElo(match.player1Id, match.seasonNumber, eloChanges.loserChange, false);
        }
      }
    }
    
    // Calcular recompensas
    const rewards = await calculateRewards(match, winnerId);
    
    // Atualizar partida
    await client.query(
      `UPDATE pvp_matches 
       SET winner_id = $1, loser_id = $2,
           elo_change_player1 = $3, elo_change_player2 = $4,
           duration_seconds = $5, finished_at = NOW()
       WHERE id = $6`,
      [winnerId, loserId, eloChangePlayer1, eloChangePlayer2, durationSeconds, matchId]
    );
    
    await client.query('COMMIT');
    
    const updatedMatch = await getMatch(matchId);
    if (!updatedMatch) throw new Error('Failed to get updated match');
    
    console.log(`[PVP Match] Match ${matchId} finished. Winner: ${winnerId}`);
    
    return {
      match: updatedMatch,
      eloChanges: {
        player1: eloChangePlayer1,
        player2: eloChangePlayer2,
      },
      rewards,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PVP Match] Error finishing match:', error);
    throw error;
  }
}

/**
 * Valida ação do jogador (anti-cheat)
 */
export async function validateAction(
  matchId: number,
  userId: number,
  action: any
): Promise<boolean> {
  const client = await getClient();
  
  try {
    const match = await getMatch(matchId);
    if (!match) return false;
    
    // Verificar se partida ainda não terminou
    if (match.finishedAt) return false;
    
    // Verificar se é o turno do jogador
    // (lógica de turno será implementada no estado da partida)
    
    // Validar ação básica
    if (!action.type) return false;
    
    // Validações específicas por tipo de ação
    if (action.type === 'technique') {
      if (!action.techniqueId) return false;
      // Verificar se técnica existe e está disponível
      // (será implementado com dados do beast)
    }
    
    return true;
  } catch (error) {
    console.error('[PVP Match] Error validating action:', error);
    return false;
  }
}

