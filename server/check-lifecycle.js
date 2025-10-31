/**
 * Script para verificar o sistema de ciclo de vida em produção
 * Uso: node check-lifecycle.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Conectar ao banco de produção
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkLifecycleSystem() {
  console.log('🔍 VERIFICANDO SISTEMA DE CICLO DE VIDA...\n');
  
  try {
    // 1. Verificar se as colunas existem
    console.log('1️⃣ Verificando colunas da tabela beasts...');
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'beasts' 
      AND column_name IN ('age_in_days', 'last_day_processed', 'max_age_weeks', 'current_action')
      ORDER BY column_name
    `);
    
    if (columnsCheck.rows.length === 0) {
      console.log('❌ ERRO: Colunas não encontradas! Migration 005 não foi aplicada.');
      console.log('   Execute: npm run migrate:up\n');
      return;
    }
    
    console.log('✅ Colunas encontradas:');
    columnsCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    // 2. Verificar bestas ativas
    console.log('2️⃣ Verificando bestas ativas...');
    const beastsCheck = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE age_in_days > 0) as aging,
        COUNT(*) FILTER (WHERE last_day_processed > 0) as processed,
        AVG(age_in_days) as avg_age,
        MAX(age_in_days) as max_age
      FROM beasts
      WHERE is_active = true
    `);
    
    const stats = beastsCheck.rows[0];
    console.log(`✅ Bestas ativas: ${stats.total}`);
    console.log(`   - Com idade > 0: ${stats.aging}`);
    console.log(`   - Com último dia processado: ${stats.processed}`);
    console.log(`   - Idade média: ${parseFloat(stats.avg_age || 0).toFixed(2)} dias`);
    console.log(`   - Idade máxima: ${stats.max_age || 0} dias`);
    console.log('');
    
    // 3. Mostrar top 10 bestas mais velhas
    console.log('3️⃣ Top 10 bestas mais velhas:');
    const oldestBeasts = await pool.query(`
      SELECT 
        b.id,
        b.name,
        b.age_in_days,
        b.last_day_processed,
        TO_TIMESTAMP(b.last_day_processed / 1000) as last_processed_date,
        b.current_action
      FROM beasts b
      WHERE b.is_active = true
      ORDER BY b.age_in_days DESC
      LIMIT 10
    `);
    
    if (oldestBeasts.rows.length === 0) {
      console.log('   ℹ️ Nenhuma besta encontrada.');
    } else {
      oldestBeasts.rows.forEach((beast, index) => {
        const weeks = Math.floor(beast.age_in_days / 7);
        const lastProcessed = beast.last_day_processed > 0 
          ? new Date(beast.last_day_processed).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
          : 'Nunca';
        const action = beast.current_action ? ` [🏃 ${beast.current_action.type}]` : '';
        
        console.log(`   ${index + 1}. ${beast.name} - ${beast.age_in_days} dias (${weeks} semanas)${action}`);
        console.log(`      Último processamento: ${lastProcessed}`);
      });
    }
    console.log('');
    
    // 4. Verificar timestamp da meia-noite atual
    console.log('4️⃣ Verificando meia-noite atual (Brasília)...');
    const now = new Date();
    const brasiliaStr = now.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Calcular meia-noite de hoje
    const dateStr = now.toLocaleString('en-CA', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    console.log(`   Horário atual (Brasília): ${brasiliaStr}`);
    console.log(`   Data atual (Brasília): ${dateStr}`);
    
    // 5. Verificar bestas que precisam ser processadas
    console.log('\n5️⃣ Verificando bestas pendentes...');
    const pendingCheck = await pool.query(`
      SELECT COUNT(*) as pending
      FROM beasts
      WHERE is_active = true
      AND (last_day_processed IS NULL OR last_day_processed < EXTRACT(EPOCH FROM CURRENT_DATE) * 1000)
    `);
    
    const pending = parseInt(pendingCheck.rows[0].pending);
    if (pending > 0) {
      console.log(`   ⚠️ ${pending} bestas precisam ser processadas no próximo ciclo diário!`);
    } else {
      console.log(`   ✅ Todas as bestas foram processadas hoje.`);
    }
    console.log('');
    
    // 6. Verificar eventos de calendário
    console.log('6️⃣ Verificando tabela de eventos de calendário...');
    const eventsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'calendar_events_log'
      ) as exists
    `);
    
    if (eventsTableCheck.rows[0].exists) {
      const recentEvents = await pool.query(`
        SELECT event_name, event_date, processed_at
        FROM calendar_events_log
        ORDER BY processed_at DESC
        LIMIT 5
      `);
      
      if (recentEvents.rows.length > 0) {
        console.log('   ✅ Eventos recentes:');
        recentEvents.rows.forEach(event => {
          console.log(`      - ${event.event_name} (${event.event_date}) em ${new Date(event.processed_at).toLocaleString('pt-BR')}`);
        });
      } else {
        console.log('   ℹ️ Nenhum evento de calendário processado ainda.');
      }
    } else {
      console.log('   ⚠️ Tabela calendar_events_log não existe (opcional).');
    }
    console.log('');
    
    // 7. Resumo final
    console.log('📊 RESUMO:');
    console.log('═'.repeat(60));
    
    const allColumnsExist = columnsCheck.rows.length === 4;
    const beastsExist = parseInt(stats.total) > 0;
    const systemActive = parseInt(stats.aging) > 0 || parseInt(stats.processed) > 0;
    
    if (allColumnsExist && beastsExist && systemActive) {
      console.log('✅ SISTEMA FUNCIONANDO CORRETAMENTE!');
      console.log('   - Colunas criadas: OK');
      console.log('   - Bestas ativas: OK');
      console.log('   - Processamento ativo: OK');
    } else if (allColumnsExist && beastsExist) {
      console.log('⚠️ SISTEMA PARCIALMENTE ATIVO');
      console.log('   - Colunas criadas: OK');
      console.log('   - Bestas ativas: OK');
      console.log('   - Aguardando primeiro ciclo diário à meia-noite');
    } else if (allColumnsExist) {
      console.log('⚠️ SISTEMA CONFIGURADO MAS SEM BESTAS');
      console.log('   - Colunas criadas: OK');
      console.log('   - Nenhuma besta ativa encontrada');
    } else {
      console.log('❌ SISTEMA NÃO CONFIGURADO');
      console.log('   - Execute as migrations: npm run migrate:up');
    }
    
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ ERRO ao verificar sistema:', error.message);
    console.error(error);
  } finally {
    await pool.end();
    console.log('\n🏁 Verificação concluída.');
  }
}

// Executar
checkLifecycleSystem();

