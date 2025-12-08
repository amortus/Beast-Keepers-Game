/**
 * Authentication Middleware
 * Beast Keepers Server
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    displayName: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Log apenas para rotas de matchmaking para debug
  if (req.path.includes('matchmaking')) {
    console.log(`[Auth Middleware] Matchmaking request: ${req.method} ${req.path}`);
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    if (req.path.includes('matchmaking')) {
      console.warn(`[Auth Middleware] No token for matchmaking request: ${req.method} ${req.path}`);
    }
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName
    };
    
    if (req.path.includes('matchmaking')) {
      console.log(`[Auth Middleware] Authenticated user ${req.user.id} for ${req.method} ${req.path}`);
    }
    
    next();
  } catch (error) {
    if (req.path.includes('matchmaking')) {
      console.error(`[Auth Middleware] Token verification failed for ${req.method} ${req.path}:`, error);
    }
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
}

export function generateToken(user: { id: number; email: string; displayName: string }): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      displayName: user.displayName 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

