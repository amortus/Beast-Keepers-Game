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
    
    // Verificar se tabela pvp_seasons existe e adicionar colunas necessárias
    const checkPvpSeasonsTable = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'pvp_seasons';
    `);
    
    if (checkPvpSeasonsTable.rows.length > 0) {
      console.log('[DB] 🔧 Verificando estrutura da tabela pvp_seasons...');
      
      // Verificar colunas existentes
      const checkPvpSeasonsColumns = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'pvp_seasons';
      `);
      
      const existingColumns = checkPvpSeasonsColumns.rows.map((r: any) => r.column_name);
      console.log('[DB] Colunas existentes:', existingColumns.join(', '));
      
      // Adicionar colunas que faltam
      try {
        // Status
        if (!existingColumns.includes('status')) {
          console.log('[DB] ⚠️ Adicionando coluna status...');
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`);
          await query(`UPDATE pvp_seasons SET status = 'active' WHERE status IS NULL;`);
          await query(`ALTER TABLE pvp_seasons ALTER COLUMN status SET NOT NULL;`);
          await query(`CREATE INDEX IF NOT EXISTS idx_pvp_seasons_status ON pvp_seasons(status);`);
        }
        
        // Name
        if (!existingColumns.includes('name')) {
          console.log('[DB] ⚠️ Adicionando coluna name...');
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS name VARCHAR(100);`);
          // Preencher valores padrão
          if (existingColumns.includes('season_number')) {
            await query(`UPDATE pvp_seasons SET name = 'Temporada ' || season_number WHERE name IS NULL;`);
          } else if (existingColumns.includes('number')) {
            await query(`UPDATE pvp_seasons SET name = 'Temporada ' || number WHERE name IS NULL;`);
          } else {
            await query(`UPDATE pvp_seasons SET name = 'Temporada 1' WHERE name IS NULL;`);
          }
          await query(`ALTER TABLE pvp_seasons ALTER COLUMN name SET NOT NULL;`);
        }
        
        // Number (se não existe e tem season_number)
        if (!existingColumns.includes('number') && existingColumns.includes('season_number')) {
          console.log('[DB] ⚠️ Adicionando coluna number a partir de season_number...');
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS number INTEGER;`);
          await query(`UPDATE pvp_seasons SET number = season_number WHERE number IS NULL;`);
          await query(`ALTER TABLE pvp_seasons ALTER COLUMN number SET NOT NULL;`);
          await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_pvp_seasons_number_unique ON pvp_seasons(number);`);
        } else if (!existingColumns.includes('number') && !existingColumns.includes('season_number')) {
          console.log('[DB] ⚠️ Adicionando coluna number...');
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS number INTEGER NOT NULL UNIQUE;`);
        }
        
        // Rewards config
        if (!existingColumns.includes('rewards_config')) {
          console.log('[DB] ⚠️ Adicionando coluna rewards_config...');
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS rewards_config JSONB DEFAULT '{}'::jsonb;`);
        }
        
        // Updated at
        if (!existingColumns.includes('updated_at')) {
          console.log('[DB] ⚠️ Adicionando coluna updated_at...');
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);
        }
        
        // Id (se não existe e não tem season_number como PK)
        if (!existingColumns.includes('id') && !existingColumns.includes('season_number')) {
          console.log('[DB] ⚠️ Adicionando coluna id...');
          await query(`ALTER TABLE pvp_seasons ADD COLUMN IF NOT EXISTS id SERIAL;`);
        }
        
        console.log('[DB] ✅ Estrutura da tabela pvp_seasons verificada e corrigida!');
      } catch (fixError: any) {
        console.error('[DB] ❌ Erro ao corrigir estrutura:', fixError.message);
      }
    }
    
    
    console.log('[DB] ✅ Auto-fix concluído!');
    
  } catch (error: any) {
    console.error('[DB] ❌ Erro ao verificar/corrigir schema:', error.message);
    // Não lançar erro - deixar servidor continuar mesmo se falhar
  }
}

