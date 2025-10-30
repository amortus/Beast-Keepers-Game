const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beast_keepers'
});

async function addMissing() {
  console.log('🔄 Adicionando colunas faltantes...\n');
  
  const columns = [
    { name: 'daily_challenges', type: 'JSONB', default: "'[]'::jsonb" },
    { name: 'beast_memorials', type: 'JSONB', default: "'[]'::jsonb" },
    { name: 'relic_history', type: 'JSONB', default: "'[]'::jsonb" },
    { name: 'dungeon_progress', type: 'JSONB', default: "'{}'::jsonb" },
    { name: 'beast_equipment', type: 'JSONB', default: "'{\"mask\": null, \"armor\": null, \"weapon\": null, \"amulet\": null}'::jsonb" },
    { name: 'ranch_decorations', type: 'JSONB', default: "'[]'::jsonb" },
    { name: 'stats_tracker', type: 'JSONB', default: "'{\"totalDefeats\": 0, \"longestStreak\": 0}'::jsonb" },
  ];
  
  for (const col of columns) {
    try {
      const sql = `ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default}`;
      await pool.query(sql);
      console.log(`✅ ${col.name} adicionada`);
    } catch (err) {
      if (err.code === '42701') {
        console.log(`⚠️  ${col.name} já existe`);
      } else {
        console.log(`❌ ${col.name} - ${err.message}`);
      }
    }
  }
  
  console.log('\n✅ Concluído!');
  await pool.end();
}

addMissing();

