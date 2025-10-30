const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beast_keepers',
  password: 'postgres',
  port: 5432,
});

async function test() {
  try {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'beasts' AND column_name = 'current_action';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ SUCESSO! Coluna current_action existe!');
      console.log('✅ O sistema de ações deve funcionar agora!');
    } else {
      console.log('❌ Coluna current_action ainda não existe.');
      console.log('⚠️ O auto-fix pode não ter rodado. PostgreSQL pode não estar rodando.');
    }
    
    await pool.end();
  } catch (error) {
    console.log('❌ Erro:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️ PostgreSQL não está rodando!');
    }
    await pool.end();
  }
}

test();

