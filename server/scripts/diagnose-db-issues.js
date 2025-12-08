/**
 * Script de Diagnóstico de Problemas no Banco de Dados
 * 
 * Este script verifica:
 * 1. Conexões ativas no banco
 * 2. Queries lentas em execução
 * 3. Conexões bloqueadas
 * 4. Status do pool
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
});

async function diagnose() {
  console.log('🔍 Iniciando diagnóstico do banco de dados...\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Verificar conexões ativas
    console.log('📊 1. CONEXÕES ATIVAS:');
    const activeConnections = await client.query(`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        wait_event_type,
        wait_event,
        LEFT(query, 100) as query_preview
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
      ORDER BY query_start DESC;
    `);
    
    console.log(`   Total de conexões ativas: ${activeConnections.rows.length}`);
    if (activeConnections.rows.length > 0) {
      console.log('\n   Detalhes:');
      activeConnections.rows.forEach((conn, i) => {
        console.log(`   ${i + 1}. PID: ${conn.pid}`);
        console.log(`      App: ${conn.application_name || 'N/A'}`);
        console.log(`      Estado: ${conn.state}`);
        console.log(`      Esperando: ${conn.wait_event_type || 'N/A'} - ${conn.wait_event || 'N/A'}`);
        console.log(`      Query: ${conn.query_preview || 'N/A'}`);
        console.log(`      Iniciada: ${conn.query_start || 'N/A'}`);
        console.log('');
      });
    }
    
    // 2. Verificar queries lentas
    console.log('⏱️  2. QUERIES LENTAS (>5 segundos):');
    const slowQueries = await client.query(`
      SELECT 
        pid,
        usename,
        application_name,
        state,
        query_start,
        NOW() - query_start as duration,
        LEFT(query, 200) as query_preview
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
        AND state = 'active'
        AND NOW() - query_start > INTERVAL '5 seconds'
      ORDER BY query_start;
    `);
    
    if (slowQueries.rows.length > 0) {
      console.log(`   ⚠️  Encontradas ${slowQueries.rows.length} queries lentas:\n`);
      slowQueries.rows.forEach((query, i) => {
        const duration = query.duration;
        console.log(`   ${i + 1}. PID: ${query.pid}`);
        console.log(`      App: ${query.application_name || 'N/A'}`);
        console.log(`      Duração: ${duration}`);
        console.log(`      Query: ${query.query_preview}`);
        console.log('');
      });
    } else {
      console.log('   ✅ Nenhuma query lenta encontrada\n');
    }
    
    // 3. Verificar bloqueios
    console.log('🔒 3. BLOQUEIOS (LOCKS):');
    const locks = await client.query(`
      SELECT 
        blocked_locks.pid AS blocked_pid,
        blocked_activity.usename AS blocked_user,
        blocking_locks.pid AS blocking_pid,
        blocking_activity.usename AS blocking_user,
        blocked_activity.query AS blocked_statement,
        blocking_activity.query AS blocking_statement
      FROM pg_catalog.pg_locks blocked_locks
      JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
      JOIN pg_catalog.pg_locks blocking_locks 
        ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
      WHERE NOT blocked_locks.granted;
    `);
    
    if (locks.rows.length > 0) {
      console.log(`   ⚠️  Encontrados ${locks.rows.length} bloqueios:\n`);
      locks.rows.forEach((lock, i) => {
        console.log(`   ${i + 1}. PID ${lock.blocked_pid} bloqueado por PID ${lock.blocking_pid}`);
        console.log(`      Query bloqueada: ${lock.blocked_statement?.substring(0, 100) || 'N/A'}`);
        console.log(`      Query bloqueadora: ${lock.blocking_statement?.substring(0, 100) || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   ✅ Nenhum bloqueio encontrado\n');
    }
    
    // 4. Verificar limite de conexões
    console.log('📈 4. LIMITE DE CONEXÕES:');
    const maxConnections = await client.query(`SHOW max_connections;`);
    const currentConnections = await client.query(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `);
    
    console.log(`   Máximo permitido: ${maxConnections.rows[0].max_connections}`);
    console.log(`   Atualmente em uso: ${currentConnections.rows[0].count}`);
    const usagePercent = (currentConnections.rows[0].count / parseInt(maxConnections.rows[0].max_connections) * 100).toFixed(1);
    console.log(`   Uso: ${usagePercent}%`);
    
    if (parseFloat(usagePercent) > 80) {
      console.log('   ⚠️  ALERTA: Uso acima de 80%!');
    } else {
      console.log('   ✅ Uso dentro do normal');
    }
    console.log('');
    
    // 5. Verificar tamanho do banco
    console.log('💾 5. TAMANHO DO BANCO:');
    const dbSize = await client.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size;
    `);
    console.log(`   Tamanho: ${dbSize.rows[0].size}\n`);
    
    // 6. Verificar tabelas mais usadas
    console.log('📋 6. TABELAS MAIS ACESSADAS:');
    const tableStats = await client.query(`
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
      FROM pg_stat_user_tables
      ORDER BY seq_scan + idx_scan DESC
      LIMIT 10;
    `);
    
    if (tableStats.rows.length > 0) {
      console.log('   Top 10 tabelas mais acessadas:\n');
      tableStats.rows.forEach((table, i) => {
        const totalScans = parseInt(table.seq_scan) + parseInt(table.idx_scan);
        console.log(`   ${i + 1}. ${table.tablename}`);
        console.log(`      Scans: ${totalScans} (seq: ${table.seq_scan}, idx: ${table.idx_scan})`);
        console.log(`      Inserts: ${table.n_tup_ins}, Updates: ${table.n_tup_upd}, Deletes: ${table.n_tup_del}`);
        console.log('');
      });
    }
    
    console.log('✅ Diagnóstico concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnose().catch(console.error);

