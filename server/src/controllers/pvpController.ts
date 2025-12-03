/**
 * PVP Controller
 * Rotas REST para sistema PVP
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import {
  getPlayerRanking,
  getLeaderboard,
  PlayerRanking,
} from '../services/pvpRankingService';
import {
  joinQueue,
  leaveQueue,
  getQueueStatus,
  findMatch,
  processMatchmaking,
} from '../services/pvpMatchmakingService';
import {
  createMatch,
  getMatch,
  finishMatch,
  validateAction as validateMatchAction,
} from '../services/pvpMatchService';
import { getCurrentSeason, getSeasonRewards } from '../services/pvpSeasonService';
import { applyRewards } from '../services/pvpRewardService';
import { query } from '../db/connection';

/**
 * GET /api/pvp/ranking
 * Obter ranking do jogador e leaderboard
 */
export async function getRanking(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const season = await getCurrentSeason();
    if (!season) {
      return res.status(500).json({ success: false, error: 'No active season' } as ApiResponse);
    }
    
    const playerRank = await getPlayerRanking(userId, season.number);
    const leaderboard = await getLeaderboard(season.number, 100, 0);
    
    res.json({
      success: true,
      data: {
        rankings: leaderboard,
        playerRank,
        season: {
          number: season.number,
          name: season.name,
          startDate: season.startDate,
          endDate: season.endDate,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error getting ranking:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar ranking' } as ApiResponse);
  }
}

/**
 * POST /api/pvp/matchmaking/join
 * Entrar na fila de matchmaking
 */
export async function joinMatchmaking(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const { beastId, matchType } = req.body;
    
    if (!beastId) {
      return res.status(400).json({ success: false, error: 'Beast ID required' } as ApiResponse);
    }
    
    if (!matchType || !['ranked', 'casual'].includes(matchType)) {
      return res.status(400).json({ success: false, error: 'Invalid match type' } as ApiResponse);
    }
    
    const season = await getCurrentSeason();
    if (!season) {
      return res.status(500).json({ success: false, error: 'No active season' } as ApiResponse);
    }
    
    await joinQueue(userId, beastId, matchType, season.number);
    
    res.json({
      success: true,
      data: {
        message: 'Joined matchmaking queue',
        matchType,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('[PVP Controller] Error joining matchmaking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao entrar na fila',
    } as ApiResponse);
  }
}

/**
 * POST /api/pvp/matchmaking/leave
 * Sair da fila de matchmaking
 */
export async function leaveMatchmaking(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    await leaveQueue(userId);
    
    res.json({
      success: true,
      data: { message: 'Left matchmaking queue' },
    } as ApiResponse);
  } catch (error: any) {
    console.error('[PVP Controller] Error leaving matchmaking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao sair da fila',
    } as ApiResponse);
  }
}

/**
 * GET /api/pvp/matchmaking/status
 * Status atual na fila
 */
export async function getMatchmakingStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const status = await getQueueStatus(userId);
    
    res.json({
      success: true,
      data: {
        inQueue: status !== null,
        status: status ? {
          matchType: status.matchType,
          queuedAt: status.queuedAt,
        } : null,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error getting matchmaking status:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar status' } as ApiResponse);
  }
}

/**
 * POST /api/pvp/challenge/send
 * Enviar desafio direto
 */
export async function sendChallenge(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const { challengedId, beastId } = req.body;
    
    if (!challengedId || !beastId) {
      return res.status(400).json({ success: false, error: 'Challenged ID and beast ID required' } as ApiResponse);
    }
    
    if (challengedId === userId) {
      return res.status(400).json({ success: false, error: 'Cannot challenge yourself' } as ApiResponse);
    }
    
    // Verificar se já existe desafio pendente
    const existing = await query(
      `SELECT id FROM pvp_direct_challenges
       WHERE challenger_id = $1 AND challenged_id = $2 AND status = 'pending'`,
      [userId, challengedId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Challenge already sent' } as ApiResponse);
    }
    
    // Criar desafio
    await query(
      `INSERT INTO pvp_direct_challenges
       (challenger_id, challenged_id, challenger_beast_id, status, created_at, expires_at)
       VALUES ($1, $2, $3, 'pending', NOW(), NOW() + INTERVAL '10 minutes')`,
      [userId, challengedId, beastId]
    );
    
    res.json({
      success: true,
      data: { message: 'Challenge sent' },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error sending challenge:', error);
    res.status(500).json({ success: false, error: 'Erro ao enviar desafio' } as ApiResponse);
  }
}

/**
 * POST /api/pvp/challenge/accept
 * Aceitar desafio
 */
export async function acceptChallenge(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const { challengeId, beastId } = req.body;
    
    if (!challengeId || !beastId) {
      return res.status(400).json({ success: false, error: 'Challenge ID and beast ID required' } as ApiResponse);
    }
    
    // Buscar desafio
    const challengeResult = await query(
      `SELECT * FROM pvp_direct_challenges WHERE id = $1 AND challenged_id = $2 AND status = 'pending'`,
      [challengeId, userId]
    );
    
    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Challenge not found or expired' } as ApiResponse);
    }
    
    const challenge = challengeResult.rows[0];
    
    // Verificar expiração
    if (new Date(challenge.expires_at) < new Date()) {
      await query(
        `UPDATE pvp_direct_challenges SET status = 'expired' WHERE id = $1`,
        [challengeId]
      );
      return res.status(400).json({ success: false, error: 'Challenge expired' } as ApiResponse);
    }
    
    // Criar partida
    const season = await getCurrentSeason();
    if (!season) {
      return res.status(500).json({ success: false, error: 'No active season' } as ApiResponse);
    }
    
    const match = await createMatch(
      challenge.challenger_id,
      challenge.challenged_id,
      challenge.challenger_beast_id,
      beastId,
      'direct_challenge',
      season.number
    );
    
    // Atualizar desafio
    await query(
      `UPDATE pvp_direct_challenges
       SET status = 'accepted', challenged_beast_id = $1, accepted_at = NOW(), match_id = $2
       WHERE id = $3`,
      [beastId, match.id, challengeId]
    );
    
    res.json({
      success: true,
      data: {
        matchId: match.id,
        message: 'Challenge accepted',
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error accepting challenge:', error);
    res.status(500).json({ success: false, error: 'Erro ao aceitar desafio' } as ApiResponse);
  }
}

/**
 * POST /api/pvp/challenge/decline
 * Recusar desafio
 */
export async function declineChallenge(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const { challengeId } = req.body;
    
    if (!challengeId) {
      return res.status(400).json({ success: false, error: 'Challenge ID required' } as ApiResponse);
    }
    
    await query(
      `UPDATE pvp_direct_challenges SET status = 'declined' WHERE id = $1 AND challenged_id = $2`,
      [challengeId, userId]
    );
    
    res.json({
      success: true,
      data: { message: 'Challenge declined' },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error declining challenge:', error);
    res.status(500).json({ success: false, error: 'Erro ao recusar desafio' } as ApiResponse);
  }
}

/**
 * GET /api/pvp/challenges/pending
 * Listar desafios pendentes
 */
export async function getPendingChallenges(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    // Desafios recebidos
    const received = await query(
      `SELECT c.*, u.display_name as challenger_name
       FROM pvp_direct_challenges c
       JOIN users u ON c.challenger_id = u.id
       WHERE c.challenged_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    // Desafios enviados
    const sent = await query(
      `SELECT c.*, u.display_name as challenged_name
       FROM pvp_direct_challenges c
       JOIN users u ON c.challenged_id = u.id
       WHERE c.challenger_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        received: received.rows,
        sent: sent.rows,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error getting pending challenges:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar desafios' } as ApiResponse);
  }
}

/**
 * GET /api/pvp/match/:matchId
 * Dados da partida
 */
export async function getMatchData(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const matchId = parseInt(req.params.matchId);
    if (!matchId) {
      return res.status(400).json({ success: false, error: 'Invalid match ID' } as ApiResponse);
    }
    
    const match = await getMatch(matchId);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' } as ApiResponse);
    }
    
    // Verificar se jogador é participante
    if (match.player1Id !== userId && match.player2Id !== userId) {
      return res.status(403).json({ success: false, error: 'Not a participant' } as ApiResponse);
    }
    
    res.json({
      success: true,
      data: { match },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error getting match:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar partida' } as ApiResponse);
  }
}

/**
 * POST /api/pvp/match/:matchId/action
 * Enviar ação na batalha
 */
export async function sendMatchAction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const matchId = parseInt(req.params.matchId);
    const { action, beastState } = req.body;
    
    if (!matchId || !action) {
      return res.status(400).json({ success: false, error: 'Match ID and action required' } as ApiResponse);
    }
    
    // Validar ação
    const isValid = await validateMatchAction(matchId, userId, action);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid action' } as ApiResponse);
    }
    
    res.json({
      success: true,
      data: { message: 'Action validated' },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error sending match action:', error);
    res.status(500).json({ success: false, error: 'Erro ao enviar ação' } as ApiResponse);
  }
}

/**
 * POST /api/pvp/match/:matchId/finish
 * Finalizar partida
 */
export async function finishMatchData(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const matchId = parseInt(req.params.matchId);
    const { winnerId, durationSeconds } = req.body;
    
    if (!matchId || !winnerId || !durationSeconds) {
      return res.status(400).json({ success: false, error: 'Match ID, winner ID and duration required' } as ApiResponse);
    }
    
    const result = await finishMatch(matchId, winnerId, durationSeconds);
    
    // Aplicar recompensas
    await applyRewards(result.match.player1Id, result.rewards.player1);
    await applyRewards(result.match.player2Id, result.rewards.player2);
    
    res.json({
      success: true,
      data: {
        match: result.match,
        eloChanges: result.eloChanges,
        rewards: result.rewards,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error finishing match:', error);
    res.status(500).json({ success: false, error: 'Erro ao finalizar partida' } as ApiResponse);
  }
}

/**
 * GET /api/pvp/season/current
 * Temporada atual
 */
export async function getCurrentSeasonData(req: AuthRequest, res: Response) {
  try {
    const season = await getCurrentSeason();
    
    if (!season) {
      return res.status(500).json({ success: false, error: 'No active season' } as ApiResponse);
    }
    
    res.json({
      success: true,
      data: { season },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error getting current season:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar temporada' } as ApiResponse);
  }
}

/**
 * GET /api/pvp/season/rewards
 * Recompensas de fim de temporada
 */
export async function getSeasonRewardsData(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }
    
    const { seasonNumber } = req.query;
    const seasonNum = seasonNumber ? parseInt(seasonNumber as string) : undefined;
    
    if (!seasonNum) {
      return res.status(400).json({ success: false, error: 'Season number required' } as ApiResponse);
    }
    
    const rewards = await getSeasonRewards(seasonNum, userId);
    
    res.json({
      success: true,
      data: { rewards },
    } as ApiResponse);
  } catch (error) {
    console.error('[PVP Controller] Error getting season rewards:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar recompensas' } as ApiResponse);
  }
}

