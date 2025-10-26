# 🚀 Vercel Deployment - Beast Keepers

## ✅ Database Status

**Banco Neon configurado e pronto!**

- ✅ Tabelas criadas: `users`, `game_saves`, `beasts`, `inventory`, `quests`, `achievements`
- ✅ Migration 001 aplicada
- ✅ Migration 002 aplicada
- ✅ Todas as colunas necessárias presentes

---

## 📋 Próximos Passos

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

Escolha sua conta Google quando solicitado.

### 3. Link Project (First Time Only)

```bash
cd E:\PROJETOS\Vectorizer\vanilla-game
vercel link
```

- Escolha "Create new project"
- Nome sugerido: `beast-keepers`
- Confirme o root directory

### 4. Configure Environment Variables

Acesse: https://vercel.com/dashboard

Vá em: **Settings → Environment Variables**

Adicione estas variáveis (**Para: Production, Preview, Development**):

#### Required Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_KqVlhnJF5vY9@ep-holy-queen-acfaysb1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require` | Neon connection string |
| `JWT_SECRET` | `f02feee094c5b36edfc0a478e9771d930a4850c6fefad3935d54725ed632d78288c9c7dd859501a85a213e1fa1a9be36d6e680c880aa95fdbb3cd153a170d8a0` | Generated secure key |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port (for reference) |
| `FRONTEND_URL` | *Leave empty for now* | Will update after first deploy |

#### Optional (Google OAuth):

| Variable | Value | Notes |
|----------|-------|-------|
| `GOOGLE_CLIENT_ID` | Your Google Client ID | From Google Console |
| `GOOGLE_CLIENT_SECRET` | Your Google Secret | From Google Console |
| `GOOGLE_CALLBACK_URL` | *Leave empty for now* | Will update after first deploy |

---

### 5. First Deployment

```bash
vercel --prod
```

**Vercel will:**
- Build your client (Vite)
- Build your server (TypeScript)
- Deploy everything
- Give you a URL like: `https://beast-keepers-xxx.vercel.app`

**⚠️ IMPORTANT: Save this URL!**

---

### 6. Update Environment Variables (Second Deploy)

Após o primeiro deploy, atualize no Vercel dashboard:

1. `FRONTEND_URL` → Sua URL real (`https://beast-keepers-xxx.vercel.app`)
2. `GOOGLE_CALLBACK_URL` (se usando OAuth) → `https://beast-keepers-xxx.vercel.app/api/auth/google/callback`
3. Salve as mudanças

---

### 7. Update Client .env.production

1. Renomeie `client/env.production` para `client/.env.production`
2. Atualize com sua URL real:

```env
VITE_API_URL=https://beast-keepers-xxx.vercel.app/api
```

3. Commit e push:

```bash
git add client/.env.production
git commit -m "Update production API URL"
git push origin main
```

---

### 8. Second Deployment (Apply Changes)

```bash
vercel --prod
```

Ou deixe o Vercel fazer deploy automático pelo Git push.

---

## 🧪 Testing

Após o deploy final:

1. Abra: `https://beast-keepers-xxx.vercel.app`
2. Crie uma nova conta
3. Verifique:
   - ✅ Recebeu uma Beast aleatória (não sempre Brontis)
   - ✅ Game carrega corretamente
   - ✅ Login/Logout funciona
   - ✅ Progresso é salvo

---

## 📊 Monitoring

### View Logs

```bash
vercel logs https://beast-keepers-xxx.vercel.app
```

### Vercel Dashboard

- Functions → Ver logs de erros
- Deployments → Histórico de deploys
- Analytics → Uso e performance

---

## 🔧 Troubleshooting

### "502 Bad Gateway"
- Verifique logs no Vercel
- Confirme `DATABASE_URL` está correta
- Verifique se Neon está ativo

### "CORS Error"
- Confirme `FRONTEND_URL` está correta
- URL deve ser exatamente a do Vercel

### "Database Connection Failed"
- Teste connection string localmente
- Verifique se Neon está rodando
- Confirme `?sslmode=require` na URL

---

## 🎯 Quick Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview (test)
vercel

# View logs
vercel logs

# View deployments
vercel list

# Rollback
vercel rollback
```

---

## ✅ Checklist

- [ ] Vercel CLI instalado
- [ ] Login realizado
- [ ] Environment variables configuradas
- [ ] Primeiro deploy executado
- [ ] URL salva
- [ ] `FRONTEND_URL` atualizada
- [ ] `.env.production` criado no client
- [ ] Segundo deploy executado
- [ ] Site testado e funcionando

---

**Pronto para começar? Execute o passo 1!** 🚀

