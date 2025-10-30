/**
 * Auto-fix standalone - Não depende de imports TypeScript
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beast_keepers',
  password: 'postgres',
  port: 5432,
});

async function fix() {
  try {
    console.log('🔧 Conectando ao PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado!\n');
    
    console.log('🔍 Verificando schema...');
    
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'beasts' AND column_name = 'current_action';
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('⚠️ Coluna current_action NÃO existe. Criando...\n');
      
      console.log('📝 Criando colunas...');
      await pool.query(`
        ALTER TABLE beasts
        ADD COLUMN IF NOT EXISTS current_action JSONB DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS last_exploration BIGINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS exploration_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_tournament BIGINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS birth_date BIGINT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS last_update BIGINT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS work_bonus_count INTEGER DEFAULT 0;
      `);
      console.log('✅ Colunas criadas!');
      
      console.log('📝 Criando índices...');
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_current_action ON beasts USING GIN (current_action);
        CREATE INDEX IF NOT EXISTS idx_beasts_last_exploration ON beasts(last_exploration);
        CREATE INDEX IF NOT EXISTS idx_beasts_last_tournament ON beasts(last_tournament);
        CREATE INDEX IF NOT EXISTS idx_beasts_birth_date ON beasts(birth_date);
      `);
      console.log('✅ Índices criados!');
      
      console.log('📝 Atualizando bestas existentes...');
      await pool.query(`
        UPDATE beasts
        SET birth_date = EXTRACT(EPOCH FROM created_at) * 1000
        WHERE birth_date IS NULL;
      `);
      await pool.query(`
        UPDATE beasts
        SET last_update = EXTRACT(EPOCH FROM NOW()) * 1000
        WHERE last_update IS NULL;
      `);
      console.log('✅ Dados atualizados!');
      
    } else {
      console.log('✅ Coluna current_action JÁ EXISTE!');
    }
    
    // Mostrar todas as colunas de tempo real
    console.log('\n📋 Verificação final:');
    const columns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'beasts' 
        AND column_name IN (
          'current_action', 'last_exploration', 'exploration_count',
          'last_tournament', 'birth_date', 'last_update', 'work_bonus_count'
        )
      ORDER BY column_name;
    `);
    
    columns.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });
    
    await pool.end();
    
    console.log('\n✅✅✅ AUTO-FIX CONCLUÍDO COM SUCESSO! ✅✅✅');
    console.log('\n💡 Agora o sistema de ações vai funcionar!');
    console.log('   - Treinar');
    console.log('   - Descansar'); 
    console.log('   - Trabalhar\n');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fix();

