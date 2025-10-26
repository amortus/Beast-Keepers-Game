/**
 * Authentication Routes
 * Beast Keepers Server
 */

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Register new user
router.post('/register', register);

// Login
router.post('/login', login);

// Get current user (protected route)
router.get('/me', authenticateToken, getMe);

// Logout (client-side - just remove token)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

export default router;

