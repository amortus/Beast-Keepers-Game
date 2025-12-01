/**
 * Auto-fix Schema - Garante que colunas necessárias existem
 * Roda automaticamente quando o servidor inicia
 */

import { query } from './connection';

export async function autoFixSchema(): Promise<void> {
  try {
    console.log('[DB] 🔧 Verificando schema do banco de dados...');
    
    // Verificar se current_action existe
    const checkColumn = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'beasts' AND column_name = 'current_action';
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('[DB] ⚠️ Coluna current_action não existe. Criando...');
      
      // Criar current_action e outras colunas necessárias
      await query(`
        ALTER TABLE beasts
        ADD COLUMN IF NOT EXISTS current_action JSONB DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS last_exploration BIGINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS exploration_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_tournament BIGINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS birth_date BIGINT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS last_update BIGINT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS work_bonus_count INTEGER DEFAULT 0;
      `);
      
      console.log('[DB] ✅ Colunas criadas com sucesso!');
      
      // Criar índices
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_current_action ON beasts USING GIN (current_action);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_last_exploration ON beasts(last_exploration);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_last_tournament ON beasts(last_tournament);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_birth_date ON beasts(birth_date);
      `);
      
      console.log('[DB] ✅ Índices criados com sucesso!');
    } else {
      console.log('[DB] ✅ Schema está correto!');
    }
    
    // Atualizar birth_date para bestas existentes que não têm
    await query(`
      UPDATE beasts
      SET birth_date = EXTRACT(EPOCH FROM created_at) * 1000
      WHERE birth_date IS NULL;
    `);
    
    // Atualizar last_update para bestas existentes
    await query(`
      UPDATE beasts
      SET last_update = EXTRACT(EPOCH FROM NOW()) * 1000
      WHERE last_update IS NULL;
    `);
    
    // Verificar se tabelas PVP existem
    const checkPvpTables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' 
        AND table_name IN ('pvp_rankings', 'pvp_matches', 'pvp_matchmaking_queue', 'pvp_seasons', 'pvp_direct_challenges');
    `);
    
    const existingPvpTables = checkPvpTables.rows.map((r: any) => r.table_name);
    const requiredPvpTables = ['pvp_rankings', 'pvp_matches', 'pvp_matchmaking_queue', 'pvp_seasons', 'pvp_direct_challenges'];
    const missingPvpTables = requiredPvpTables.filter(t => !existingPvpTables.includes(t));
    
    if (missingPvpTables.length > 0) {
      console.log('[DB] ⚠️ Tabelas PVP não encontradas. Executando migration...');
      try {
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, 'migrations', '002_pvp_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await query(migrationSQL);
        console.log('[DB] ✅ Migration PVP executada com sucesso!');
      } catch (migrationError: any) {
        console.error('[DB] ❌ Erro ao executar migration PVP:', migrationError.message);
        // Não lançar erro - deixar servidor continuar
      }
    } else {
      console.log('[DB] ✅ Tabelas PVP já existem!');
    }
    
    // Verificar se a coluna 'status' existe na tabela pvp_seasons
    const checkStatusColumn = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pvp_seasons' AND column_name = 'status';
    `);
    
    if (checkStatusColumn.rows.length === 0) {
      console.log('[DB] ⚠️ Coluna status não existe em pvp_seasons. Adicionando...');
      try {
        await query(`
          ALTER TABLE pvp_seasons
          ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
        `);
        
        // Criar índice se não existir
        await query(`
          CREATE INDEX IF NOT EXISTS idx_pvp_seasons_status ON pvp_seasons(status);
        `);
        
        console.log('[DB] ✅ Coluna status adicionada com sucesso!');
      } catch (statusError: any) {
        console.error('[DB] ❌ Erro ao adicionar coluna status:', statusError.message);
      }
    }
    
    // Verificar se outras colunas necessárias existem em pvp_seasons
    const checkPvpSeasonsColumns = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pvp_seasons';
    `);
    
    const existingColumns = checkPvpSeasonsColumns.rows.map((r: any) => r.column_name);
    const requiredColumns = ['id', 'number', 'name', 'start_date', 'end_date', 'status', 'rewards_config', 'created_at', 'updated_at'];
    const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));
    
    // Verificar se existe season_number (da migration 012) e precisa ser convertido para number
    if (existingColumns.includes('season_number') && !existingColumns.includes('number')) {
      console.log('[DB] ⚠️ Tabela pvp_seasons usa season_number. Convertendo para number...');
      try {
        // Criar coluna number copiando valores de season_number
        await query(`
          ALTER TABLE pvp_seasons 
          ADD COLUMN IF NOT EXISTS number INTEGER;
        `);
        await query(`
          UPDATE pvp_seasons 
          SET number = season_number 
          WHERE number IS NULL;
        `);
        await query(`
          ALTER TABLE pvp_seasons 
          ALTER COLUMN number SET NOT NULL;
        `);
        await query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_pvp_seasons_number ON pvp_seasons(number);
        `);
        console.log('[DB] ✅ Coluna number criada a partir de season_number!');
      } catch (convertError: any) {
        console.error('[DB] ❌ Erro ao converter season_number:', convertError.message);
      }
    }
    
    if (missingColumns.length > 0 && existingColumns.length > 0) {
      console.log('[DB] ⚠️ Colunas faltando em pvp_seasons:', missingColumns.join(', '));
      try {
        // Adicionar colunas que faltam
        if (!existingColumns.includes('id') && !existingColumns.includes('season_number')) {
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS id SERIAL;`);
          // Não fazer PRIMARY KEY se já existe season_number como PK
        }
        if (!existingColumns.includes('number') && !existingColumns.includes('season_number')) {
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS number INTEGER NOT NULL UNIQUE;`);
        }
        if (!existingColumns.includes('name')) {
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT 'Season ' || COALESCE((SELECT MAX(COALESCE(number, season_number)) FROM pvp_seasons), 0) + 1;`);
        }
        if (!existingColumns.includes('rewards_config')) {
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS rewards_config JSONB DEFAULT '{}'::jsonb;`);
        }
        if (!existingColumns.includes('updated_at')) {
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);
        }
        console.log('[DB] ✅ Colunas adicionadas com sucesso!');
      } catch (columnError: any) {
        console.error('[DB] ❌ Erro ao adicionar colunas:', columnError.message);
      }
    }
    
    console.log('[DB] ✅ Auto-fix concluído!');
    
  } catch (error: any) {
    console.error('[DB] ❌ Erro ao verificar/corrigir schema:', error.message);
    // Não lançar erro - deixar servidor continuar mesmo se falhar
  }
}

