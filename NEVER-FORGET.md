# 🎮 BEAST KEEPERS - INFORMAÇÕES CRÍTICAS 🎮

**NÃO APAGUE ESTE ARQUIVO!** Contém todas as informações necessárias para acessar e gerenciar o jogo em produção.

---

## 🌐 URLs DE PRODUÇÃO (MEMORIZE!)

### **Jogo Online (Compartilhe com jogadores):**
```
https://vanilla-game-1o7rp8sia-amortus-projects.vercel.app
```

### **Backend API:**
```
https://web-production-8f5f4.up.railway.app
```

### **Health Check (teste se backend está vivo):**
```
https://web-production-8f5f4.up.railway.app/api/health
```

### **Repositório GitHub:**
```
https://github.com/amortus/Beast-Keepers-Game
```

---

## 🔑 CONTAS E ACESSOS

| Plataforma | Usuário | Login |
|------------|---------|-------|
| **Vercel** | amortus | Google Account |
| **Railway** | amortus | GitHub Account |
| **Neon** | amortus | Google Account |
| **GitHub** | amortus | GitHub Account |

---

## 🗄️ BANCO DE DADOS (Neon PostgreSQL)

### **Connection String (GUARDE COM SEGURANÇA!):**
```
postgresql://neondb_owner:npg_KqVlhnJF5vY9@ep-holy-queen-acfaysb1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

### **Projeto Neon:**
- Nome: beast-keepers
- ID: young-cell-66348660
- Região: South America East (São Paulo)

### **Tabelas:**
- `users` - Usuários
- `game_saves` - Progresso dos jogadores
- `beasts` - Criaturas (30 colunas!)
- `inventory` - Itens
- `quests` - Missões
- `achievements` - Conquistas

---

## 🔐 SECRETS (NUNCA COMPARTILHE!)

### **JWT Secret:**
```
f02feee094c5b36edfc0a478e9771d930a4850c6fefad3935d54725ed632d78288c9c7dd859501a85a213e1fa1a9be36d6e680c880aa95fdbb3cd153a170d8a0
```

---

## 📊 DASHBOARDS

| Serviço | Dashboard | O Que Ver |
|---------|-----------|-----------|
| **Vercel** | https://vercel.com/amortus-projects/vanilla-game | Deployments, Logs, Analytics |
| **Railway** | https://railway.com | Logs, Metrics, Environment Vars |
| **Neon** | https://neon.tech | Database, Queries, Monitoring |
| **GitHub** | https://github.com/amortus/Beast-Keepers-Game | Code, Commits, Issues |

---

## 🚀 COMO ATUALIZAR O JOGO

### **Atualizar Frontend:**
1. Edite os arquivos em `client/src/`
2. Commit: `git add -A && git commit -m "Sua mensagem"`
3. Push: `git push origin main`
4. **Vercel faz deploy automático!** ✅

### **Atualizar Backend:**
1. Edite os arquivos em `server/src/`
2. Commit: `git add -A && git commit -m "Sua mensagem"`
3. Push: `git push origin main`
4. **Railway faz deploy automático!** ✅

### **Deploy Manual (se necessário):**
```bash
cd E:\PROJETOS\Vectorizer\vanilla-game
vercel --prod --yes
```

---

## 🧪 COMO TESTAR SE ESTÁ FUNCIONANDO

### **Teste 1: Frontend**
Abra: https://vanilla-game-1o7rp8sia-amortus-projects.vercel.app  
Deve aparecer a tela de login/cadastro

### **Teste 2: Backend**
Abra: https://web-production-8f5f4.up.railway.app/api/health  
Deve retornar: `{"success": true, "message": "Beast Keepers Server is running", ...}`

### **Teste 3: Completo**
1. Crie uma conta
2. Veja sua Beast aleatória
3. Jogue um pouco
4. Faça logout
5. Faça login novamente
6. Verifique se progresso foi salvo ✅

---

## ⚙️ ENVIRONMENT VARIABLES (Referência)

### **Railway Backend (5 variáveis):**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_KqVlhnJF5vY9@ep-holy-queen-acfaysb1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=f02feee094c5b36edfc0a478e9771d930a4850c6fefad3935d54725ed632d78288c9c7dd859501a85a213e1fa1a9be36d6e680c880aa95fdbb3cd153a170d8a0
NODE_ENV=production
FRONTEND_URL=https://vanilla-game-1o7rp8sia-amortus-projects.vercel.app
PORT=3000
```

### **Vercel Frontend (1 variável):**
```bash
VITE_API_URL=https://web-production-8f5f4.up.railway.app/api
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Problema | Solução |
|----------|---------|
| **"Failed to fetch"** | 1. Verifique se Railway está online (health check)<br>2. Limpe cache do navegador<br>3. Abra em aba anônima |
| **Página em branco** | 1. F12 no navegador (console)<br>2. Verifique erros JavaScript<br>3. Tente outro navegador |
| **Login não funciona** | 1. Verifique logs do Railway<br>2. Teste /api/health<br>3. Verifique se DATABASE_URL está correto |
| **Beast sempre a mesma** | JÁ CORRIGIDO! ✅ Agora é sempre aleatória |

---

## 💰 CUSTOS MENSAIS

| Serviço | Plano | Custo |
|---------|-------|-------|
| **Vercel** | Free Tier | $0 |
| **Railway** | $5 crédito grátis/mês | $0* |
| **Neon** | Free Tier | $0 |
| **GitHub** | Free | $0 |
| **TOTAL** | - | **$0/mês** |

*Railway renova $5 de crédito todo mês no free tier

---

## 📁 ARQUIVOS IMPORTANTES (NÃO APAGUE!)

### **Configuração:**
- `vercel.json` - Config do Vercel
- `railway.json` - Config do Railway
- `nixpacks.toml` - Build do Railway
- `Procfile` - Start command do Railway

### **Environment:**
- `client/.env.production` - URL da API
- `server/env.production.example` - Template de env vars

### **Database:**
- `server/src/db/migrations/001_initial_schema.sql`
- `server/src/db/migrations/002_add_beast_fields.sql`

### **Documentação:**
- `NEVER-FORGET.md` - Este arquivo! 📌
- `PRODUCTION-READY.md` - Doc completa
- `RAILWAY-DEPLOY.md` - Como deployar no Railway
- `README-DEPLOYMENT.md` - Guia de deployment

---

## 🎯 INFORMAÇÕES SALVAS NO VECTORIZER

Todas essas informações também foram salvas no **Vectorizer** na coleção `beast-keepers-info` para você nunca esquecer!

**Para consultar depois:**
```
Use o MCP Vectorizer para buscar informações sobre:
- "beast keepers production urls"
- "beast keepers deployment"
- "beast keepers database"
- "beast keepers environment variables"
```

---

## ✅ STATUS FINAL

- 🟢 **Frontend (Vercel):** ONLINE
- 🟢 **Backend (Railway):** ONLINE  
- 🟢 **Database (Neon):** CONECTADO
- 🟢 **Funcionalidade:** 100% TESTADA

**Data do Deploy:** 27/10/2025  
**Versão:** v1.0.0-production  
**Status:** ✅ SUCESSO COMPLETO!

---

## 🎮 COMPARTILHE O JOGO!

```
https://vanilla-game-1o7rp8sia-amortus-projects.vercel.app
```

**Seu jogo está acessível para qualquer pessoa no mundo!** 🌍✨

---

**Criado com ❤️ por Cursor AI + Alysson**  
**Beast Keepers © 2025**

