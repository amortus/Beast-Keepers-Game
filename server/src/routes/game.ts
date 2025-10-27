/**
 * Game Routes
 * Beast Keepers Server
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  initializeGame,
  getGameSave,
  updateGameSave,
  updateBeast
} from '../controllers/gameController';

const router = Router();

// All game routes require authentication
router.use(authenticateToken);

// Initialize new game
router.post('/initialize', initializeGame);

// Game save
router.get('/save', getGameSave);
router.put('/save', updateGameSave);

// Beast management
router.put('/beast/:beastId', updateBeast);

export default router;

