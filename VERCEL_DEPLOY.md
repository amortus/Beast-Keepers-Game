# 🚀 Beast Keepers - Deploy na Vercel

## 📋 Pré-requisitos

1. Conta na Vercel: https://vercel.com
2. Conta no Neon (PostgreSQL): https://neon.tech
3. Conta no Google Cloud Console (para OAuth): https://console.cloud.google.com
4. Git repository no GitHub

## 🗄️ Passo 1: Setup do Banco de Dados (Neon)

### 1.1. Criar Projeto no Neon

1. Acesse https://neon.tech
2. Faça login/registre-se
3. Clique em "Create Project"
4. Nome: `beast-keepers`
5. Região: Escolha a mais próxima
6. Clique em "Create Project"

### 1.2. Obter Connection String

1. Na dashboard do projeto, vá em "Connection Details"
2. Copie a **Connection String** (formato: `postgresql://...`)
3. Guarde para usar nas variáveis de ambiente

### 1.3. Rodar Migrations

```bash
# Localmente, com a connection string do Neon
cd server
# Edite .env com a DATABASE_URL do Neon
npm run migrate
```

## 🔐 Passo 2: Configurar Google OAuth

### 2.1. Criar Projeto no Google Cloud Console

1. Acesse https://console.cloud.google.com
2. Crie novo projeto: "Beast Keepers"
3. Vá em "APIs & Services" → "Credentials"
4. Clique em "Create Credentials" → "OAuth client ID"
5. Configure:
   - Application type: **Web application**
   - Name: `Beast Keepers Web`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (dev)
     - `https://seu-dominio.vercel.app` (prod)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (dev)
     - `https://seu-dominio.vercel.app/api/auth/google/callback` (prod)

### 2.2. Obter Credenciais

1. Copie **Client ID**
2. Copie **Client Secret**
3. Guarde para variáveis de ambiente

## 🚀 Passo 3: Deploy na Vercel

### 3.1. Conectar Repository

1. Acesse https://vercel.com/new
2. Importe seu repositório GitHub
3. Selecione o projeto `beast-keepers-game`

### 3.2. Configurar Build

**Framework Preset**: Other
**Root Directory**: `./` (raiz do projeto)
**Build Command**: `npm run build` (já configurado no vercel.json)
**Output Directory**: `client/dist` (já configurado no vercel.json)

### 3.3. Adicionar Variáveis de Ambiente

Na seção "Environment Variables", adicione:

```env
# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/beast_keepers

# JWT
JWT_SECRET=uma-chave-super-secreta-e-aleatoria-mude-em-producao

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_CALLBACK_URL=https://seu-dominio.vercel.app/api/auth/google/callback

# Server
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://seu-dominio.vercel.app
```

### 3.4. Deploy

1. Clique em "Deploy"
2. Aguarde build completar
3. Acesse o domínio gerado (ex: `beast-keepers.vercel.app`)

## ✅ Passo 4: Verificar Deploy

### 4.1. Testar Endpoints

```bash
# Health check
curl https://seu-dominio.vercel.app/health

# Testar registro
curl -X POST https://seu-dominio.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","displayName":"Test"}'
```

### 4.2. Testar Google OAuth

1. Acesse `https://seu-dominio.vercel.app`
2. Clique em "Entrar com Google"
3. Autorize o app
4. Deve redirecionar de volta logado

### 4.3. Testar Game Init

1. Registre novo usuário
2. Digite nome do guardião
3. Clique em "Começar Jornada"
4. Deve criar besta aleatória
5. Deve carregar tela do rancho

## 🔧 Configurações Adicionais

### Custom Domain (Opcional)

1. Na Vercel, vá em "Settings" → "Domains"
2. Adicione seu domínio customizado
3. Configure DNS conforme instruções
4. Atualize Google OAuth URLs

### Environment Variables por Ambiente

Você pode ter diferentes configs para:
- **Production**: Variáveis principais
- **Preview**: Para branches de feature
- **Development**: Para testes locais

## 🐛 Troubleshooting

### Build Falha

**Erro: "Cannot find module"**
- Verifique se todas as dependências estão no `package.json`
- Rode `npm install` localmente e teste build

**Erro: "TypeScript compilation error"**
- Rode `npm run build` localmente
- Corrija erros de tipo
- Commit e faça push

### Database Connection

**Erro: "Failed to connect to database"**
- Verifique `DATABASE_URL` nas variáveis de ambiente
- Teste conexão localmente com as mesmas credenciais
- Verifique allowlist de IPs no Neon (libere todos: `0.0.0.0/0`)

### Google OAuth

**Erro: "redirect_uri_mismatch"**
- Verifique URLs autorizadas no Google Cloud Console
- Deve incluir exatamente: `https://seu-dominio.vercel.app/api/auth/google/callback`
- Sem trailing slash!

### CORS Errors

**Erro: "CORS policy blocked"**
- Verifique `FRONTEND_URL` no servidor
- Deve ser exatamente o domínio do Vercel
- Sem trailing slash

## 📊 Checklist de Deploy

- [ ] PostgreSQL (Neon) configurado
- [ ] Migrations rodadas no banco de produção
- [ ] Google OAuth configurado com URLs de produção
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Repository conectado à Vercel
- [ ] Build bem-sucedido
- [ ] Health check retorna 200
- [ ] Registro funcionando
- [ ] Login funcionando
- [ ] Google OAuth funcionando
- [ ] Game init funcionando
- [ ] Game save/load funcionando

## 🎯 URLs Importantes

Após deploy, você terá:

- **App**: `https://seu-dominio.vercel.app`
- **API**: `https://seu-dominio.vercel.app/api`
- **Health**: `https://seu-dominio.vercel.app/health`
- **Auth**: `https://seu-dominio.vercel.app/api/auth/*`
- **Game**: `https://seu-dominio.vercel.app/api/game/*`

## 🔄 Continuous Deployment

Após configurado, cada push para `main` fará:
1. Build automático
2. Deploy automático
3. Preview URL para cada branch

## 📝 Notas Importantes

- **SSL/HTTPS**: Automático na Vercel
- **CDN**: Global, automático
- **Serverless Functions**: Backend roda como functions
- **Cold Starts**: Primeira request pode ser lenta (1-2s)
- **Database**: Neon tem cold starts também, considere pooling
- **Logs**: Acesse logs na dashboard da Vercel

## 🆘 Suporte

Problemas? 
1. Confira logs na Vercel Dashboard
2. Teste localmente primeiro
3. Verifique variáveis de ambiente
4. Consulte docs: https://vercel.com/docs

---

**Boa sorte com o deploy! 🎮✨**

