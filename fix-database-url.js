/**
 * Script para corrigir DATABASE_URL automaticamente
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'server', '.env');
let content = fs.readFileSync(envPath, 'utf8');

console.log('🔧 Corrigindo DATABASE_URL...\n');
console.log('Antes:');
console.log(content.split('\n').find(line => line.includes('DATABASE_URL')));

// Remover psql ' e aspas extras
content = content.replace(/DATABASE_URL=psql '/, 'DATABASE_URL=');
content = content.replace(/&channel_binding=require'/, '');

fs.writeFileSync(envPath, content);

console.log('\nDepois:');
const fixed = fs.readFileSync(envPath, 'utf8');
console.log(fixed.split('\n').find(line => line.includes('DATABASE_URL')));

console.log('\n✅ DATABASE_URL corrigida!');
console.log('📝 Agora rode: npm run migrate');

