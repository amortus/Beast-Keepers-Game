/**
 * Script de Análise Completa do Banco de Dados
 * Verifica estrutura, dados e integridade
 */

import { query } from './connection';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeDatabase() {
  try {
    console.log('='.repeat(60));
    console.log('📊 ANÁLISE COMPLETA DO BANCO DE DADOS');
    console.log('='.repeat(60));
    console.log('');

    // 1. Verificar tabelas existentes
    console.log('📋 1. TABELAS EXISTENTES:');
    console.log('-'.repeat(60));
    const tablesResult = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Nenhuma tabela encontrada no schema public!');
    } else {
      tablesResult.rows.forEach((row: any) => {
        console.log(`   ✓ ${row.table_name} (${row.column_count} colunas)`);
      });
    }
    console.log('');

    // 2. Contar registros por tabela
    console.log('📊 2. CONTAGEM DE REGISTROS:');
    console.log('-'.repeat(60));
    
    const tableNames = tablesResult.rows.map((r: any) => r.table_name);
    
    for (const tableName of tableNames) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);
        const icon = count > 0 ? '✅' : '⚠️';
        console.log(`   ${icon} ${tableName}: ${count} registro(s)`);
      } catch (error: any) {
        console.log(`   ❌ ${tableName}: Erro ao contar - ${error.message}`);
      }
    }
    console.log('');

    // 3. Análise de USERS
    console.log('👥 3. ANÁLISE DE USUÁRIOS:');
    console.log('-'.repeat(60));
    try {
      const usersResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as com_senha,
          COUNT(CASE WHEN google_id IS NOT NULL THEN 1 END) as com_google,
          COUNT(CASE WHEN password_hash IS NULL AND google_id IS NULL THEN 1 END) as sem_auth
        FROM users;
      `);
      
      const stats = usersResult.rows[0];
      console.log(`   Total de usuários: ${stats.total}`);
      console.log(`   Com senha: ${stats.com_senha}`);
      console.log(`   Com Google OAuth: ${stats.com_google}`);
      console.log(`   Sem autenticação: ${stats.sem_auth}`);
      
      if (parseInt(stats.total) > 0) {
        const usersList = await query(`
          SELECT id, email, display_name, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 10;
        `);
        
        console.log('\n   Últimos usuários criados:');
        usersList.rows.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ${user.email} (${user.display_name}) - ID: ${user.id}`);
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    // 4. Análise de GAME_SAVES
    console.log('💾 4. ANÁLISE DE GAME SAVES:');
    console.log('-'.repeat(60));
    try {
      const savesResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT user_id) as usuarios_com_save,
          AVG(week) as media_week,
          AVG(coronas) as media_coronas,
          SUM(victories) as total_victories
        FROM game_saves;
      `);
      
      const stats = savesResult.rows[0];
      console.log(`   Total de saves: ${stats.total}`);
      console.log(`   Usuários com save: ${stats.usuarios_com_save}`);
      console.log(`   Média de semana: ${parseFloat(stats.media_week || 0).toFixed(1)}`);
      console.log(`   Média de coronas: ${parseFloat(stats.media_coronas || 0).toFixed(0)}`);
      console.log(`   Total de vitórias: ${stats.total_victories || 0}`);
      
      // Verificar saves órfãos (sem usuário)
      const orphanSaves = await query(`
        SELECT COUNT(*) as count
        FROM game_saves gs
        LEFT JOIN users u ON gs.user_id = u.id
        WHERE u.id IS NULL;
      `);
      
      if (parseInt(orphanSaves.rows[0].count) > 0) {
        console.log(`   ⚠️  Saves órfãos (sem usuário): ${orphanSaves.rows[0].count}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    // 5. Análise de BEASTS
    console.log('🐉 5. ANÁLISE DE BEASTS:');
    console.log('-'.repeat(60));
    try {
      const beastsResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT game_save_id) as saves_com_beast,
          COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inativos,
          AVG(level) as media_level,
          AVG(current_hp) as media_hp
        FROM beasts;
      `);
      
      const stats = beastsResult.rows[0];
      console.log(`   Total de beasts: ${stats.total}`);
      console.log(`   Saves com beasts: ${stats.saves_com_beast}`);
      console.log(`   Ativos: ${stats.ativos}`);
      console.log(`   Inativos: ${stats.inativos}`);
      console.log(`   Média de level: ${parseFloat(stats.media_level || 0).toFixed(1)}`);
      console.log(`   Média de HP: ${parseFloat(stats.media_hp || 0).toFixed(0)}`);
      
      // Top beasts por level
      if (parseInt(stats.total) > 0) {
        const topBeasts = await query(`
          SELECT b.name, b.line, b.level, b.current_hp, b.max_hp, gs.player_name
          FROM beasts b
          JOIN game_saves gs ON b.game_save_id = gs.id
          WHERE b.is_active = true
          ORDER BY b.level DESC, b.current_hp DESC
          LIMIT 5;
        `);
        
        if (topBeasts.rows.length > 0) {
          console.log('\n   Top 5 beasts (por level):');
          topBeasts.rows.forEach((beast: any, index: number) => {
            console.log(`   ${index + 1}. ${beast.name} (${beast.line}) - Level ${beast.level} - HP: ${beast.current_hp}/${beast.max_hp} - Player: ${beast.player_name}`);
          });
        }
      }
      
      // Verificar beasts órfãos
      const orphanBeasts = await query(`
        SELECT COUNT(*) as count
        FROM beasts b
        LEFT JOIN game_saves gs ON b.game_save_id = gs.id
        WHERE gs.id IS NULL;
      `);
      
      if (parseInt(orphanBeasts.rows[0].count) > 0) {
        console.log(`   ⚠️  Beasts órfãos (sem game_save): ${orphanBeasts.rows[0].count}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    // 6. Verificar integridade referencial
    console.log('🔗 6. INTEGRIDADE REFERENCIAL:');
    console.log('-'.repeat(60));
    
    // Users sem game_save
    try {
      const usersWithoutSave = await query(`
        SELECT COUNT(*) as count
        FROM users u
        LEFT JOIN game_saves gs ON u.id = gs.user_id
        WHERE gs.id IS NULL;
      `);
      const count = parseInt(usersWithoutSave.rows[0].count);
      if (count > 0) {
        console.log(`   ⚠️  Usuários sem game_save: ${count}`);
      } else {
        console.log(`   ✅ Todos os usuários têm game_save`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erro ao verificar: ${error.message}`);
    }
    
    // Game_saves sem beasts
    try {
      const savesWithoutBeasts = await query(`
        SELECT COUNT(*) as count
        FROM game_saves gs
        LEFT JOIN beasts b ON gs.id = b.game_save_id
        WHERE b.id IS NULL;
      `);
      const count = parseInt(savesWithoutBeasts.rows[0].count);
      if (count > 0) {
        console.log(`   ⚠️  Game_saves sem beasts: ${count}`);
      } else {
        console.log(`   ✅ Todos os game_saves têm beasts`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erro ao verificar: ${error.message}`);
    }
    console.log('');

    // 7. Verificar colunas importantes
    console.log('🔍 7. VERIFICAÇÃO DE COLUNAS:');
    console.log('-'.repeat(60));
    
    const importantColumns = [
      { table: 'beasts', columns: ['current_action', 'birth_date', 'last_update', 'exploration_count'] },
      { table: 'users', columns: ['password_hash', 'google_id'] },
    ];
    
    for (const { table, columns } of importantColumns) {
      try {
        const columnCheck = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 
            AND column_name = ANY($2::text[]);
        `, [table, columns]);
        
        const existingColumns = columnCheck.rows.map((r: any) => r.column_name);
        const missingColumns = columns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length === 0) {
          console.log(`   ✅ ${table}: Todas as colunas importantes existem`);
        } else {
          console.log(`   ⚠️  ${table}: Colunas faltando: ${missingColumns.join(', ')}`);
        }
      } catch (error: any) {
        console.log(`   ❌ Erro ao verificar ${table}: ${error.message}`);
      }
    }
    console.log('');

    // 8. Resumo final
    console.log('='.repeat(60));
    console.log('📋 RESUMO:');
    console.log('='.repeat(60));
    
    const totalUsers = await query('SELECT COUNT(*) as count FROM users');
    const totalSaves = await query('SELECT COUNT(*) as count FROM game_saves');
    const totalBeasts = await query('SELECT COUNT(*) as count FROM beasts');
    
    console.log(`   Usuários: ${totalUsers.rows[0].count}`);
    console.log(`   Game Saves: ${totalSaves.rows[0].count}`);
    console.log(`   Beasts: ${totalBeasts.rows[0].count}`);
    console.log('');
    console.log('✅ Análise concluída!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  } finally {
    process.exit(0);
  }
}

analyzeDatabase();

