/**
 * Gerenciamento do estado global do jogo
 */

import type { GameState, Beast, BeastLine } from '../types';
import { createBeast } from './beast';
import { save as saveToStorage, load as loadFromStorage } from '../storage';
import { AVAILABLE_QUESTS } from './quests';
import { ACHIEVEMENTS } from './achievements';

/**
 * Cria um novo estado de jogo
 */
export function createNewGame(playerName: string): GameState {
  // Cria primeira besta (Brontis - boa para iniciantes)
  const firstBeast = createBeast('brontis', 'Início', 1);

  const gameState: GameState = {
    currentWeek: 1,
    year: 1,
    totalWeeks: 1,
    
    guardian: {
      name: playerName,
      level: 1,
      title: 'Guardião Iniciante',
      reputation: 0,
      bronzeWins: 0,
      silverWins: 0,
      goldWins: 0,
      mythicWins: 0,
      ranchUpgrades: [],
      maxBeasts: 1,
    },
    
    ranch: {
      beasts: [firstBeast],
      maxBeasts: 1,
      upgrades: [],
    },
    
    activeBeast: firstBeast,
    
    economy: {
      coronas: 500,
      ecoCrystals: 0,
    },
    
    inventory: [],
    
    npcs: [], // NPCs are now managed globally in data/npcs.ts
    
    quests: [...AVAILABLE_QUESTS], // Initialize with all quests
    achievements: [...ACHIEVEMENTS], // Initialize with all achievements
    winStreak: 0,
    loseStreak: 0,
    totalTrains: 0,
    totalCrafts: 0,
    totalSpent: 0,
    
    unlockedLines: ['brontis', 'mirella', 'feralis'], // 3 linhas iniciais
    unlockedFeatures: [],
    discoveredRelics: [],
    deceasedBeasts: [],
    victories: 0,
    defeats: 0,
  };

  return gameState;
}

/**
 * Salva o estado do jogo
 */
export async function saveGame(state: GameState): Promise<void> {
  try {
    await saveToStorage('beast_keepers_save', state);
    console.log('[Save] Jogo salvo com sucesso');
  } catch (error) {
    console.error('[Save] Erro ao salvar:', error);
    throw error;
  }
}

/**
 * Carrega o estado do jogo
 */
export async function loadGame(): Promise<GameState | null> {
  try {
    const state = await loadFromStorage<GameState>('beast_keepers_save');
    if (state) {
      console.log('[Save] Jogo carregado com sucesso');
    }
    return state;
  } catch (error) {
    console.error('[Save] Erro ao carregar:', error);
    return null;
  }
}

/**
 * Adiciona dinheiro ao jogador
 */
export function addMoney(state: GameState, amount: number) {
  state.economy.coronas += amount;
}

/**
 * Remove dinheiro do jogador
 */
export function removeMoney(state: GameState, amount: number): boolean {
  if (state.economy.coronas >= amount) {
    state.economy.coronas -= amount;
    return true;
  }
  return false;
}

/**
 * Avança uma semana no calendário
 */
export function advanceGameWeek(state: GameState) {
  state.currentWeek++;
  
  // Calcula ano (52 semanas = 1 ano)
  state.year = Math.floor((state.currentWeek - 1) / 52) + 1;
}

/**
 * Adiciona nova besta ao rancho
 */
export function addBeast(state: GameState, line: BeastLine, name: string): Beast | null {
  if (state.ranch.beasts.length >= state.guardian.maxBeasts) {
    return null;
  }

  const newBeast = createBeast(line, name, state.currentWeek);
  state.ranch.beasts.push(newBeast);
  
  if (!state.activeBeast) {
    state.activeBeast = newBeast;
  }
  
  return newBeast;
}

/**
 * Define besta ativa
 */
export function setActiveBeast(state: GameState, beastId: string) {
  const beast = state.ranch.beasts.find(b => b.id === beastId);
  if (beast) {
    state.activeBeast = beast;
  }
}

/**
 * Remove besta (morte ou liberação)
 */
export function removeBeast(state: GameState, beastId: string) {
  const index = state.ranch.beasts.findIndex(b => b.id === beastId);
  if (index !== -1) {
    const [beast] = state.ranch.beasts.splice(index, 1);
    state.deceasedBeasts.push(beast);
    
    if (state.activeBeast?.id === beastId) {
      state.activeBeast = state.ranch.beasts[0] || null;
    }
  }
}

