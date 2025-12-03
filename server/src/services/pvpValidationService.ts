/**
 * PVP Validation Service
 * Valida ações dos jogadores (anti-cheat)
 */

import { query, getClient } from '../db/connection';
import { getMatch } from './pvpMatchService';

export interface CombatAction {
  type: 'technique' | 'defend' | 'flee';
  techniqueId?: string;
}

export interface BeastData {
  id: number;
  currentHp: number;
  maxHp: number;
  currentEssence: number;
  maxEssence: number;
  techniques: string[];
}

/**
 * Valida ação do jogador
 */
export async function validateAction(
  matchId: number,
  userId: number,
  action: CombatAction,
  beastState: BeastData
): Promise<{ valid: boolean; error?: string }> {
  try {
    const match = await getMatch(matchId);
    if (!match) {
      return { valid: false, error: 'Match not found' };
    }
    
    // Verificar se partida ainda não terminou
    if (match.finishedAt) {
      return { valid: false, error: 'Match already finished' };
    }
    
    // Verificar se é o turno do jogador
    // (será implementado com estado da partida)
    
    // Validar tipo de ação
    if (!action.type || !['technique', 'defend', 'flee'].includes(action.type)) {
      return { valid: false, error: 'Invalid action type' };
    }
    
    // Validações específicas por tipo
    if (action.type === 'technique') {
      return await validateTechniqueAction(action, beastState);
    } else if (action.type === 'defend') {
      return { valid: true };
    } else if (action.type === 'flee') {
      // Fugir não é permitido em PVP
      return { valid: false, error: 'Cannot flee from PVP match' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('[PVP Validation] Error validating action:', error);
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Valida ação de técnica
 */
async function validateTechniqueAction(
  action: CombatAction,
  beastState: BeastData
): Promise<{ valid: boolean; error?: string }> {
  if (!action.techniqueId) {
    return { valid: false, error: 'Technique ID required' };
  }
  
  // Verificar se técnica existe na lista do beast
  if (!beastState.techniques.includes(action.techniqueId)) {
    return { valid: false, error: 'Technique not available' };
  }
  
  // Verificar essência (será validado com dados reais da técnica)
  // Por enquanto, apenas verificar se tem essência mínima
  if (beastState.currentEssence < 10) {
    return { valid: false, error: 'Insufficient essence' };
  }
  
  return { valid: true };
}

/**
 * Valida dano calculado (com tolerância para arredondamentos)
 */
export function validateDamage(
  calculatedDamage: number,
  reportedDamage: number,
  tolerance: number = 2
): boolean {
  const difference = Math.abs(calculatedDamage - reportedDamage);
  return difference <= tolerance;
}

/**
 * Valida estado do beast
 */
export async function validateBeastState(
  matchId: number,
  userId: number,
  beastState: BeastData
): Promise<{ valid: boolean; error?: string }> {
  try {
    const match = await getMatch(matchId);
    if (!match) {
      return { valid: false, error: 'Match not found' };
    }
    
    // Verificar se beast pertence ao jogador
    const isPlayer1 = match.player1Id === userId;
    const expectedBeastId = isPlayer1 ? match.player1BeastId : match.player2BeastId;
    
    if (beastState.id !== expectedBeastId) {
      return { valid: false, error: 'Beast does not belong to player' };
    }
    
    // Validar valores básicos
    if (beastState.currentHp < 0 || beastState.currentHp > beastState.maxHp) {
      return { valid: false, error: 'Invalid HP value' };
    }
    
    if (beastState.currentEssence < 0 || beastState.currentEssence > beastState.maxEssence) {
      return { valid: false, error: 'Invalid essence value' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('[PVP Validation] Error validating beast state:', error);
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Verifica timeout de ação (máximo 30 segundos por turno)
 */
export function checkActionTimeout(
  actionTimestamp: number,
  maxSeconds: number = 30
): boolean {
  const now = Date.now();
  const elapsed = (now - actionTimestamp) / 1000;
  return elapsed <= maxSeconds;
}

/**
 * Valida resultado da batalha
 */
export async function validateBattleResult(
  matchId: number,
  winnerId: number,
  player1FinalHp: number,
  player2FinalHp: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const match = await getMatch(matchId);
    if (!match) {
      return { valid: false, error: 'Match not found' };
    }
    
    // Verificar se winnerId é um dos jogadores
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return { valid: false, error: 'Invalid winner ID' };
    }
    
    // Verificar se HP final está correto
    const expectedLoserHp = winnerId === match.player1Id ? player2FinalHp : player1FinalHp;
    if (expectedLoserHp > 0) {
      return { valid: false, error: 'Loser HP should be 0 or less' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('[PVP Validation] Error validating battle result:', error);
    return { valid: false, error: 'Validation error' };
  }
}

