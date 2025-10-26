# 🐉 Beast Keepers - Online Edition

> Um jogo de criação, treinamento e batalha de criaturas místicas, agora totalmente online com multiplayer e autenticação!

## 🌟 Novidades da Versão Online

### ✨ Novas Features
- 🔐 **Autenticação Completa** - Email/senha + Google OAuth
- 🌍 **Jogo Online** - Seus dados salvos na nuvem
- 🗄️ **Backend Robusto** - Express + PostgreSQL
- 🚀 **Deploy na Vercel** - Acesse de qualquer lugar
- 💾 **Auto-save** - Progresso salvo automaticamente
- 🔄 **Cross-device** - Jogue em qualquer dispositivo

### 🎮 Funcionalidades do Jogo

- **10 Linhas de Bestas** - Olgrim, Terravox, Feralis, Brontis, Zephyra, Ignar, Mirella, Umbrix, Sylphid, Raukor
- **Sistema de Combate** - IA avançada com 4 dificuldades + 4 personalidades especiais
- **Auto-Batalha** - Assista suas bestas lutarem automaticamente
- **Exploração** - 6 zonas diferentes com inimigos e tesouros
- **Torneios** - 4 ranks: Bronze, Prata, Ouro, Mítico
- **Crafting** - Crie itens com materiais da exploração
- **Missões** - Sistema completo de quests
- **Conquistas** - Achievements desbloqueáveis
- **NPCs** - Interaja com personagens do mundo

## 🏗️ Arquitetura

```
beast-keepers/
├── client/          # Frontend (Vanilla TypeScript + Canvas 2D)
├── server/          # Backend (Express + PostgreSQL)
├── shared/          # Tipos compartilhados
└── docs/            # Documentação
```

### Stack Tecnológica

**Frontend:**
- TypeScript
- Canvas 2D API
- Vite (build tool)
- Vanilla JS (sem frameworks)

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL (Neon)
- JWT Authentication
- Passport (Google OAuth)

**Deploy:**
- Vercel (frontend + serverless functions)
- Neon (PostgreSQL serverless)

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/amortus/beast-keepers-game
cd beast-keepers-game

# 2. Setup do banco de dados
# Crie conta no Neon.tech e copie connection string

# 3. Configure environment variables
cd server
copy env.example .env
# Edite .env com suas credenciais

cd ../client
copy env.example .env

# 4. Instale dependências
cd ..
npm install

# 5. Rode migrations
cd server
npm run migrate

# 6. Inicie a aplicação
cd ..
npm run dev
```

Acesse: http://localhost:5173

### Deploy em Produção

Veja guia completo: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

```bash
# 1. Conecte repositório na Vercel
# 2. Configure variáveis de ambiente
# 3. Deploy!
```

## 📖 Documentação

- **[GDD.md](GDD.md)** - Game Design Document
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura técnica
- **[SERVER_SETUP.md](SERVER_SETUP.md)** - Setup do backend
- **[VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)** - Deploy na Vercel
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Como testar
- **[MIGRATION_STATUS.md](MIGRATION_STATUS.md)** - Status da migração
- **[AGENTS.md](AGENTS.md)** - Instruções para IAs

## 🎯 Endpoints da API

### Autenticação
```
POST /api/auth/register      - Registrar usuário
POST /api/auth/login         - Login
GET  /api/auth/me            - Obter usuário atual
GET  /api/auth/google        - Iniciar Google OAuth
GET  /api/auth/google/callback - Callback OAuth
POST /api/auth/logout        - Logout
```

### Game State
```
POST /api/game/initialize    - Inicializar novo jogo
GET  /api/game/save          - Obter save completo
PUT  /api/game/save          - Atualizar save
```

## 🗄️ Database Schema

### Tabelas Principais:
- **users** - Usuários (email, google_id, senha)
- **game_saves** - Progresso do jogo (week, coronas, victories)
- **beasts** - Criaturas (stats, técnicas, status)
- **inventory** - Items do jogador
- **quests** - Missões ativas/completadas
- **achievements** - Conquistas desbloqueadas

## 🔐 Segurança

- ✅ Senhas com hash bcrypt
- ✅ JWT tokens com expiração
- ✅ Protected routes
- ✅ CORS configurado
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection protection (parametrized queries)
- ✅ Environment variables para secrets

## 🎮 Como Jogar

1. **Registre-se** ou faça login
2. **Crie seu Guardião** (escolha nome)
3. **Receba sua Besta** aleatória (10 linhas possíveis)
4. **Treine** sua besta no rancho
5. **Participe de Torneios** para ganhar Coronas
6. **Explore** zonas perigosas para coletar materiais
7. **Crie Itens** com o sistema de craft
8. **Complete Missões** e desbloqueie conquistas
9. **Evolua** sua besta ao longo das semanas

## 📊 Progresso da Migração

**Fase 1: Backend + Auth** - ✅ 100% Completo
- Monorepo setup
- Express backend
- PostgreSQL database
- Auth system (email/senha + Google)
- Game state API
- Frontend integration
- Vercel configuration

**Fase 2: Three.js** - ⏸️ Planejado
- Modelos 3D das bestas
- Animações de batalha
- Visual low-poly (estilo PS1)

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

MIT License - veja [LICENSE](LICENSE)

## 👨‍💻 Autor

**Alysson (amortus)**
- GitHub: [@amortus](https://github.com/amortus)
- Projeto: [beast-keepers-game](https://github.com/amortus/beast-keepers-game)

## 🙏 Agradecimentos

- Inspiração: Pokémon, Digimon, Monster Rancher
- Visual: Estilo PS1 low-poly
- Comunidade: Por todo o feedback!

## 🔗 Links

- **Demo**: https://beast-keepers.vercel.app (após deploy)
- **Docs**: https://github.com/amortus/beast-keepers-game/wiki
- **Issues**: https://github.com/amortus/beast-keepers-game/issues

---

**Desenvolvido com ❤️ usando TypeScript, Canvas 2D, Express e PostgreSQL**

**Versão**: 0.2.0 (Online Edition)
**Status**: Beta - Totalmente funcional
**Última atualização**: Outubro 2025

