/**
 * Rotas de PvP (Player vs Player)
 * Matchmaking, rankings e temporadas
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as pvpController from '../controllers/pvpController';

const router = express.Router();

// Ranking
router.get('/ranking', authenticateToken, pvpController.getRanking);

// Matchmaking
router.post('/matchmaking/join', authenticateToken, pvpController.joinMatchmaking);
router.post('/matchmaking/leave', authenticateToken, pvpController.leaveMatchmaking);
router.get('/matchmaking/status', authenticateToken, pvpController.getMatchmakingStatus);

// Desafios diretos
router.post('/challenge/send', authenticateToken, pvpController.sendChallenge);
router.post('/challenge/accept', authenticateToken, pvpController.acceptChallenge);
router.post('/challenge/decline', authenticateToken, pvpController.declineChallenge);
router.get('/challenges/pending', authenticateToken, pvpController.getPendingChallenges);

// Partidas
router.get('/match/:matchId', authenticateToken, pvpController.getMatchData);
router.post('/match/:matchId/action', authenticateToken, pvpController.sendMatchAction);
router.post('/match/:matchId/finish', authenticateToken, pvpController.finishMatchData);

// Temporadas
router.get('/season/current', authenticateToken, pvpController.getCurrentSeasonData);
router.get('/season/rewards', authenticateToken, pvpController.getSeasonRewardsData);

export default router;
