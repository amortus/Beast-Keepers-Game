# 🚀 Como Executar as Novas Funcionalidades

**Data:** 2025-10-30  
**Versão:** 1.2.0

---

## 📋 Checklist Pré-Execução

### 1. Verificar Ambiente
```bash
# Node.js (versão 18+)
node --version

# PostgreSQL (versão 14+)
psql --version

# NPM
npm --version
```

### 2. Instalar Dependências

```bash
# No diretório raiz
cd vanilla-game

# Instalar dependências do client
cd client
npm install

# Instalar dependências do server
cd ../server
npm install

# Voltar ao raiz
cd ..
```

---

## 🗄️ Database Setup

### 1. Executar Migrations (9 Novas)

```bash
cd server

# Método 1: Via script (se existir)
npm run migrate

# Método 2: Manual via psql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/009_daily_challenges.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/010_beast_lifecycle.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/011_relic_history.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/012_pvp_system.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/013_dungeon_progress.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/014_equipment.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/015_ranch_customization.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/016_guild_system.sql
psql -U seu_usuario -d beast_keepers -f src/db/migrations/017_player_stats.sql
```

### 2. Verificar Migrations

```sql
-- Conectar ao banco
psql -U seu_usuario -d beast_keepers

-- Verificar colunas adicionadas
\d game_state

-- Verificar novas tabelas
\dt

-- Deve mostrar:
-- - pvp_rankings
-- - pvp_battles
-- - pvp_seasons
-- - guilds
-- - guild_members
-- - guild_wars
```

---

## 🎵 Assets de Áudio (Opcional)

### Estrutura de Pastas

```bash
mkdir -p client/public/assets/audio/music
mkdir -p client/public/assets/audio/sfx
```

### Adicionar Arquivos

**Músicas (Loop - 1-3 minutos cada):**
- `music/ranch.mp3` - Música calma, relaxante
- `music/battle.mp3` - Música épica, tensa
- `music/village.mp3` - Música animada
- `music/temple.mp3` - Música mística
- `music/dungeon.mp3` - Música tensa, exploração
- `music/victory.mp3` - Jingle curto (~10s)
- `music/menu.mp3` - Música do menu

**Efeitos Sonoros (One-shot - 0.1-2s cada):**
- `sfx/attack_*.mp3` - Sons de ataques (7 elementos)
- `sfx/hit.mp3` - Acerto
- `sfx/critical.mp3` - Crítico
- `sfx/click.mp3` - Clique UI
- `sfx/achievement.mp3` - Conquista
- Etc... (25+ total)

### Fontes Recomendadas
- **Música:** OpenGameArt.org, FreePD, Incompetech
- **SFX:** Freesound.org, Zapsplat, Mixkit

**NOTA:** O sistema funciona sem áudio (modo silencioso) para desenvolvimento.

---

## 🎮 Iniciar o Jogo

### Desenvolvimento

```bash
# Terminal 1: Backend
cd server
npm run dev
# Escutando em http://localhost:3001

# Terminal 2: Frontend
cd client
npm run dev
# Escutando em http://localhost:5173
```

### Produção

```bash
# Build
cd client && npm run build
cd ../server && npm run build

# Deploy (Railway, Vercel, etc.)
# Seguir DEPLOY-3D-PRODUCAO.md
```

---

## 🧪 Testando as Novas Funcionalidades

### 1. Sistema de Áudio
1. Abrir o jogo
2. Pressionar **'M'** para abrir configurações de áudio
3. Testar sliders de volume
4. Clicar em "Testar SFX"
5. Verificar mute/unmute

### 2. Conquistas (50 Total)
1. Abrir painel de conquistas
2. Verificar 50 conquistas listadas
3. Completar ações para desbloquear
4. Verificar notificações de conquista

### 3. Desafios Diários
1. Verificar 3 desafios diários no header/UI
2. Completar requisitos
3. Verificar recompensas
4. Esperar renovação às 00:00

### 4. Ciclo de Vida
1. Criar nova besta
2. Avançar semanas (verificar envelhecimento)
3. Atingir 156 semanas
4. Ver cerimônia de Eco
5. Criar besta herdeira com técnicas espectrais

### 5. PvP
1. Abrir painel de PvP
2. Buscar oponente (matchmaking)
3. Batalhar
4. Ver atualização de ELO
5. Verificar ranking

### 6. Dungeons
1. Abrir exploração
2. Selecionar uma das 5 dungeons
3. Progredir pelos 5 andares
4. Enfrentar boss no andar 5
5. Receber recompensas first clear

### 7. Equipamentos
1. Abrir inventário
2. Ver seção de equipamentos
3. Equipar item em um dos 4 slots
4. Ver stats modificados
5. Usar forja para upgrade

### 8. Customização de Rancho
1. Abrir editor de rancho
2. Comprar decoração
3. Posicionar no rancho 3D
4. Mudar tema (se tiver coronas)
5. Convidar amigo para visitar

### 9. Guildas
1. Criar ou entrar em guilda
2. Ver lista de membros
3. Usar chat de guilda
4. Participar de guerra de guilda
5. Ver ranking global

### 10. Dashboard de Stats
1. Abrir perfil
2. Ver todas as 12 categorias de stats
3. Scroll para ver mais
4. Comparar com amigos
5. Exportar dados (JSON/CSV)

---

## 🐛 Troubleshooting

### Áudio Não Funciona
- ✅ Verificar se navegador permite autoplay
- ✅ Verificar se arquivos MP3 existem
- ✅ Abrir Console (F12) e ver erros
- ✅ Verificar configurações (tecla M)

### Migrations Falharam
- ✅ Verificar conexão com banco
- ✅ Verificar permissões do usuário
- ✅ Executar migrations em ordem (009-017)
- ✅ Ver logs de erro do PostgreSQL

### Funcionalidades Não Aparecem
- ✅ Limpar cache do navegador (Ctrl+F5)
- ✅ Verificar se migration foi executada
- ✅ Verificar Console do navegador
- ✅ Verificar logs do servidor

### Performance Issues
- ✅ Verificar se áudio está em preload:false
- ✅ Desabilitar algumas animações 3D
- ✅ Reduzir qualidade de texturas
- ✅ Usar build de produção (npm run build)

---

## 🔧 Configuração do Vectorizer

### 1. Iniciar Servidor Vectorizer

```bash
cd E:\PROJETOS\Vectorizer
.\vectorizer.exe
# Escutando em http://127.0.0.1:15002
```

### 2. Verificar Indexação

```bash
# Via REST API
curl http://127.0.0.1:15002/api/v1/collections

# Deve retornar coleções incluindo:
# - vanilla-game-docs
# - vanilla-game-client
# - vanilla-game-server
# - vanilla-game-shared
```

### 3. Usar MCP para Buscar Contexto

No Cursor ou outra IDE com suporte MCP, você pode agora buscar contexto do projeto vanilla-game via Vectorizer.

---

## 📚 Documentação Adicional

- `AUDIO-SYSTEM-IMPLEMENTED.md` - Detalhes do sistema de áudio
- `PROGRESS-SUMMARY.md` - Resumo do progresso
- `IMPLEMENTATION-COMPLETE-10-MELHORIAS.md` - Relatório completo
- `ROADMAP-30-MELHORIAS.md` - Roadmap original

---

## 🎯 Próximos Comandos Úteis

### Desenvolvimento
```bash
# Rodar testes
npm test

# Lint
npm run lint

# Type check
npm run typecheck

# Build production
npm run build
```

### Database
```bash
# Backup
pg_dump beast_keepers > backup.sql

# Restore
psql beast_keepers < backup.sql

# Reset (CUIDADO!)
dropdb beast_keepers
createdb beast_keepers
# Rodar todas as migrations novamente
```

---

## ✅ Checklist de Validação

Após executar tudo, verificar:

- [ ] Servidor backend rodando (porta 3001)
- [ ] Frontend rodando (porta 5173)
- [ ] 9 Migrations executadas com sucesso
- [ ] 6 Novas tabelas criadas
- [ ] Sistema de áudio inicializado
- [ ] Configurações de áudio acessíveis (tecla M)
- [ ] 50 Conquistas visíveis
- [ ] Desafios diários aparecem
- [ ] Vectorizer indexou o projeto
- [ ] Sem erros no console

---

## 🎊 Pronto para Produção!

Com todas as implementações, o Beast Keepers está pronto para:
- ✅ Deploy em produção
- ✅ Testes com usuários reais
- ✅ Marketing e divulgação
- ✅ Monetização (se desejado)
- ✅ Próximas 20 melhorias do roadmap

---

**BOA SORTE E BOM JOGO! 🎮✨**

