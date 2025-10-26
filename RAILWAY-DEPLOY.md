# 🚂 Railway Deployment - Beast Keepers Backend

## ✅ O Que É Railway?

Railway é uma plataforma moderna para deploy de aplicações Node.js, Python, Go, etc.
- **Free Tier:** $5 de crédito grátis por mês (suficiente para o jogo!)
- **Suporta Node.js tradicional** (não precisa de serverless!)
- **Deploy com 1 clique** via GitHub
- **SSL automático**

---

## 📋 Passos para Deploy

### 1. Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em "Login" ou "Start a New Project"
3. Faça login com sua conta GitHub

### 2. Criar Novo Projeto

1. No dashboard, clique em **"New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Autorize o Railway a acessar seu GitHub
4. Selecione o repositório: `amortus/beast-keepers-game`
5. Railway detectará automaticamente que é um projeto Node.js

### 3. Configurar Environment Variables

No projeto Railway, vá em **"Variables"** e adicione:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_KqVlhnJF5vY9@ep-holy-queen-acfaysb1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `f02feee094c5b36edfc0a478e9771d930a4850c6fefad3935d54725ed632d78288c9c7dd859501a85a213e1fa1a9be36d6e680c880aa95fdbb3cd153a170d8a0` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://vanilla-game-9qwyn0f2c-amortus-projects.vercel.app` |

**NÃO precisa adicionar PORT** - Railway define automaticamente!

### 4. Deploy!

- Railway vai:
  - Detectar `nixpacks.toml` ou `Procfile`
  - Rodar `cd server && npm install`
  - Rodar `cd server && npm run build`
  - Iniciar com `cd server && npm start`
  - Fornecer uma URL como: `https://beast-keepers-production.up.railway.app`

### 5. Copiar a URL do Railway

Após o deploy, você terá uma URL tipo:
```
https://beast-keepers-production-xxxx.up.railway.app
```

**Copie essa URL!** Vamos usar para atualizar o frontend.

---

## 🔄 Atualizar Frontend (Depois do Railway)

1. Edite `client/.env.production`:
   ```
   VITE_API_URL=https://sua-url-railway.up.railway.app/api
   ```

2. Commit e push:
   ```bash
   git add client/.env.production
   git commit -m "Update API URL to Railway"
   git push origin main
   ```

3. Vercel vai fazer redeploy automático!

---

## 🧪 Testar

1. Acesse o frontend no Vercel
2. Cadastre uma conta
3. Deve funcionar perfeitamente agora!

---

## 💰 Custos

- **Vercel (Frontend):** $0/mês
- **Railway (Backend):** $5 crédito/mês grátis (renova todo mês)
- **Neon (Database):** $0/mês
- **Total:** Grátis enquanto uso for moderado!

---

## 📊 Vantagens desta Arquitetura

✅ Frontend estático (super rápido)  
✅ Backend tradicional (sem problemas de serverless)  
✅ Fácil de debugar  
✅ Logs completos  
✅ Escalável  
✅ Ainda 100% grátis!  

---

**Vamos começar?** Siga os passos acima e me avise quando tiver a URL do Railway! 🚀

