/**
 * Sistema de Exploração - Beast Keepers
 * Gerencia exploração, encontros com monstros selvagens e coleta de materiais
 */

import type { Item } from '../types';
import { generateDrops } from '../data/exploration-materials';

// ===== TIPOS =====

export type ExplorationZone = 'forest' | 'mountains' | 'caves' | 'desert' | 'swamp' | 'ruins';

export type EncounterType = 'enemy' | 'treasure' | 'event' | 'nothing';

export interface WildEnemy {
  id: string;
  name: string;
  line: string;
  level: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  description: string;
  stats: {
    might: number;
    wit: number;
    focus: number;
    agility: number;
    ward: number;
    vitality: number;
  };
  aiPersonality?: string;
  drops: Array<{ itemId: string; chance: number; quantity: number }>;
}

export interface Encounter {
  type: EncounterType;
  enemy?: WildEnemy;
  treasure?: Item[];
  eventMessage?: string;
  distance: number; // Distância percorrida até este encounter
}

export interface ExplorationState {
  zone: ExplorationZone;
  distance: number; // Total percorrido
  encounters: Encounter[];
  currentEncounter: number;
  isActive: boolean;
  collectedMaterials: Item[];
  enemiesDefeated: number;
  treasuresFound: number;
}

// ===== ZONAS DE EXPLORAÇÃO =====

export const EXPLORATION_ZONES: Record<ExplorationZone, {
  name: string;
  description: string;
  difficulty: number; // 1-5
  commonEnemies: string[];
  rareEnemies: string[];
}> = {
  forest: {
    name: 'Floresta Selvagem',
    description: 'Floresta densa com criaturas comuns. Bom para iniciantes.',
    difficulty: 1,
    commonEnemies: ['forest_wolf', 'wild_boar', 'tree_spirit'],
    rareEnemies: ['ancient_treant'],
  },
  mountains: {
    name: 'Montanhas Geladas',
    description: 'Montanhas traiçoeiras com criaturas resistentes.',
    difficulty: 2,
    commonEnemies: ['mountain_goat', 'ice_elemental', 'rock_golem'],
    rareEnemies: ['frost_dragon'],
  },
  caves: {
    name: 'Cavernas Profundas',
    description: 'Cavernas escuras cheias de perigos. Recompensas valiosas.',
    difficulty: 3,
    commonEnemies: ['cave_bat', 'giant_spider', 'slime'],
    rareEnemies: ['cave_wyvern'],
  },
  desert: {
    name: 'Deserto Árido',
    description: 'Deserto escaldante com criaturas adaptadas ao calor.',
    difficulty: 3,
    commonEnemies: ['sand_serpent', 'scorpion', 'desert_nomad'],
    rareEnemies: ['sand_titan'],
  },
  swamp: {
    name: 'Pântano Venenoso',
    description: 'Pântano tóxico. Criaturas venenosas e drops raros.',
    difficulty: 4,
    commonEnemies: ['swamp_beast', 'poison_frog', 'bog_wraith'],
    rareEnemies: ['swamp_hydra'],
  },
  ruins: {
    name: 'Ruínas Antigas',
    description: 'Ruínas de civilização perdida. Criaturas poderosas.',
    difficulty: 5,
    commonEnemies: ['guardian_statue', 'cursed_knight', 'shadow_beast'],
    rareEnemies: ['ancient_lich'],
  },
};

// ===== GERAÇÃO DE ENCONTROS =====

/**
 * Gera um encontro aleatório baseado na zona
 */
export function generateEncounter(
  zone: ExplorationZone,
  distance: number
): Encounter {
  const _zoneData = EXPLORATION_ZONES[zone];
  void _zoneData; // Reservado para uso futuro
  const rand = Math.random();

  // Chances de cada tipo de encontro
  const encounterChances = {
    enemy: 0.60,    // 60% chance de inimigo
    treasure: 0.15, // 15% chance de tesouro
    event: 0.10,    // 10% chance de evento
    nothing: 0.15,  // 15% chance de nada
  };

  let type: EncounterType = 'nothing';
  
  if (rand < encounterChances.enemy) {
    type = 'enemy';
  } else if (rand < encounterChances.enemy + encounterChances.treasure) {
    type = 'treasure';
  } else if (rand < encounterChances.enemy + encounterChances.treasure + encounterChances.event) {
    type = 'event';
  }

  const encounter: Encounter = {
    type,
    distance,
  };

  // Gera conteúdo baseado no tipo
  if (type === 'enemy') {
    encounter.enemy = generateWildEnemy(zone, distance);
  } else if (type === 'treasure') {
    encounter.treasure = generateTreasure(zone);
  } else if (type === 'event') {
    encounter.eventMessage = generateRandomEvent();
  }

  return encounter;
}

/**
 * Gera inimigo selvagem
 */
function generateWildEnemy(zone: ExplorationZone, distance: number): WildEnemy {
  const zoneData = EXPLORATION_ZONES[zone];
  
  // Chance de inimigo raro aumenta com distância
  const rareChance = Math.min(0.1 + (distance / 1000) * 0.05, 0.25); // Máx 25%
  const isRare = Math.random() < rareChance;
  
  const enemyPool = isRare ? zoneData.rareEnemies : zoneData.commonEnemies;
  const enemyType = enemyPool[Math.floor(Math.random() * enemyPool.length)];
  
  return createEnemyByType(enemyType, zone, distance);
}

/**
 * Cria inimigo baseado no tipo
 */
function createEnemyByType(type: string, zone: ExplorationZone, distance: number): WildEnemy {
  const baseLevel = Math.floor(distance / 100) + 1;
  const difficulty = EXPLORATION_ZONES[zone].difficulty;
  const level = baseLevel + difficulty;

  // Mapeia tipos de inimigos (simplificado)
  const enemyData: Record<string, Partial<WildEnemy>> = {
    forest_wolf: {
      name: 'Lobo Selvagem',
      line: 'raukor',
      description: 'Lobo agressivo da floresta',
      rarity: 'common',
      aiPersonality: 'berserker',
    },
    wild_boar: {
      name: 'Javali Furioso',
      line: 'feralis',
      description: 'Javali territorial',
      rarity: 'common',
      aiPersonality: 'berserker',
    },
    ancient_treant: {
      name: 'Treant Ancestral',
      line: 'terravox',
      description: 'Árvore antiga com vida',
      rarity: 'rare',
      aiPersonality: 'tank',
    },
    // Adicione mais conforme necessário...
  };

  const data = enemyData[type] || {
    name: 'Criatura Selvagem',
    line: 'feralis',
    description: 'Criatura misteriosa',
    rarity: 'common',
  };

  // Calcula stats baseados no level e dificuldade
  const statBase = 20 + level * 3 + difficulty * 5;
  
  return {
    id: `wild_${type}_${Date.now()}`,
    name: data.name || 'Criatura',
    line: data.line || 'feralis',
    level,
    rarity: data.rarity || 'common',
    description: data.description || '',
    stats: {
      might: statBase + Math.floor(Math.random() * 10),
      wit: statBase + Math.floor(Math.random() * 10),
      focus: statBase + Math.floor(Math.random() * 10),
      agility: statBase + Math.floor(Math.random() * 10),
      ward: statBase + Math.floor(Math.random() * 10),
      vitality: statBase + Math.floor(Math.random() * 10),
    },
    aiPersonality: data.aiPersonality,
    drops: generateEnemyDrops(data.rarity || 'common'),
  };
}

/**
 * Gera lista de drops para o inimigo
 */
function generateEnemyDrops(rarity: 'common' | 'uncommon' | 'rare' | 'epic'): Array<{
  itemId: string;
  chance: number;
  quantity: number;
}> {
  // Retorna configuração de drops
  const drops = generateDrops(rarity);
  return drops.map(drop => ({
    itemId: drop.id,
    chance: 80, // 80% chance de dropar
    quantity: drop.quantity || 1,
  }));
}

/**
 * Gera tesouro aleatório
 */
function generateTreasure(_zone: ExplorationZone): Item[] {
  const difficulty = EXPLORATION_ZONES[_zone].difficulty;
  
  // Raridade do tesouro baseada em dificuldade
  let rarity: 'common' | 'uncommon' | 'rare' | 'epic' = 'common';
  
  if (difficulty >= 4) {
    rarity = Math.random() < 0.3 ? 'rare' : 'uncommon';
  } else if (difficulty >= 3) {
    rarity = Math.random() < 0.2 ? 'uncommon' : 'common';
  }
  
  return generateDrops(rarity);
}

/**
 * Gera evento aleatório
 */
function generateRandomEvent(): string {
  const events = [
    '🌟 Você encontrou uma fonte mágica! Recuperou 20% HP e Essência.',
    '⚠️ Uma tempestade súbita! Nenhum material encontrado aqui.',
    '🎁 Um viajante deixou um baú! Você ganhou materiais extras.',
    '🦅 Uma ave guia você! Avance mais rápido.',
    '💎 Você encontrou um depósito de cristais!',
    '🌿 Plantas medicinais crescem aqui. Ótimo para descanso.',
  ];
  
  return events[Math.floor(Math.random() * events.length)];
}

// ===== ESTADO DE EXPLORAÇÃO =====

/**
 * Inicia nova exploração
 */
export function startExploration(zone: ExplorationZone): ExplorationState {
  return {
    zone,
    distance: 0,
    encounters: [],
    currentEncounter: 0,
    isActive: true,
    collectedMaterials: [],
    enemiesDefeated: 0,
    treasuresFound: 0,
  };
}

/**
 * Avança na exploração
 */
export function advanceExploration(
  state: ExplorationState,
  steps: number = 100
): Encounter {
  state.distance += steps;
  
  const encounter = generateEncounter(state.zone, state.distance);
  state.encounters.push(encounter);
  state.currentEncounter = state.encounters.length - 1;
  
  return encounter;
}

/**
 * Coleta materiais de um encontro
 */
export function collectMaterials(
  state: ExplorationState,
  materials: Item[]
): void {
  // Consolida materiais
  for (const material of materials) {
    const existing = state.collectedMaterials.find(m => m.id === material.id);
    if (existing) {
      existing.quantity = (existing.quantity || 0) + (material.quantity || 0);
    } else {
      state.collectedMaterials.push({ ...material });
    }
  }
}

/**
 * Registra vitória contra inimigo
 */
export function defeatEnemy(
  state: ExplorationState,
  enemy: WildEnemy
): Item[] {
  state.enemiesDefeated++;
  
  // Gera drops baseado na configuração do inimigo
  const drops = generateDrops(enemy.rarity);
  collectMaterials(state, drops);
  
  return drops;
}

/**
 * Finaliza exploração
 */
export function endExploration(state: ExplorationState): {
  totalDistance: number;
  enemiesDefeated: number;
  treasuresFound: number;
  materials: Item[];
} {
  state.isActive = false;
  
  return {
    totalDistance: state.distance,
    enemiesDefeated: state.enemiesDefeated,
    treasuresFound: state.treasuresFound,
    materials: state.collectedMaterials,
  };
}

/**
 * Calcula recompensas de exploração
 */
export function calculateExplorationRewards(state: ExplorationState): {
  experience: number;
  coronas: number;
  materials: Item[];
} {
  const baseExp = state.distance / 10;
  const enemyBonus = state.enemiesDefeated * 50;
  const treasureBonus = state.treasuresFound * 25;
  
  return {
    experience: Math.floor(baseExp + enemyBonus + treasureBonus),
    coronas: Math.floor(state.enemiesDefeated * 20 + state.treasuresFound * 50),
    materials: state.collectedMaterials,
  };
}

