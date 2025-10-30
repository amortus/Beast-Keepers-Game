const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beast_keepers'
});

async function run() {
  const sql = fs.readFileSync('./simple-migrations.sql', 'utf8');
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  
  console.log(`🔄 Executando ${statements.length} statements...\n`);
  
  for (const statement of statements) {
    try {
      await pool.query(statement);
      console.log('✅ OK');
    } catch (err) {
      if (err.code === '42701' || err.code === '42P07') {
        console.log('⚠️  Já existe (OK)');
      } else {
        console.log('❌', err.message);
      }
    }
  }
  
  console.log('\n✅ Migrations completas!');
  await pool.end();
}

run();

