/**
 * PVP API Client
 * Cliente REST para sistema PVP
 */

import { apiClient } from './client';

export type MatchType = 'ranked' | 'casual';

export interface PlayerRanking {
  userId: number;
  seasonNumber: number;
  elo: number;
  tier: string;
  division: number | null;
  wins: number;
  losses: number;
  winStreak: number;
  peakElo: number;
  peakTier: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  displayName: string;
  elo: number;
  tier: string;
  division: number | null;
  wins: number;
  losses: number;
  winRate: number;
}

export interface RankingResponse {
  rankings: LeaderboardEntry[];
  playerRank: PlayerRanking | null;
  season: {
    number: number;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface MatchmakingStatus {
  inQueue: boolean;
  status: {
    matchType: MatchType;
    queuedAt: string;
  } | null;
}

export interface Challenge {
  id: number;
  challenger_id: number;
  challenged_id: number;
  challenger_beast_id: number;
  challenged_beast_id: number | null;
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  challenger_name?: string;
  challenged_name?: string;
}

export interface Match {
  id: number;
  seasonNumber: number;
  player1Id: number;
  player2Id: number;
  player1BeastId: number;
  player2BeastId: number;
  matchType: MatchType | 'direct_challenge';
  winnerId: number | null;
  loserId: number | null;
  eloChangePlayer1: number | null;
  eloChangePlayer2: number | null;
  durationSeconds: number | null;
  battleLog: any[];
  createdAt: string;
  finishedAt: string | null;
}

/**
 * Obter ranking e leaderboard
 */
export async function getRanking(): Promise<RankingResponse> {
  const response = await apiClient.get('/pvp/ranking');
  return response.data.data;
}

/**
 * Entrar na fila de matchmaking
 */
export async function joinMatchmaking(beastId: number, matchType: MatchType): Promise<void> {
  await apiClient.post('/pvp/matchmaking/join', {
    beastId,
    matchType,
  });
}

/**
 * Sair da fila de matchmaking
 */
export async function leaveMatchmaking(): Promise<void> {
  await apiClient.post('/pvp/matchmaking/leave');
}

/**
 * Obter status do matchmaking
 */
export async function getMatchmakingStatus(): Promise<MatchmakingStatus> {
  const response = await apiClient.get('/pvp/matchmaking/status');
  return response.data.data;
}

/**
 * Enviar desafio direto
 */
export async function sendChallenge(challengedId: number, beastId: number): Promise<void> {
  await apiClient.post('/pvp/challenge/send', {
    challengedId,
    beastId,
  });
}

/**
 * Aceitar desafio
 */
export async function acceptChallenge(challengeId: number, beastId: number): Promise<{ matchId: number }> {
  const response = await apiClient.post('/pvp/challenge/accept', {
    challengeId,
    beastId,
  });
  return response.data.data;
}

/**
 * Recusar desafio
 */
export async function declineChallenge(challengeId: number): Promise<void> {
  await apiClient.post('/pvp/challenge/decline', {
    challengeId,
  });
}

/**
 * Listar desafios pendentes
 */
export async function getPendingChallenges(): Promise<{ received: Challenge[]; sent: Challenge[] }> {
  const response = await apiClient.get('/pvp/challenges/pending');
  return response.data.data;
}

/**
 * Obter dados da partida
 */
export async function getMatch(matchId: number): Promise<Match> {
  const response = await apiClient.get(`/pvp/match/${matchId}`);
  return response.data.data.match;
}

/**
 * Enviar ação na batalha
 */
export async function sendMatchAction(matchId: number, action: any, beastState: any): Promise<void> {
  await apiClient.post(`/pvp/match/${matchId}/action`, {
    action,
    beastState,
  });
}

/**
 * Finalizar partida
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
  const response = await apiClient.post(`/pvp/match/${matchId}/finish`, {
    winnerId,
    durationSeconds,
  });
  return response.data.data;
}

/**
 * Obter temporada atual
 */
export async function getCurrentSeason(): Promise<any> {
  const response = await apiClient.get('/pvp/season/current');
  return response.data.data.season;
}

/**
 * Obter recompensas de temporada
 */
export async function getSeasonRewards(seasonNumber: number): Promise<any> {
  const response = await apiClient.get(`/pvp/season/rewards?seasonNumber=${seasonNumber}`);
  return response.data.data.rewards;
}

