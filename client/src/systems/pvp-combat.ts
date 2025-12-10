/**
 * Sistema de Combate PVP - Isolado
 * Gerencia batalhas PVP sem interferir no sistema de combate normal
 */

import type {
  Beast,
  BattleContext,
  CombatEntity,
  CombatAction,
  CombatResult,
  Technique,
} from '../types';
import { 
  createCombatEntity, 
  executeTechnique, 
  executeDefend, 
  canUseTechnique,
  processActiveEffects,
  checkBattleEnd,
} from './combat';

/**
 * Inicia uma batalha PVP
 * Cria um BattleContext com flags PVP configuradas
 */
export function initiatePvpBattle(
  playerBeast: Beast,
  opponentBeast: Beast,
  matchId: number,
  opponentUserId: number
): BattleContext {
  const battle: BattleContext = {
    phase: 'intro',
    player: createCombatEntity(playerBeast),
    enemy: createCombatEntity(opponentBeast),
    turnCount: 0,
    combatLog: ['A batalha PVP começou!'],
    winner: null,
    canFlee: false, // PVP não permite fugir
    isPvp: true,
    matchId,
    opponentUserId,
    // PVP turn tracking
    playerActionDone: false,
    opponentActionDone: false,
    turnStartTime: Date.now(),
  };
  
  return battle;
}

/**
 * Executa ação do jogador em batalha PVP
 * Similar a executePlayerAction mas não passa turno automaticamente
 */
export function executePvpPlayerAction(battle: BattleContext, action: CombatAction): CombatResult | null {
  if (battle.phase !== 'player_turn') {
    return null;
  }
  
  // Se já fez ação neste turno, não permitir nova ação
  if (battle.playerActionDone) {
    console.log('[PVP] Player already made action this turn');
    return null;
  }
  
  let result: CombatResult;
  
  if (action.type === 'technique') {
    const technique = battle.player.beast.techniques.find(t => t.id === action.techniqueId);
    if (!technique) return null;
    
    if (!canUseTechnique(technique, battle.player.currentEssence)) {
      return null;
    }
    
    result = executeTechnique(battle.player, battle.enemy, technique);
  } else if (action.type === 'defend') {
    result = executeDefend(battle.player);
  } else {
    return null;
  }
  
  // Adiciona mensagens ao log
  battle.combatLog.push(...result.messages);
  
  // Processa efeitos
  const effectMessages = processActiveEffects(battle.enemy);
  battle.combatLog.push(...effectMessages);
  
  // Verifica fim de batalha
  checkBattleEnd(battle);
  
  // Marcar que player fez ação (NÃO passa turno - espera oponente)
  battle.playerActionDone = true;
  
  return result;
}

/**
 * Executa ação do oponente em batalha PVP
 * Recebe ação real do outro jogador via WebSocket
 */
export function executePvpOpponentAction(battle: BattleContext, action: CombatAction): CombatResult | null {
  if (!battle.isPvp) {
    console.error('[PVP] executePvpOpponentAction called on non-PVP battle');
    return null;
  }
  
  // Se já fez ação neste turno, não permitir nova ação
  if (battle.opponentActionDone) {
    console.log('[PVP] Opponent already made action this turn');
    return null;
  }
  
  let result: CombatResult;
  
  if (action.type === 'technique') {
    const technique = battle.enemy.beast.techniques.find(t => t.id === action.techniqueId);
    if (!technique) return null;
    
    if (!canUseTechnique(technique, battle.enemy.currentEssence)) {
      return null;
    }
    
    result = executeTechnique(battle.enemy, battle.player, technique);
  } else if (action.type === 'defend') {
    result = executeDefend(battle.enemy);
  } else {
    return null;
  }
  
  // Adiciona mensagens ao log
  battle.combatLog.push(...result.messages);
  
  // Processa efeitos
  const effectMessages = processActiveEffects(battle.player);
  battle.combatLog.push(...effectMessages);
  
  // Verifica fim de batalha
  checkBattleEnd(battle);
  
  // Marcar que oponente fez ação (NÃO passa turno - espera resolução)
  battle.opponentActionDone = true;
  
  return result;
}

/**
 * Resolve turno PVP após ambos jogadores fazerem ações
 */
export function resolvePvpTurn(battle: BattleContext): void {
  if (!battle.isPvp) {
    console.error('[PVP] resolvePvpTurn called on non-PVP battle');
    return;
  }
  
  // Verificar se ambos fizeram ações
  if (!battle.playerActionDone || !battle.opponentActionDone) {
    console.warn('[PVP] Cannot resolve turn - not all actions done');
    return;
  }
  
  // Ambos fizeram ações, avança para próximo turno
  battle.player.isDefending = false;
  battle.enemy.isDefending = false;
  battle.turnCount++;
  
  // Reset flags de ações
  battle.playerActionDone = false;
  battle.opponentActionDone = false;
  battle.turnStartTime = Date.now();
  
  // Sempre começa com turno do player no próximo round
  battle.phase = 'player_turn';
  
  console.log(`[PVP] Turn ${battle.turnCount - 1} resolved, starting turn ${battle.turnCount}`);
}

