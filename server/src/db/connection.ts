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
  max: 10, // Reduzido de 20 para 10 para evitar esgotamento do pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // 30 segundos para evitar timeout prematuro
  statement_timeout: 30000, // Timeout para queries individuais
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const pool = new Pool(poolConfig);

// Circuit Breaker state
type CircuitBreakerState = 'closed' | 'open' | 'half-open';
let circuitBreakerState: CircuitBreakerState = 'closed';
let circuitBreakerFailures = 0;
let circuitBreakerLastFailure = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5; // Abrir circuito após 5 falhas
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minuto antes de tentar novamente

// Test connection
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL database');
  // Reset circuit breaker on successful connection
  if (circuitBreakerState === 'open') {
    console.log('[DB] Circuit breaker closed - database connection restored');
    circuitBreakerState = 'closed';
    circuitBreakerFailures = 0;
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
  // Não encerrar o processo imediatamente - apenas logar o erro
  // Isso evita que erros temporários de conexão quebrem o servidor
  console.warn('[DB] Continuing despite connection error - server will retry');
});

/**
 * Check if pool is healthy (not too many pending connections)
 */
function isPoolHealthy(): boolean {
  const totalCount = pool.totalCount;
  const idleCount = pool.idleCount;
  const waitingCount = pool.waitingCount;
  
  // Pool is unhealthy if there are too many waiting connections
  if (waitingCount > 5) {
    return false;
  }
  
  // Pool is unhealthy if most connections are in use
  if (totalCount > 0 && (totalCount - idleCount) / totalCount > 0.8) {
    return false;
  }
  
  return true;
}

/**
 * Check circuit breaker state
 */
function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  if (circuitBreakerState === 'open') {
    // Check if we should try again (timeout expired)
    if (now - circuitBreakerLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
      console.log('[DB] Circuit breaker: Attempting to close (timeout expired)');
      circuitBreakerState = 'half-open'; // Temporary state for testing
      circuitBreakerFailures = 0;
      return true; // Allow one attempt to test connection
    }
    // Circuit is open and timeout hasn't expired - block ALL queries
    return false;
  }
  
  if (circuitBreakerState === 'half-open') {
    // In half-open state, allow queries but they will be monitored
    // If they fail, circuit will open again
    return true;
  }
  
  return true; // Circuit is closed, allow connections
}

/**
 * Record circuit breaker failure
 */
function recordCircuitBreakerFailure(): void {
  circuitBreakerFailures++;
  circuitBreakerLastFailure = Date.now();
  
  // Se está em half-open e falhou, voltar para open imediatamente
  if (circuitBreakerState === 'half-open') {
    circuitBreakerState = 'open';
    console.error(`[DB] Circuit breaker: half-open test failed, reopening immediately. Will retry in ${CIRCUIT_BREAKER_TIMEOUT / 1000}s`);
    return;
  }
  
  if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState = 'open';
    console.error(`[DB] Circuit breaker opened after ${circuitBreakerFailures} failures. Will retry in ${CIRCUIT_BREAKER_TIMEOUT / 1000}s`);
  }
}

/**
 * Record circuit breaker success
 */
function recordCircuitBreakerSuccess(): void {
  if (circuitBreakerState === 'half-open') {
    circuitBreakerState = 'closed';
    console.log('[DB] Circuit breaker closed - connection successful');
    circuitBreakerFailures = 0;
  } else if (circuitBreakerState === 'closed') {
    // Reset failure count on successful queries when closed
    circuitBreakerFailures = 0;
  }
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    const error = new Error('Circuit breaker is open - database unavailable');
    (error as any).code = 'ECIRCUITOPEN';
    throw error;
  }
  
  // Check pool health - se não está saudável E circuit breaker está aberto, bloquear
  if (!isPoolHealthy()) {
    if (!checkCircuitBreaker()) {
      const error = new Error('Pool is unhealthy and circuit breaker is open - database unavailable');
      (error as any).code = 'ECIRCUITOPEN';
      throw error;
    }
    console.warn('[DB] Pool is unhealthy, but attempting query anyway (circuit breaker allows)');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Record success for circuit breaker
    recordCircuitBreakerSuccess();
    
    // Log apenas queries que demoram mais de 1s ou são importantes
    if (duration > 1000 || text.includes('SELECT NOW()')) {
      console.log('[DB] Query executed', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    // Check if it's a connection error
    const isConnectionError = error?.message?.includes('timeout') || 
                              error?.code === 'ETIMEDOUT' || 
                              error?.code === 'ECONNREFUSED' ||
                              error?.code === 'ECIRCUITOPEN';
    
    if (isConnectionError) {
      // Record failure for circuit breaker
      recordCircuitBreakerFailure();
      console.error('[DB] Query error (connection issue)', { text: text.substring(0, 100), error: error.message });
    } else {
      console.error('[DB] Query error', { text: text.substring(0, 100), error: error.message });
    }
    throw error;
  }
}

// Helper to get a client from the pool for transactions
export async function getClient() {
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    const error = new Error('Circuit breaker is open - database unavailable');
    (error as any).code = 'ECIRCUITOPEN';
    throw error;
  }
  
  // Check pool health
  if (!isPoolHealthy()) {
    console.warn('[DB] Pool is unhealthy, but attempting to get client anyway');
  }
  
  try {
    const client = await pool.connect();
    recordCircuitBreakerSuccess();
    return client;
  } catch (error: any) {
    // Check if it's a connection error
    const isConnectionError = error?.message?.includes('timeout') || 
                              error?.code === 'ETIMEDOUT' || 
                              error?.code === 'ECONNREFUSED' ||
                              error?.code === 'ECIRCUITOPEN';
    
    if (isConnectionError) {
      recordCircuitBreakerFailure();
      
      // Se for erro de timeout, tentar novamente uma vez após curto delay (apenas se circuito não estiver aberto)
      if ((error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') && circuitBreakerState !== 'open') {
        console.warn('[DB] Connection timeout, waiting 1s before retry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check circuit breaker again before retry
        if (!checkCircuitBreaker()) {
          const circuitError = new Error('Circuit breaker is open - database unavailable');
          (circuitError as any).code = 'ECIRCUITOPEN';
          throw circuitError;
        }
        
        try {
          const client = await pool.connect();
          recordCircuitBreakerSuccess();
          return client;
        } catch (retryError: any) {
          recordCircuitBreakerFailure();
          console.error('[DB] Retry also failed:', retryError);
          throw retryError;
        }
      }
    }
    
    console.error('[DB] Error getting client from pool:', error);
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

