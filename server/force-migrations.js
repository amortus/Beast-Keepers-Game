/**
 * Script para forçar todas as migrations ignorando erros de duplicação
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beast_keepers'
});

async function forceMigrations() {
  console.log('🔄 Forçando execução de TODAS as migrations...\n');
  
  const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`📁 Encontrados ${files.length} arquivos de migration\n`);
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Dividir SQL em statements individuais
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 ${file} (${statements.length} statements)...`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        successCount++;
      } catch (err) {
        // Códigos de erro que podemos ignorar (objeto já existe)
        if (['42P07', '42701', '42710'].includes(err.code)) {
          skipCount++;
        } else {
          console.log(`   ⚠️  Erro: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    if (errorCount === 0) {
      console.log(`   ✅ ${successCount} ok, ${skipCount} já existiam\n`);
    } else {
      console.log(`   ⚠️  ${successCount} ok, ${skipCount} já existiam, ${errorCount} erros\n`);
    }
  }
  
  console.log('\n📊 Verificando schema final...\n');
  
  // Verificar tabelas
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  console.log('📋 Tabelas no banco:');
  tables.rows.forEach(row => {
    console.log(`   • ${row.table_name}`);
  });
  
  // Verificar colunas de game_state se existir
  const gameStateExists = tables.rows.some(r => r.table_name === 'game_state');
  
  if (gameStateExists) {
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'game_state' 
      ORDER BY ordinal_position;
    `);
    
    console.log(`\n📋 Colunas em game_state (${columns.rows.length} total):`);
    columns.rows.forEach(row => {
      console.log(`   • ${row.column_name} (${row.data_type})`);
    });
  } else {
    console.log('\n⚠️  Tabela game_state não foi criada!');
    console.log('   Verifique a migration 001_initial_schema.sql');
  }
  
  console.log('\n✅ Verificação completa!\n');
  
  await pool.end();
}

forceMigrations().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});

