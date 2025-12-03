# Integração PVP - Guia de Implementação

## Status da Implementação

✅ **Backend Completo:**
- Migrations do banco de dados
- Serviços (ranking, matchmaking, partidas, temporadas, recompensas, validação)
- Controllers REST
- Handlers WebSocket
- Scheduler de temporadas

✅ **Frontend Completo:**
- API Client (REST)
- Socket Client (WebSocket)
- UIs (matchmaking, ranking, desafios)

⚠️ **Integração com Batalha (Parcial):**
- Tipos atualizados (`BattleContext` com flags PVP)
- Função `initiateBattle` atualizada
- **Pendente:** Integração completa no `main.ts`

## Como Integrar PVP no Sistema de Batalha

### 1. No `main.ts`, adicionar:

```typescript
import { pvpSocketClient } from './services/pvpSocketClient';
import { PvpMatchmakingUI } from './ui/pvp-matchmaking-ui';
import { PvpRankingUI } from './ui/pvp-ranking-ui';
import { PvpChallengeUI } from './ui/pvp-challenge-ui';
import { finishMatch } from './api/pvpApi';

// Inicializar UIs
const pvpMatchmakingUI = new PvpMatchmakingUI();
const pvpRankingUI = new PvpRankingUI();
const pvpChallengeUI = new PvpChallengeUI();

// Conectar socket quando usuário logar
const token = localStorage.getItem('auth_token');
if (token) {
  pvpSocketClient.connect(token);
}

// Handler para match encontrado
pvpMatchmakingUI.onMatchFound = async (matchId, opponent, matchType) => {
  // Buscar dados do oponente via API
  const match = await getMatch(matchId);
  const opponentBeast = await getOpponentBeast(match.player2BeastId); // ou player1BeastId
  
  // Iniciar batalha PVP
  const battle = initiateBattle(
    gameState.activeBeast,
    opponentBeast,
    false, // não pode fugir
    true,  // isPvp
    matchId,
    opponent.userId
  );
  
  // Configurar callbacks para sincronização via WebSocket
  setupPvpBattleSync(battle, matchId);
  
  // Iniciar UI de batalha normalmente
  // ...
};

// Handler para desafio aceito
pvpChallengeUI.onChallengeAccepted = async (matchId) => {
  // Similar ao matchmaking, mas com dados do desafio
  // ...
};

// Função para sincronizar batalha PVP
function setupPvpBattleSync(battle: BattleContext, matchId: number) {
  // Enviar ações via WebSocket
  // Receber ações do oponente
  pvpSocketClient.onMatchAction((data) => {
    if (data.matchId === matchId && data.fromPlayer !== currentUserId) {
      // Executar ação do oponente
      executeEnemyActionFromPvp(battle, data.action);
    }
  });
  
  // Modificar executePlayerAction para enviar via WebSocket
  const originalExecutePlayerAction = executePlayerAction;
  // ... interceptar e enviar via socket
}

// Ao finalizar batalha PVP
async function finishPvpBattle(battle: BattleContext, winnerId: number) {
  if (!battle.isPvp || !battle.matchId) return;
  
  const durationSeconds = Math.floor((Date.now() - battleStartTime) / 1000);
  
  await finishMatch(battle.matchId, winnerId, durationSeconds);
  
  // Aplicar recompensas (já feito no backend)
  // Mostrar resultado
}
```

### 2. Adicionar botões no GameUI:

```typescript
// No GameUI, adicionar botões para:
// - "PVP Matchmaking" → pvpMatchmakingUI.show(activeBeast)
// - "Ranking" → pvpRankingUI.show()
// - "Desafios" → pvpChallengeUI.show(activeBeast)
```

### 3. Integrar com Chat:

No `chat-ui.ts`, adicionar botão "Desafiar" ao clicar em nome de usuário:

```typescript
// Ao clicar em nome de usuário no chat
onUsernameClick(userId, userName) {
  pvpChallengeUI.sendChallengeToUser(userId, userName);
}
```

## Próximos Passos

1. Implementar função `getOpponentBeast()` para buscar beast do oponente
2. Implementar `setupPvpBattleSync()` para sincronização em tempo real
3. Modificar `executePlayerAction` para enviar ações via WebSocket em PVP
4. Adicionar botões de PVP no GameUI
5. Integrar desafios com chat
6. Testar matchmaking ranked e casual
7. Testar desafios diretos
8. Testar sincronização de batalhas

## Notas Importantes

- Partidas casuais não afetam ELO
- Partidas rankeadas atualizam ELO automaticamente
- Desafios diretos são sempre casuais (sem ranking)
- Temporadas são mensais e resetam automaticamente
- Validação server-side previne cheating

