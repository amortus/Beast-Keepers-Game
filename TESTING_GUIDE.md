# 🧪 Beast Keepers - Guia de Testes

## 📋 Overview

Este guia explica como testar a aplicação Beast Keepers tanto localmente quanto em produção.

## 🏠 Teste Local

### Passo 1: Setup do Ambiente

#### 1.1. PostgreSQL (Neon - Recomendado)

1. Acesse https://neon.tech
2. Crie conta grátis
3. Crie projeto "beast-keepers"
4. Copie connection string
5. Cole no `server/.env`:
```env
DATABASE_URL=postgresql://user:pass@ep-xxxxx.us-east-2.aws.neon.tech/neondb
```

#### 1.2. Configurar Environment Variables

**Server (.env):**
```bash
cd server
copy env.example .env
# Edite com suas credenciais
```

Mínimo necessário para testar:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=qualquer-string-longa-aleatoria
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Client (.env):**
```bash
cd client
copy env.example .env
```

```env
VITE_API_URL=http://localhost:3000/api
```

#### 1.3. Rodar Migrations

```bash
cd server
npm run migrate
```

Saída esperada:
```
[Migration] Starting database migrations...
[Migration] Running 001_initial_schema.sql...
[Migration] ✓ 001_initial_schema.sql completed successfully
[Migration] All migrations completed successfully!
```

### Passo 2: Iniciar Aplicação

#### 2.1. Terminal 1 - Backend

```bash
cd server
npm run dev
```

Saída esperada:
```
==================================================
🎮 Beast Keepers Server
==================================================
📍 Server: http://localhost:3000
🔗 Frontend: http://localhost:5173
🗄️  Database: Connected
⚙️  Environment: development
==================================================
```

#### 2.2. Terminal 2 - Frontend

```bash
cd client
npm run dev
```

Saída esperada:
```
VITE v5.4.20  ready in 267 ms
➜  Local:   http://localhost:5173/
```

### Passo 3: Testar Funcionalidades

#### 3.1. Teste de Autenticação

1. **Abra**: http://localhost:5173
2. **Deve aparecer**: Tela de boas-vindas com 3 opções:
   - Entrar
   - Criar Conta
   - Entrar com Google

3. **Clique em "Criar Conta"**:
   - Digite email (ex: test@test.com)
   - Digite nome do guardião (ex: João)
   - Digite senha (mín. 6 caracteres)
   - Confirme senha
   - Clique "Criar Conta"

4. **Deve aparecer**: Tela de inicialização do jogo
   - "Bem-vindo, Guardião!"
   - Campo para nome do guardião
   - Clique "Começar Jornada!"

5. **Deve acontecer**:
   - Besta aleatória é criada
   - Jogo é inicializado
   - Aparece tela do rancho com sua besta

#### 3.2. Teste de Login

1. **Logout** (feche e reabra navegador ou limpe localStorage)
2. **Abra**: http://localhost:5173
3. **Clique em "Entrar"**
4. **Digite**:
   - Email: test@test.com
   - Senha: sua senha
5. **Clique "Entrar"**
6. **Deve carregar**: Seu jogo salvo do servidor

#### 3.3. Teste de Google OAuth (Opcional)

Se configurou Google OAuth:

1. **Clique em "Entrar com Google"**
2. **Autorize** a aplicação
3. **Deve retornar** logado
4. **Se primeiro login**: Mostra tela de game init
5. **Se já jogou**: Carrega jogo salvo

### Passo 4: Testar API Diretamente

#### 4.1. Health Check

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Beast Keepers Server is running",
  "timestamp": "2025-10-26T..."
}
```

#### 4.2. Registrar Usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player1@test.com",
    "password": "senha123",
    "displayName": "Player One"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "player1@test.com",
      "displayName": "Player One"
    }
  }
}
```

#### 4.3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player1@test.com",
    "password": "senha123"
  }'
```

#### 4.4. Inicializar Jogo

```bash
# Substitua YOUR_TOKEN pelo token recebido no registro/login
curl -X POST http://localhost:3000/api/game/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "playerName": "Guardião João"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "data": {
    "gameSave": {
      "id": 1,
      "playerName": "Guardião João",
      "week": 1,
      "coronas": 1000,
      ...
    },
    "initialBeast": {
      "id": 1,
      "name": "Brontis",
      "line": "brontis",
      "isActive": true,
      ...
    }
  }
}
```

#### 4.5. Obter Game Save

```bash
curl http://localhost:3000/api/game/save \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🌐 Teste em Produção (Vercel)

Depois do deploy, repita todos os testes acima, mas usando:
- `https://seu-dominio.vercel.app` ao invés de `http://localhost:5173`
- `https://seu-dominio.vercel.app/api` ao invés de `http://localhost:3000/api`

### Checklist de Testes em Produção

- [ ] Página inicial carrega
- [ ] Formulário de registro funciona
- [ ] Formulário de login funciona
- [ ] Google OAuth funciona
- [ ] Game init funciona
- [ ] Besta aleatória é criada
- [ ] Rancho aparece
- [ ] Todas as funcionalidades do jogo funcionam
- [ ] Auto-save funciona
- [ ] Logout funciona
- [ ] Login persiste após recarregar página

## 🐛 Problemas Comuns

### Frontend não conecta com Backend

**Sintoma**: Erros de CORS ou "Failed to fetch"

**Solução**:
1. Verifique se backend está rodando
2. Verifique `VITE_API_URL` no client
3. Verifique `FRONTEND_URL` no server
4. Verifique CORS no server/src/index.ts

### Token Inválido

**Sintoma**: 403 Forbidden ao fazer requests

**Solução**:
1. Faça logout e login novamente
2. Verifique se token está sendo enviado: DevTools → Network → Headers
3. Verifique se `JWT_SECRET` é o mesmo no .env

### Banco de Dados não conecta

**Sintoma**: "Failed to connect to database"

**Solução**:
1. Teste connection string com `psql`:
   ```bash
   psql "postgresql://..."
   ```
2. Verifique se banco existe
3. Verifique allowlist de IPs (Neon)
4. Verifique se migrations rodaram

### Google OAuth não funciona

**Sintoma**: "redirect_uri_mismatch"

**Solução**:
1. URLs devem ser EXATAMENTE iguais no Google Console e no código
2. Não pode ter trailing slash
3. HTTP vs HTTPS importa
4. Deve incluir `/callback` no final

## 📊 Logs para Debug

### Backend Logs

```bash
cd server
npm run dev
```

Logs mostram:
- Requests recebidos
- Queries SQL executados
- Erros detalhados
- Auth events

### Frontend Logs

Abra DevTools (F12) → Console

Logs mostram:
- Auth state changes
- API calls
- Erros de network
- Game state updates

### Database Logs

No Neon Dashboard:
- Query performance
- Connection stats
- Slow queries

## ✅ Teste Completo - Checklist

### Autenticação
- [ ] Registrar novo usuário (email/senha)
- [ ] Login com credenciais
- [ ] Google OAuth
- [ ] Token persiste (localStorage)
- [ ] Auto-login funciona
- [ ] Logout funciona
- [ ] Erro para credenciais inválidas
- [ ] Erro para email duplicado

### Game Initialization
- [ ] Tela de game init aparece após registro
- [ ] Nome do guardião aceita input
- [ ] Besta aleatória é criada (10 linhas possíveis)
- [ ] Game save é criado no servidor
- [ ] Stats iniciais corretos

### Game Functionality
- [ ] Rancho carrega
- [ ] Stats da besta aparecem
- [ ] Todas as ações funcionam (treinar, trabalhar, descansar)
- [ ] Semanas avançam
- [ ] Torneios funcionam
- [ ] Exploração funciona
- [ ] Inventário funciona
- [ ] Craft funciona
- [ ] Missões funcionam
- [ ] Conquistas funcionam

### Persistence
- [ ] Mudanças são salvas automaticamente
- [ ] Fechar e reabrir mantém progresso
- [ ] Login em outro dispositivo carrega mesmo save

## 🎯 Conclusão

Se todos os testes passarem, o sistema está funcionando 100%!

Problemas? Consulte:
- SERVER_SETUP.md
- VERCEL_DEPLOY.md
- MIGRATION_STATUS.md
- Logs do servidor e browser

