/**
 * Authentication Routes
 * Beast Keepers Server
 */

import { Router } from 'express';
import { register, login, getMe, googleCallback } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import passport from '../config/passport';

const router = Router();

// Register new user
router.post('/register', register);

// Login
router.post('/login', login);

// Get current user (protected route)
router.get('/me', authenticateToken, getMe);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: process.env.FRONTEND_URL + '/login?error=auth_failed'
  }),
  googleCallback
);

// Logout (client-side - just remove token)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

export default router;

