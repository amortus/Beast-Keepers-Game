const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beast_keepers'
});

async function verify() {
  console.log('📊 Verificando schema do banco...\n');
  
  const columns = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'game_saves' 
    ORDER BY ordinal_position;
  `);
  
  console.log(`📋 Colunas em game_saves (${columns.rows.length} total):\n`);
  
  const newColumns = [
    'daily_challenges', 'challenge_streak', 'beast_memorials', 
    'current_beast_lineage', 'relic_history', 'dungeon_progress', 
    'stamina', 'last_stamina_regen', 'beast_equipment', 
    'ranch_decorations', 'ranch_theme', 'stats_tracker'
  ];
  
  newColumns.forEach(col => {
    const exists = columns.rows.find(r => r.column_name === col);
    if (exists) {
      console.log(`   ✅ ${col} (${exists.data_type})`);
    } else {
      console.log(`   ❌ ${col} - NÃO EXISTE`);
    }
  });
  
  await pool.end();
}

verify();

