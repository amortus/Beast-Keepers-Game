/**
 * PostgreSQL Database Connection
 * Beast Keepers Server
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // 30 segundos para evitar timeout prematuro
  statement_timeout: 30000, // Timeout para queries individuais
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
  // Não encerrar o processo imediatamente - apenas logar o erro
  // Isso evita que erros temporários de conexão quebrem o servidor
  console.warn('[DB] Continuing despite connection error - server will retry');
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[DB] Query error', { text, error });
    throw error;
  }
}

// Helper to get a client from the pool for transactions
export async function getClient() {
  try {
    return await pool.connect();
  } catch (error: any) {
    console.error('[DB] Error getting client from pool:', error);
    // Se for erro de timeout, tentar novamente uma vez após curto delay
    if (error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') {
      console.warn('[DB] Connection timeout, waiting 1s before retry...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await pool.connect();
      } catch (retryError) {
        console.error('[DB] Retry also failed:', retryError);
        throw retryError;
      }
    }
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[DB] Closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[DB] Closing database connections...');
  await pool.end();
  process.exit(0);
});

