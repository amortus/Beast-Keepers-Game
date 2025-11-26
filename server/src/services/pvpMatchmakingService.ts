/**
 * PVP Matchmaking Service
 * Gerencia fila de matchmaking (ranked e casual)
 */

import { query, getClient } from '../db/connection';
import { getPlayerRanking, getTierAndDivision } from './pvpRankingService';

export type MatchType = 'ranked' | 'casual';

export interface QueueEntry {
  userId: number;
  beastId: number;
  matchType: MatchType;
  elo?: number;
  tier?: string;
  queuedAt: Date;
}

export interface MatchResult {
  player1: QueueEntry;
  player2: QueueEntry;
  matchId: number;
}

/**
 * Adiciona jogador à fila de matchmaking
 */
export async function joinQueue(
  userId: number,
  beastId: number,
  matchType: MatchType,
  seasonNumber: number = 1
): Promise<void> {
  const client = await getClient();
  
  try {
    // Verificar se já está na fila
    const existing = await client.query(
      `SELECT id FROM pvp_matchmaking_queue WHERE user_id = $1`,
      [userId]
    );
    
    if (existing.rows.length > 0) {
      throw new Error('Player already in queue');
    }
    
    let elo: number | null = null;
    let tier: string | null = null;
    
    // Para ranked, buscar ELO e tier
    if (matchType === 'ranked') {
      const ranking = await getPlayerRanking(userId, seasonNumber);
      if (ranking) {
        elo = ranking.elo;
        tier = ranking.tier;
      } else {
        // Ranking inicial
        elo = 1000;
        tier = 'iron';
      }
    }
    
    await client.query(
      `INSERT INTO pvp_matchmaking_queue 
       (user_id, beast_id, match_type, elo, tier, queued_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '5 minutes')`,
      [userId, beastId, matchType, elo, tier]
    );
    
    console.log(`[PVP Matchmaking] Player ${userId} joined ${matchType} queue`);
  } catch (error) {
    console.error('[PVP Matchmaking] Error joining queue:', error);
    throw error;
  }
}

/**
 * Remove jogador da fila
 */
export async function leaveQueue(userId: number): Promise<void> {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `DELETE FROM pvp_matchmaking_queue WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rowCount === 0) {
      throw new Error('Player not in queue');
    }
    
    console.log(`[PVP Matchmaking] Player ${userId} left queue`);
  } catch (error) {
    console.error('[PVP Matchmaking] Error leaving queue:', error);
    throw error;
  }
}

/**
 * Busca status do jogador na fila
 */
export async function getQueueStatus(userId: number): Promise<QueueEntry | null> {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT * FROM pvp_matchmaking_queue WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      userId: row.user_id,
      beastId: row.beast_id,
      matchType: row.match_type,
      elo: row.elo,
      tier: row.tier,
      queuedAt: row.queued_at,
    };
  } catch (error) {
    console.error('[PVP Matchmaking] Error getting queue status:', error);
    throw error;
  }
}

/**
 * Busca match para jogador
 * - Ranked: busca por ELO similar (±100 inicial, expande)
 * - Casual: busca qualquer oponente disponível
 */
export async function findMatch(
  userId: number,
  matchType: MatchType,
  seasonNumber: number = 1
): Promise<MatchResult | null> {
  const client = await getClient();
  
  try {
    // Buscar entrada do jogador
    const playerEntry = await getQueueStatus(userId);
    if (!playerEntry || playerEntry.matchType !== matchType) {
      return null;
    }
    
    if (matchType === 'ranked') {
      return await findRankedMatch(playerEntry, seasonNumber);
    } else {
      return await findCasualMatch(playerEntry);
    }
  } catch (error) {
    console.error('[PVP Matchmaking] Error finding match:', error);
    throw error;
  }
}

/**
 * Busca match rankeado (por ELO)
 */
async function findRankedMatch(
  playerEntry: QueueEntry,
  seasonNumber: number
): Promise<MatchResult | null> {
  const client = await getClient();
  
  if (!playerEntry.elo) return null;
  
  const eloRange = 100; // ±100 inicial
  let currentRange = eloRange;
  const maxRange = 500; // Máximo de ±500
  
  while (currentRange <= maxRange) {
    const minElo = Math.max(0, playerEntry.elo - currentRange);
    const maxElo = playerEntry.elo + currentRange;
    
    const result = await client.query(
      `SELECT * FROM pvp_matchmaking_queue
       WHERE user_id != $1
         AND match_type = 'ranked'
         AND elo >= $2 AND elo <= $3
         AND expires_at > NOW()
       ORDER BY ABS(elo - $4)
       LIMIT 1`,
      [playerEntry.userId, minElo, maxElo, playerEntry.elo]
    );
    
    if (result.rows.length > 0) {
      const opponentRow = result.rows[0];
      const opponent: QueueEntry = {
        userId: opponentRow.user_id,
        beastId: opponentRow.beast_id,
        matchType: opponentRow.match_type,
        elo: opponentRow.elo,
        tier: opponentRow.tier,
        queuedAt: opponentRow.queued_at,
      };
      
      // Criar match (será criado pelo matchService)
      return {
        player1: playerEntry,
        player2: opponent,
        matchId: 0, // Será preenchido pelo matchService
      };
    }
    
    // Expandir range
    currentRange += 50;
  }
  
  return null;
}

/**
 * Busca match casual (aleatório)
 */
async function findCasualMatch(playerEntry: QueueEntry): Promise<MatchResult | null> {
  const client = await getClient();
  
  const result = await client.query(
    `SELECT * FROM pvp_matchmaking_queue
     WHERE user_id != $1
       AND match_type = 'casual'
       AND expires_at > NOW()
     ORDER BY RANDOM()
     LIMIT 1`,
    [playerEntry.userId]
  );
  
  if (result.rows.length === 0) return null;
  
  const opponentRow = result.rows[0];
  const opponent: QueueEntry = {
    userId: opponentRow.user_id,
    beastId: opponentRow.beast_id,
    matchType: opponentRow.match_type,
    elo: opponentRow.elo,
    tier: opponentRow.tier,
    queuedAt: opponentRow.queued_at,
  };
  
  return {
    player1: playerEntry,
    player2: opponent,
    matchId: 0, // Será preenchido pelo matchService
  };
}

/**
 * Remove ambos jogadores da fila após match encontrado
 */
export async function removeFromQueue(userId1: number, userId2: number): Promise<void> {
  const client = await getClient();
  
  try {
    await client.query(
      `DELETE FROM pvp_matchmaking_queue 
       WHERE user_id IN ($1, $2)`,
      [userId1, userId2]
    );
    
    console.log(`[PVP Matchmaking] Removed players ${userId1} and ${userId2} from queue`);
  } catch (error) {
    console.error('[PVP Matchmaking] Error removing from queue:', error);
    throw error;
  }
}

/**
 * Limpa entradas expiradas da fila
 */
export async function cleanExpiredQueueEntries(): Promise<number> {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `DELETE FROM pvp_matchmaking_queue 
       WHERE expires_at < NOW()`
    );
    
    const count = result.rowCount || 0;
    if (count > 0) {
      console.log(`[PVP Matchmaking] Cleaned ${count} expired queue entries`);
    }
    
    return count;
  } catch (error) {
    console.error('[PVP Matchmaking] Error cleaning expired entries:', error);
    throw error;
  }
}

/**
 * Processa matchmaking periodicamente
 * Deve ser chamado a cada poucos segundos
 */
export async function processMatchmaking(seasonNumber: number = 1): Promise<MatchResult[]> {
  const client = await getClient();
  
  try {
    // Limpar expirados primeiro
    await cleanExpiredQueueEntries();
    
    const matches: MatchResult[] = [];
    
    // Processar ranked
    const rankedPlayers = await client.query(
      `SELECT * FROM pvp_matchmaking_queue
       WHERE match_type = 'ranked'
         AND expires_at > NOW()
       ORDER BY queued_at ASC`
    );
    
    const processedRanked = new Set<number>();
    
    for (const row of rankedPlayers.rows) {
      if (processedRanked.has(row.user_id)) continue;
      
      const playerEntry: QueueEntry = {
        userId: row.user_id,
        beastId: row.beast_id,
        matchType: row.match_type,
        elo: row.elo,
        tier: row.tier,
        queuedAt: row.queued_at,
      };
      
      const match = await findRankedMatch(playerEntry, seasonNumber);
      if (match) {
        processedRanked.add(match.player1.userId);
        processedRanked.add(match.player2.userId);
        matches.push(match);
      }
    }
    
    // Processar casual
    const casualPlayers = await client.query(
      `SELECT * FROM pvp_matchmaking_queue
       WHERE match_type = 'casual'
         AND expires_at > NOW()
       ORDER BY queued_at ASC`
    );
    
    const processedCasual = new Set<number>();
    
    for (const row of casualPlayers.rows) {
      if (processedCasual.has(row.user_id)) continue;
      
      const playerEntry: QueueEntry = {
        userId: row.user_id,
        beastId: row.beast_id,
        matchType: row.match_type,
        elo: row.elo,
        tier: row.tier,
        queuedAt: row.queued_at,
      };
      
      const match = await findCasualMatch(playerEntry);
      if (match) {
        processedCasual.add(match.player1.userId);
        processedCasual.add(match.player2.userId);
        matches.push(match);
      }
    }
    
    return matches;
  } catch (error) {
    console.error('[PVP Matchmaking] Error processing matchmaking:', error);
    throw error;
  }
}

