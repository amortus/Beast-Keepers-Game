/**
 * Beast Keepers Server
 * Main Entry Point
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from './config/passport';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import { pool } from './db/connection';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ===== MIDDLEWARE =====

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Beast Keepers Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Game routes
app.use('/api/game', gameRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ===== START SERVER =====

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('[DB] Database connection established');

    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🎮 Beast Keepers Server');
      console.log('='.repeat(50));
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🔗 Frontend: ${FRONTEND_URL}`);
      console.log(`🗄️  Database: Connected`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();

export default app;

