/**
 * Script para iniciar PostgreSQL no Windows
 */

const { execSync } = require('child_process');
const { Pool } = require('pg');

async function startPostgres() {
  console.log('🚀 Tentando iniciar PostgreSQL...\n');
  
  // Tentar diferentes métodos
  const methods = [
    {
      name: 'WSL',
      command: 'wsl -e sudo service postgresql start',
      check: 'wsl -e sudo service postgresql status'
    },
    {
      name: 'Windows Service (PostgreSQL 14)',
      command: 'net start postgresql-x64-14',
      check: 'sc query postgresql-x64-14'
    },
    {
      name: 'Windows Service (PostgreSQL 15)',
      command: 'net start postgresql-x64-15',
      check: 'sc query postgresql-x64-15'
    },
    {
      name: 'Windows Service (PostgreSQL 16)',
      command: 'net start postgresql-x64-16',
      check: 'sc query postgresql-x64-16'
    }
  ];
  
  for (const method of methods) {
    try {
      console.log(`📝 Tentando: ${method.name}...`);
      execSync(method.command, { stdio: 'ignore', timeout: 5000 });
      console.log(`   ✅ Comando executado com sucesso!`);
      
      // Aguardar 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Testar conexão
      const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'beast_keepers',
        password: 'postgres',
        port: 5432,
      });
      
      try {
        await pool.query('SELECT NOW()');
        console.log(`   ✅ PostgreSQL conectado com sucesso via ${method.name}!\n`);
        
        // Executar auto-fix
        console.log('🔧 Executando auto-fix do banco...');
        const { autoFixDatabase } = require('./auto-fix-database.js');
        await autoFixDatabase(pool);
        
        await pool.end();
        
        console.log('\n✅ TUDO PRONTO!');
        console.log('\n💡 Próximos passos:');
        console.log('   1. O servidor já deve estar rodando');
        console.log('   2. Acesse http://localhost:5173');
        console.log('   3. Faça login e teste as ações!\n');
        
        return true;
      } catch (error) {
        await pool.end();
        console.log(`   ⚠️ PostgreSQL iniciou mas não conectou ainda. Tentando próximo método...\n`);
      }
      
    } catch (error) {
      console.log(`   ⚠️ Método não funcionou. Tentando próximo...\n`);
    }
  }
  
  console.log('❌ Não foi possível iniciar PostgreSQL automaticamente.\n');
  console.log('💡 Soluções:');
  console.log('   1. Abra o WSL manualmente e execute: sudo service postgresql start');
  console.log('   2. OU inicie o serviço PostgreSQL pelo Gerenciador de Serviços do Windows');
  console.log('   3. OU use a versão de produção (já está no ar!)\n');
  
  return false;
}

startPostgres().catch(console.error);

