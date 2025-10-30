/**
 * Auto-fix do banco de dados
 */

async function autoFixDatabase(pool) {
  try {
    console.log('🔧 Verificando schema...');
    
    // Verificar se current_action existe
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'beasts' AND column_name = 'current_action';
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('   ⚠️ Coluna current_action não existe. Criando...');
      
      // Criar colunas
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
      
      console.log('   ✅ Colunas criadas!');
      
      // Criar índices
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_current_action ON beasts USING GIN (current_action);
        CREATE INDEX IF NOT EXISTS idx_beasts_last_exploration ON beasts(last_exploration);
        CREATE INDEX IF NOT EXISTS idx_beasts_last_tournament ON beasts(last_tournament);
        CREATE INDEX IF NOT EXISTS idx_beasts_birth_date ON beasts(birth_date);
      `);
      
      console.log('   ✅ Índices criados!');
      
      // Atualizar bestas existentes
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
      
      console.log('   ✅ Dados atualizados!');
      
    } else {
      console.log('   ✅ Schema já está correto!');
    }
    
    return true;
    
  } catch (error) {
    console.error('   ❌ Erro ao corrigir banco:', error.message);
    return false;
  }
}

module.exports = { autoFixDatabase };

