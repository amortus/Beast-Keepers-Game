/**
 * Script para executar apenas as novas migrations (009-017)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beast_keepers'
});

const NEW_MIGRATIONS = [
  '009_daily_challenges.sql',
  '010_beast_lifecycle.sql',
  '011_relic_history.sql',
  '012_pvp_system.sql',
  '013_dungeon_progress.sql',
  '014_equipment.sql',
  '015_ranch_customization.sql',
  '016_guild_system.sql',
  '017_player_stats.sql',
];

async function runNewMigrations() {
  console.log('🔄 Executando novas migrations (009-017)...\n');
  
  try {
    for (const migrationFile of NEW_MIGRATIONS) {
      const filePath = path.join(__dirname, 'src', 'db', 'migrations', migrationFile);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Arquivo não encontrado: ${migrationFile}`);
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📝 Executando: ${migrationFile}...`);
      
      try {
        await pool.query(sql);
        console.log(`✅ ${migrationFile} - Sucesso!\n`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`⚠️  ${migrationFile} - Coluna já existe (OK)\n`);
        } else if (err.code === '42P07') {
          console.log(`⚠️  ${migrationFile} - Tabela/índice já existe (OK)\n`);
        } else {
          console.error(`❌ ${migrationFile} - Erro:`, err.message);
          console.log('');
        }
      }
    }
    
    console.log('\n✅ Todas as migrations foram processadas!');
    console.log('\n📊 Verificando schema...\n');
    
    // Verificar novas colunas
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'game_state' 
      AND column_name IN (
        'daily_challenges', 'challenge_streak', 'beast_memorials',
        'current_beast_lineage', 'relic_history', 'dungeon_progress',
        'stamina', 'last_stamina_regen', 'beast_equipment',
        'ranch_decorations', 'ranch_theme', 'stats_tracker'
      )
      ORDER BY column_name;
    `);
    
    console.log('📋 Novas colunas em game_state:');
    columns.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name} (${row.data_type})`);
    });
    
    // Verificar novas tabelas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'pvp_rankings', 'pvp_battles', 'pvp_seasons',
        'guilds', 'guild_members', 'guild_wars'
      )
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Novas tabelas criadas:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    console.log('\n🎉 Schema atualizado com sucesso!\n');
    
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runNewMigrations();

