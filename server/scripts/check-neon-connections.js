/**
 * Script para verificar conexões ativas no banco Neon
 * Mostra quantas conexões estão abertas e de onde vêm
 */

const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_KqVlhnJF5vY9@ep-holy-queen-acfaysb1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

async function checkConnections() {
  console.log('🔍 Verificando conexões ativas no banco Neon...\n');
  console.log('📊 URL do banco:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Mascarar senha
  console.log('');
  
  const client = await pool.connect();
  
  try {
    // 1. Verificar conexões ativas
    console.log('📊 CONEXÕES ATIVAS:');
    const connections = await client.query(`
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
        LEFT(query, 150) as query_preview
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
      ORDER BY query_start DESC;
    `);
    
    console.log(`   Total: ${connections.rows.length} conexões ativas\n`);
    
    if (connections.rows.length > 0) {
      console.log('   Detalhes das conexões:\n');
      connections.rows.forEach((conn, i) => {
        console.log(`   ${i + 1}. PID: ${conn.pid}`);
        console.log(`      Aplicação: ${conn.application_name || 'N/A'}`);
        console.log(`      Usuário: ${conn.usename || 'N/A'}`);
        console.log(`      IP: ${conn.client_addr || 'N/A'}`);
        console.log(`      Estado: ${conn.state || 'N/A'}`);
        console.log(`      Esperando: ${conn.wait_event_type || 'N/A'} - ${conn.wait_event || 'N/A'}`);
        if (conn.query_preview) {
          console.log(`      Query: ${conn.query_preview.substring(0, 100)}...`);
        }
        console.log(`      Iniciada: ${conn.query_start || 'N/A'}`);
        console.log('');
      });
      
      // Agrupar por aplicação
      const byApp = {};
      connections.rows.forEach(conn => {
        const app = conn.application_name || 'unknown';
        byApp[app] = (byApp[app] || 0) + 1;
      });
      
      console.log('   Resumo por aplicação:');
      Object.entries(byApp).forEach(([app, count]) => {
        console.log(`      ${app}: ${count} conexão(ões)`);
      });
      console.log('');
    } else {
      console.log('   ✅ Nenhuma outra conexão ativa (apenas esta de diagnóstico)\n');
    }
    
    // 2. Verificar limite de conexões
    console.log('📈 LIMITE DE CONEXÕES:');
    const maxConn = await client.query(`SHOW max_connections;`);
    const currentConn = await client.query(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `);
    
    console.log(`   Máximo: ${maxConn.rows[0].max_connections}`);
    console.log(`   Em uso: ${currentConn.rows[0].count}`);
    const usage = (currentConn.rows[0].count / parseInt(maxConn.rows[0].max_connections) * 100).toFixed(1);
    console.log(`   Uso: ${usage}%`);
    
    if (parseFloat(usage) > 80) {
      console.log('   ⚠️  ALERTA: Uso acima de 80%!');
    } else {
      console.log('   ✅ Uso dentro do normal');
    }
    console.log('');
    
    // 3. Verificar queries lentas
    console.log('⏱️  QUERIES LENTAS (>5 segundos):');
    const slowQueries = await client.query(`
      SELECT 
        pid,
        application_name,
        state,
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
      console.log(`   ⚠️  ${slowQueries.rows.length} query(s) lenta(s):\n`);
      slowQueries.rows.forEach((q, i) => {
        console.log(`   ${i + 1}. PID: ${q.pid}, App: ${q.application_name || 'N/A'}`);
        console.log(`      Duração: ${q.duration}`);
        console.log(`      Query: ${q.query_preview?.substring(0, 150) || 'N/A'}...`);
        console.log('');
      });
    } else {
      console.log('   ✅ Nenhuma query lenta encontrada\n');
    }
    
    console.log('✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    if (error.message.includes('timeout')) {
      console.error('   ⚠️  Timeout ao conectar - banco pode estar sobrecarregado');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkConnections().catch(console.error);

