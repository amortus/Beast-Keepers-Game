# ⚡ Quick Start - Teste Local

## 🎯 Setup Rápido (15 minutos)

### Passo 1: Database (Neon - Grátis)

1. **Acesse**: https://neon.tech
2. **Registre-se** (grátis, sem cartão)
3. **Crie projeto**: "beast-keepers"
4. **Copie** a connection string (aparece assim):
   ```
   postgresql://user:pass@ep-xxxxx.us-east-2.aws.neon.tech/neondb
   ```

### Passo 2: Configure Server

1. Crie arquivo `.env` no server:
```bash
cd server
echo. > .env
```

2. Cole este conteúdo no `server/.env`:
```env
DATABASE_URL=COLE_SUA_CONNECTION_STRING_AQUI
JWT_SECRET=minha-chave-super-secreta-de-desenvolvimento-local-123456789
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

3. **IMPORTANTE**: Substitua `COLE_SUA_CONNECTION_STRING_AQUI` pela connection string do Neon!

### Passo 3: Configure Client

1. Crie arquivo `.env` no client:
```bash
cd ../client
echo. > .env
```

2. Cole este conteúdo no `client/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### Passo 4: Rode Migrations

```bash
cd ../server
npm run migrate
```

✅ Deve aparecer: "All migrations completed successfully!"

### Passo 5: Inicie a Aplicação

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend (novo terminal)
cd client
npm run dev
```

### Passo 6: Teste!

1. Abra: **http://localhost:5173**
2. Clique em "Criar Conta"
3. Preencha os dados
4. Crie seu guardião
5. Veja sua besta em 3D! 🐉

---

## 🐛 Problemas?

### Erro de conexão com database
- Verifique se copiou a connection string correta do Neon
- Teste se Neon está acessível

### Porta 3000 em uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <número> /F

# Ou mude PORT no .env
```

### Frontend não conecta
- Verifique se backend está rodando (terminal 1)
- Verifique se `VITE_API_URL` está correto

