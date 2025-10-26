# Beast Keepers Server Setup

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado localmente ou acesso a PostgreSQL na nuvem
- Git

## 🗄️ Setup do Banco de Dados

### Opção 1: PostgreSQL Local

1. Instale o PostgreSQL: https://www.postgresql.org/download/

2. Crie um banco de dados:
```bash
createdb beast_keepers
```

3. Configure a variável de ambiente:
```
DATABASE_URL=postgresql://postgres:senha@localhost:5432/beast_keepers
```

### Opção 2: PostgreSQL na Nuvem (Recomendado)

Opções gratuitas:
- **Neon**: https://neon.tech (Serverless PostgreSQL)
- **Supabase**: https://supabase.com (Backend completo)
- **Vercel Postgres**: https://vercel.com/storage/postgres

Após criar, copie a connection string fornecida.

## ⚙️ Configuração

1. Navegue até a pasta do servidor:
```bash
cd server
```

2. Copie o arquivo de exemplo de environment:
```bash
copy env.example .env
```

3. Edite o arquivo `.env` com suas credenciais:
```env
DATABASE_URL=postgresql://seu-usuario:sua-senha@host:5432/beast_keepers
JWT_SECRET=uma-chave-secreta-muito-longa-e-aleatoria
GOOGLE_CLIENT_ID=(opcional - para OAuth Google)
GOOGLE_CLIENT_SECRET=(opcional - para OAuth Google)
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## 🚀 Rodar Migrations

Execute as migrations para criar as tabelas do banco:

```bash
npm run migrate
```

Você deve ver:
```
[Migration] Starting database migrations...
[Migration] Running 001_initial_schema.sql...
[Migration] ✓ 001_initial_schema.sql completed successfully
[Migration] All migrations completed successfully!
```

## 🏃 Iniciar Servidor

### Modo Desenvolvimento (com hot-reload):
```bash
npm run dev
```

### Modo Produção:
```bash
npm run build
npm start
```

O servidor estará disponível em: `http://localhost:3000`

## 🧪 Testar API

### Health Check:
```bash
curl http://localhost:3000/health
```

### Registrar usuário:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123",
    "displayName": "Test User"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123"
  }'
```

## 📁 Estrutura do Projeto

```
server/
├── src/
│   ├── controllers/      # Lógica de negócio
│   │   └── authController.ts
│   ├── routes/          # Definição de rotas
│   │   └── auth.ts
│   ├── middleware/      # Middleware (auth, etc)
│   │   └── auth.ts
│   ├── db/             # Banco de dados
│   │   ├── connection.ts
│   │   ├── migrate.ts
│   │   └── migrations/
│   │       └── 001_initial_schema.sql
│   ├── models/         # Modelos (futuros)
│   └── index.ts        # Entry point
├── package.json
└── tsconfig.json
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação.

### Endpoints disponíveis:

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual (requer token)
- `POST /api/auth/logout` - Logout (apenas client-side)

### Usar token:

Após login/registro, você receberá um token. Use-o assim:

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🐛 Troubleshooting

### Erro: "Failed to connect to database"
- Verifique se o PostgreSQL está rodando
- Verifique a connection string no `.env`
- Teste a conexão manualmente com `psql`

### Erro: "Port 3000 is already in use"
- Altere a `PORT` no `.env`
- Ou mate o processo: `npx kill-port 3000`

### Erro de migrations
- Certifique-se que o banco existe
- Verifique permissões do usuário do banco
- Rode manualmente: `npm run migrate`

## 📦 Próximos Passos

1. ✅ Autenticação básica (email/senha) - FEITO
2. 🔄 Google OAuth
3. 🔄 Endpoints de Game State
4. 🔄 Integração com Frontend
5. 🔄 Deploy na Vercel

## 🆘 Precisa de Ajuda?

Problemas? Abra uma issue no GitHub ou consulte a documentação completa.

