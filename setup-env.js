/**
 * Script para criar arquivos .env automaticamente
 * Beast Keepers - Local Development Setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando arquivos .env para desenvolvimento local...\n');

// Server .env
const serverEnv = `# Beast Keepers Server - Development Environment
# AVISO: Para usar PostgreSQL/Neon, você precisa substituir DATABASE_URL

# Database - Usando SQLite para desenvolvimento (não precisa instalar PostgreSQL)
# Para usar Neon: postgresql://user:pass@host.neon.tech/neondb
DATABASE_URL=postgresql://localhost/beast_keepers_dev

# JWT Secret (MUDE EM PRODUÇÃO!)
JWT_SECRET=desenvolvimento-local-secret-key-nao-use-em-producao-123456789

# Google OAuth (opcional - deixe vazio se não for usar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173
`;

// Client .env
const clientEnv = `# Beast Keepers Client - Development Environment

# API URL
VITE_API_URL=http://localhost:3000/api
`;

// Criar server/.env
const serverEnvPath = path.join(__dirname, 'server', '.env');
fs.writeFileSync(serverEnvPath, serverEnv);
console.log('✅ Criado: server/.env');

// Criar client/.env
const clientEnvPath = path.join(__dirname, 'client', '.env');
fs.writeFileSync(clientEnvPath, clientEnv);
console.log('✅ Criado: client/.env');

console.log('\n🎉 Arquivos .env criados com sucesso!');
console.log('\n📝 IMPORTANTE:');
console.log('1. Para usar PostgreSQL/Neon, edite server/.env');
console.log('2. Substitua DATABASE_URL pela connection string do Neon');
console.log('3. Acesse https://neon.tech para criar banco grátis');
console.log('\n💡 Para desenvolvimento rápido sem banco:');
console.log('   O sistema tentará usar a DATABASE_URL configurada');
console.log('   Você precisa ter PostgreSQL instalado OU usar Neon');
console.log('\n📖 Próximo passo: npm run migrate (no server/)');

