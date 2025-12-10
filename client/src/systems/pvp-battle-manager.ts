/**
 * Gerenciador de Batalha PVP
 * Gerencia estado, sincronização e resolução de turnos PVP
 */

import type { BattleContext, CombatAction } from '../types';
import { resolvePvpTurn } from './pvp-combat';

/**
 * Timeout de turno PVP (60 segundos)
 */
const PVP_TURN_TIMEOUT_MS = 60000;

/**
 * Timer de timeout do turno atual
 */
let pvpTurnTimeout: NodeJS.Timeout | null = null;

/**
 * Inicia timer de timeout para o turno PVP atual
 */
export function startPvpTurnTimeout(
  battle: BattleContext,
  matchId: number,
  onTimeout: () => void
): void {
  // Limpar timer anterior se existir
  stopPvpTurnTimeout();
  
  if (!battle.isPvp) {
    console.error('[PVP] startPvpTurnTimeout called on non-PVP battle');
    return;
  }
  
  battle.turnStartTime = Date.now();
  
  pvpTurnTimeout = setTimeout(() => {
    console.warn(`[PVP] Turn timeout for match ${matchId}`);
    onTimeout();
  }, PVP_TURN_TIMEOUT_MS);
  
  console.log(`[PVP] Turn timeout started for match ${matchId} (60s)`);
}

/**
 * Para o timer de timeout do turno PVP
 */
export function stopPvpTurnTimeout(): void {
  if (pvpTurnTimeout) {
    clearTimeout(pvpTurnTimeout);
    pvpTurnTimeout = null;
    console.log('[PVP] Turn timeout stopped');
  }
}

/**
 * Verifica se ambos jogadores fizeram ações e resolve o turno se necessário
 */
export function checkAndResolvePvpTurn(battle: BattleContext): boolean {
  if (!battle.isPvp) {
    return false;
  }
  
  // Se ambos fizeram ações, resolver turno
  if (battle.playerActionDone && battle.opponentActionDone) {
    console.log('[PVP] Both players made actions, resolving turn');
    resolvePvpTurn(battle);
    return true;
  }
  
  return false;
}

/**
 * Obtém tempo restante do turno em segundos
 */
export function getPvpTurnTimeRemaining(battle: BattleContext): number {
  if (!battle.isPvp || !battle.turnStartTime) {
    return 0;
  }
  
  const elapsed = Date.now() - battle.turnStartTime;
  const remaining = Math.max(0, PVP_TURN_TIMEOUT_MS - elapsed);
  return Math.floor(remaining / 1000);
}

