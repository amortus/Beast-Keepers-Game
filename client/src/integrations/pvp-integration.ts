/**
 * Integração PVP - Ponte entre sistema PVP e main.ts
 * Isola toda lógica PVP para não interferir com batalhas normais
 */

import type { BattleContext, CombatAction, Beast, GameState } from '../types';
import { BattleUI, BattleUIHybrid } from '../ui/battle-ui';
import { initiatePvpBattle, executePvpPlayerAction, executePvpOpponentAction, resolvePvpTurn } from '../systems/pvp-combat';
import { startPvpTurnTimeout, stopPvpTurnTimeout, checkAndResolvePvpTurn } from '../systems/pvp-battle-manager';
import { pvpSocketClient } from '../services/pvpSocketClient';
import { getMatch, finishMatch } from '../api/pvpApi';
import { checkBattleEnd } from '../systems/combat';

/**
 * Configuração de handlers de socket PVP
 */
export function setupPvpSocketHandlersIntegration(
  gameState: GameState | null,
  battleUI: BattleUI | BattleUIHybrid | null,
  onBattleUpdate: (battle: BattleContext) => void,
  onBattleEnd: (battle: BattleContext, winnerId: number) => Promise<void>
): void {
  // Match found handler
  pvpSocketClient.onMatchFound(async (data) => {
    // Será tratado pelo handlePvpMatchFound
  });
  
  // Match start handler
  pvpSocketClient.onMatchStart((data) => {
    console.log('[PVP] Match started:', data);
  });
  
  // Match action handler (receber ações do oponente)
  pvpSocketClient.onMatchAction(async (data) => {
    if (!gameState?.currentBattle || !gameState.currentBattle.isPvp || gameState.currentBattle.matchId !== data.matchId) {
      return;
    }
    
    // Executar ação real do oponente (não usar IA)
    if (data.fromPlayer === gameState.currentBattle.opponentUserId) {
      console.log('[PVP] Received action from opponent:', data.action);
      
      // Tocar animação de ataque do oponente ANTES de processar a ação
      if (battleUI && (battleUI as any).arenaScene3D) {
        const arenaScene3D = (battleUI as any).arenaScene3D;
        if (arenaScene3D && typeof arenaScene3D.playAttackAnimation === 'function') {
          console.log('[PVP] Playing attack animation for opponent');
          arenaScene3D.playAttackAnimation('enemy', 'player');
          
          // Processar ação após animação
          setTimeout(async () => {
            if (!gameState?.currentBattle) return;
            
            const result = executePvpOpponentAction(gameState.currentBattle, data.action);
            
            if (result && battleUI) {
              // Verificar se batalha terminou ANTES de marcar ação como feita
              const battleEnded = gameState.currentBattle.winner !== null;
              
              // Atualizar UI para mostrar dano do oponente
              onBattleUpdate(gameState.currentBattle);
              
              // Se batalha terminou, finalizar IMEDIATAMENTE
              if (gameState.currentBattle.winner) {
                console.log('[PVP] Battle ended with winner:', gameState.currentBattle.winner, 'after opponent action');
                const match = await getMatch(data.matchId).catch(() => null);
                if (match) {
                  const isPlayer1 = match.player1BeastId.toString() === gameState.activeBeast?.id;
                  const playerUserId = isPlayer1 ? match.player1Id : match.player2Id;
                  const opponentUserId = isPlayer1 ? match.player2Id : match.player1Id;
                  const winnerId = gameState.currentBattle.winner === 'player' ? playerUserId : opponentUserId;
                  
                  await onBattleEnd(gameState.currentBattle, winnerId);
                }
                return;
              }
              
              // Se ambos fizeram ações, resolver turno (só se batalha não terminou)
              if (!battleEnded && checkAndResolvePvpTurn(gameState.currentBattle)) {
                onBattleUpdate(gameState.currentBattle);
                if (battleUI) {
                  battleUI.draw();
                }
                
                // Reiniciar timer para próximo turno
                startPvpTurnTimeout(
                  gameState.currentBattle,
                  data.matchId,
                  () => handlePvpTurnTimeout(gameState, data.matchId, onBattleUpdate)
                );
                
                // Se agora é turno do jogador e auto-battle está ativo, executar ação automática
                if (gameState.currentBattle.phase === 'player_turn' && battleUI.isAutoBattleActive()) {
                  console.log('[PVP] Auto-battle is active, executing action automatically');
                  setTimeout(() => {
                    if (battleUI && gameState?.currentBattle) {
                      battleUI.checkAutoBattle();
                    }
                  }, 500);
                }
              }
            }
          }, 600); // Aguardar animação terminar
          return; // Early return - ação será processada após animação
        }
      }
      
      // Fallback: processar ação imediatamente se não houver 3D scene
      const result = executePvpOpponentAction(gameState.currentBattle, data.action);
      
      if (result && battleUI) {
        onBattleUpdate(gameState.currentBattle);
        
        // Se batalha terminou, finalizar
        if (gameState.currentBattle.winner) {
          const match = await getMatch(data.matchId).catch(() => null);
          if (match) {
            const isPlayer1 = match.player1BeastId.toString() === gameState.activeBeast?.id;
            const playerUserId = isPlayer1 ? match.player1Id : match.player2Id;
            const opponentUserId = isPlayer1 ? match.player2Id : match.player1Id;
            const winnerId = gameState.currentBattle.winner === 'player' ? playerUserId : opponentUserId;
            
            await onBattleEnd(gameState.currentBattle, winnerId);
          }
          return;
        }
        
        // Se ambos fizeram ações, resolver turno
        if (checkAndResolvePvpTurn(gameState.currentBattle)) {
          onBattleUpdate(gameState.currentBattle);
          if (battleUI) {
            battleUI.draw();
          }
          
          startPvpTurnTimeout(
            gameState.currentBattle,
            data.matchId,
            () => handlePvpTurnTimeout(gameState, data.matchId, onBattleUpdate)
          );
          
          // Se agora é turno do jogador e auto-battle está ativo, executar ação automática
          if (gameState.currentBattle.phase === 'player_turn' && battleUI.isAutoBattleActive()) {
            console.log('[PVP] Auto-battle is active, executing action automatically');
            setTimeout(() => {
              if (battleUI && gameState?.currentBattle) {
                battleUI.checkAutoBattle();
              }
            }, 500);
          }
        }
      }
    }
  });
  
  // Match state handler
  pvpSocketClient.onMatchState((data) => {
    if (gameState?.currentBattle && gameState.currentBattle.isPvp && gameState.currentBattle.matchId === data.matchId) {
      // Atualizar estado da batalha
      // Implementar sincronização de estado se necessário
    }
  });
  
  // Challenge received handler
  pvpSocketClient.onChallengeReceived((data) => {
    // Será tratado pelo componente que gerencia a UI de arena
  });
}

/**
 * Handler para timeout de turno PVP
 */
function handlePvpTurnTimeout(
  gameState: GameState | null,
  matchId: number,
  onBattleUpdate: (battle: BattleContext) => void
): void {
  if (!gameState?.currentBattle || !gameState.currentBattle.isPvp || gameState.currentBattle.matchId !== matchId) {
    return;
  }
  
  const currentBattle = gameState.currentBattle;
  
  // Verificar se é o turno do jogador e ele ainda não fez ação
  if (currentBattle.phase === 'player_turn' && !currentBattle.playerActionDone) {
    console.log('[PVP] ⏰ Turn timeout - player did not respond in 60s, skipping turn');
    
    // Pular turno do jogador (defender automaticamente)
    currentBattle.playerActionDone = true;
    currentBattle.combatLog.push('⏰ Você demorou muito! Turno pulado.');
    
    // Enviar ação de defesa como fallback
    try {
      const beastState = {
        id: gameState.activeBeast?.id,
        currentHp: currentBattle.player.currentHp,
        maxHp: currentBattle.player.beast.maxHp,
        currentEssence: currentBattle.player.currentEssence,
        maxEssence: currentBattle.player.beast.maxEssence,
        techniques: currentBattle.player.beast.techniques.map((t: any) => t.id),
      };
      
      pvpSocketClient.sendAction(matchId, { type: 'defend' }, beastState);
      onBattleUpdate(currentBattle);
      
      // Se oponente já fez ação, resolver turno
      if (currentBattle.opponentActionDone) {
        resolvePvpTurn(currentBattle);
        onBattleUpdate(currentBattle);
        
        startPvpTurnTimeout(
          currentBattle,
          matchId,
          () => handlePvpTurnTimeout(gameState, matchId, onBattleUpdate)
        );
      }
    } catch (error) {
      console.error('[PVP] Error sending timeout action:', error);
    }
  }
}

/**
 * Cria handler de ação do jogador para batalha PVP
 */
export function createPvpPlayerActionHandler(
  battle: BattleContext,
  matchId: number,
  gameState: GameState,
  onBattleUpdate: (battle: BattleContext) => void,
  onBattleEnd: (battle: BattleContext, winnerId: number) => Promise<void>
): (action: CombatAction) => Promise<void> {
  return async (action: CombatAction) => {
    if (!battle.isPvp) {
      return;
    }
    
    // Se já fez ação neste turno, não permitir nova ação
    if (battle.playerActionDone) {
      console.log('[PVP] Player already made action this turn, waiting for opponent');
      return;
    }
    
    console.log('[PVP] Player action:', action);
    
    // Executar ação localmente (isso faz as animações e atualiza UI)
    const result = executePvpPlayerAction(battle, action);
    
    if (!result) {
      console.error('[PVP] executePvpPlayerAction returned null');
      return;
    }
    
    // Verificar se batalha terminou APÓS executar ação
    const battleEnded = battle.winner !== null;
    
    console.log('[PVP] After player action - winner:', battle.winner, 'phase:', battle.phase, 'enemy HP:', battle.enemy.currentHp);
    
    // Atualizar UI imediatamente para mostrar animações
    onBattleUpdate(battle);
    
    // Se batalha terminou, finalizar IMEDIATAMENTE (antes de enviar ação ao oponente)
    if (battle.winner) {
      console.log('[PVP] ⚔️ Battle ended! Winner:', battle.winner, 'Player HP:', battle.player.currentHp, 'Enemy HP:', battle.enemy.currentHp);
      const match = await getMatch(matchId).catch(() => null);
      if (match) {
        const isPlayer1 = match.player1BeastId.toString() === gameState.activeBeast?.id;
        const playerUserId = isPlayer1 ? match.player1Id : match.player2Id;
        const opponentUserId = isPlayer1 ? match.player2Id : match.player1Id;
        const winnerId = battle.winner === 'player' ? playerUserId : opponentUserId;
        
        console.log('[PVP] Finishing battle - winnerId:', winnerId, 'playerUserId:', playerUserId);
        await onBattleEnd(battle, winnerId);
      }
      return;
    }
    
    // Enviar ação via WebSocket para sincronizar com oponente
    try {
      const beastState = {
        id: gameState.activeBeast?.id,
        currentHp: battle.player.currentHp,
        maxHp: battle.player.beast.maxHp,
        currentEssence: battle.player.currentEssence,
        maxEssence: battle.player.beast.maxEssence,
        techniques: battle.player.beast.techniques.map((t: any) => t.id),
      };
      
      console.log('[PVP] Sending action to opponent via socket:', action);
      pvpSocketClient.sendAction(matchId, action, beastState);
    } catch (error) {
      console.error('[PVP] Error sending action via socket:', error);
    }
    
    // Se ambos fizeram ações, resolver turno
    if (checkAndResolvePvpTurn(battle)) {
      console.log('[PVP] Both players made actions, resolving turn');
      onBattleUpdate(battle);
      
      // Reiniciar timer para próximo turno
      startPvpTurnTimeout(
        battle,
        matchId,
        () => handlePvpTurnTimeout(gameState, matchId, onBattleUpdate)
      );
    }
  };
}

/**
 * Cria handler de fim de batalha PVP
 */
export function createPvpBattleEndHandler(
  battle: BattleContext,
  gameState: GameState,
  onCloseBattle: () => void,
  onBattleEnd: (battle: BattleContext, winnerId: number) => Promise<void>
): () => Promise<void> {
  return async () => {
    if (!battle.isPvp) {
      return;
    }
    
    console.log('[PVP Battle] Battle ended - Phase:', battle.phase, 'Winner:', battle.winner);
    
    // PROTEÇÃO: Verificar fase
    if (battle.phase !== 'victory' && battle.phase !== 'defeat') {
      console.error('[PVP Battle] ❌ onBattleEnd called but phase is:', battle.phase);
      return;
    }
    
    // Atualizar HP/Essence do beast ANTES de finalizar
    if (gameState.activeBeast) {
      gameState.activeBeast.currentHp = battle.player.currentHp;
      gameState.activeBeast.essence = battle.player.currentEssence;
      
      // Atualizar vitórias/derrotas
      if (battle.winner === 'player') {
        gameState.victories++;
        gameState.activeBeast.victories++;
      } else {
        gameState.defeats++;
        gameState.activeBeast.defeats++;
      }
      
      console.log('[PVP Battle] Beast HP after battle:', gameState.activeBeast.currentHp);
    }
    
    // Fechar batalha IMEDIATAMENTE
    onCloseBattle();
    
    // Finalizar partida no servidor e mostrar resultado
    if (battle.matchId) {
      const match = await getMatch(battle.matchId).catch(() => null);
      if (match) {
        const isPlayer1 = match.player1BeastId.toString() === gameState.activeBeast?.id;
        const playerUserId = isPlayer1 ? match.player1Id : match.player2Id;
        const opponentUserId = isPlayer1 ? match.player2Id : match.player1Id;
        const winnerId = battle.winner === 'player' ? playerUserId : opponentUserId;
        
        await onBattleEnd(battle, winnerId);
      }
    }
  };
}

