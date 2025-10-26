# 🚀 Teste Local - Setup Automático

## ⚡ OPÇÃO RÁPIDA: Teste SEM configurar banco (2 minutos)

Você tem 2 opções para testar:

### Opção A: Com Neon (PostgreSQL - Recomendado) ✨

**Tempo: 10 minutos**

1. **Crie conta no Neon** (grátis, sem cartão):
   - Acesse: https://neon.tech
   - Clique "Sign up"
   - Use Google/GitHub para entrar

2. **Crie projeto**:
   - Nome: `beast-keepers`
   - Região: Escolha qualquer
   - Clique "Create"

3. **Copie Connection String**:
   - Na dashboard, copie a "Connection string"
   - Formato: `postgresql://user:pass@ep-xxxxx.neon.tech/neondb`

4. **Configure DATABASE_URL**:
   - Abra: `server/.env`
   - Substitua a linha `DATABASE_URL=...` pela sua connection string
   - Salve

5. **Rode migrations**:
```bash
cd server
npm run migrate
```

6. **Inicie a aplicação**:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

7. **Acesse**: http://localhost:5173

---

### Opção B: PostgreSQL Local (Se já tem instalado)

Se você já tem PostgreSQL instalado:

1. **Crie o banco**:
```bash
createdb beast_keepers_dev
```

2. **Rode migrations**:
```bash
cd server
npm run migrate
```

3. **Inicie a aplicação**:
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client  
npm run dev
```

---

## 🎮 Testando o Jogo

1. **Abra**: http://localhost:5173
2. **Deve aparecer**: Tela de boas-vindas

### Teste 1: Criar Conta
1. Clique em "Criar Conta"
2. Email: `test@test.com`
3. Nome: `Guardião Teste`
4. Senha: `123456`
5. Confirmar senha: `123456`
6. Clique "Criar Conta"

### Teste 2: Inicializar Jogo
1. Digite nome do guardião: `João`
2. Clique "Começar Jornada!"
3. **Deve aparecer**: Rancho com besta 3D! 🐉

### Teste 3: Verificar Besta em 3D
- Você verá um modelo 3D low-poly da besta
- Pode ser: Olgrim, Terravox, Feralis, Brontis, Zephyra, Ignar, Mirella, Umbrix, Sylphid ou Raukor
- Modelo gira lentamente
- Câmera orbita ao redor

---

## 🐛 Problemas?

### "Failed to connect to database"

**Você precisa de um banco PostgreSQL!** Escolha:

1. **Neon** (10 min) - https://neon.tech
2. **PostgreSQL local** - Instale: https://postgresql.org/download

### "Port 3000 already in use"

```bash
# Mate o processo
npx kill-port 3000

# Ou mude PORT no server/.env
```

### "Cannot find module"

```bash
# Reinstale dependências
npm install
cd server && npm install
cd ../client && npm install
```

### Backend não inicia

```bash
# Verifique se server/.env existe
ls server/.env

# Se não existe, rode:
node setup-env.js

# Depois edite server/.env com sua DATABASE_URL
```

---

## ✅ Checklist de Teste

- [ ] Backend rodando (http://localhost:3000/health)
- [ ] Frontend rodando (http://localhost:5173)
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Game init funciona
- [ ] Besta 3D aparece
- [ ] Jogo está jogável

---

## 🎯 Está Funcionando?

Se tudo funcionou, você tem:
- ✅ Backend online
- ✅ Database configurado
- ✅ Autenticação funcionando
- ✅ Jogo rodando
- ✅ Bestas em 3D!

**Próximo passo**: Deploy na Vercel (veja VERCEL_DEPLOY.md)

---

## 🆘 Precisa de Ajuda?

1. Verifique logs no terminal
2. Verifique console do browser (F12)
3. Consulte TESTING_GUIDE.md
4. Consulte SERVER_SETUP.md

**Boa sorte! 🎮✨**

