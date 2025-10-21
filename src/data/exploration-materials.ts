/**
 * Materiais de Exploração - Beast Keepers
 * Materiais dropados por monstros selvagens durante exploração
 */

import type { Item } from '../types';

// ===== MATERIAIS DE EXPLORAÇÃO =====

export const EXPLORATION_MATERIALS: Item[] = [
  // === MATERIAIS COMUNS (Fácil de conseguir) ===
  {
    id: 'leather_scrap',
    name: 'Retalho de Couro',
    category: 'relic',
    effect: 'Material de craft comum',
    price: 10,
    description: 'Pedaço de couro de besta selvagem. Usado em craft básico.',
    quantity: 0,
  },
  {
    id: 'bone_fragment',
    name: 'Fragmento de Osso',
    category: 'relic',
    effect: 'Material de craft comum',
    price: 12,
    description: 'Osso quebrado de criatura. Resistente e útil.',
    quantity: 0,
  },
  {
    id: 'claw_shard',
    name: 'Lasca de Garra',
    category: 'relic',
    effect: 'Material de craft comum',
    price: 15,
    description: 'Garra afiada de predador. Perfura facilmente.',
    quantity: 0,
  },
  {
    id: 'fur_tuft',
    name: 'Tufo de Pelo',
    category: 'relic',
    effect: 'Material de craft comum',
    price: 8,
    description: 'Pelo macio e quente. Perfeito para proteção.',
    quantity: 0,
  },
  {
    id: 'fang_small',
    name: 'Presa Pequena',
    category: 'relic',
    effect: 'Material de craft comum',
    price: 18,
    description: 'Dente afiado de carnívoro jovem.',
    quantity: 0,
  },

  // === MATERIAIS INCOMUNS (Médio) ===
  {
    id: 'scale_iron',
    name: 'Escama de Ferro',
    category: 'relic',
    effect: 'Material de craft incomum',
    price: 35,
    description: 'Escama extremamente resistente. Dura como metal.',
    quantity: 0,
  },
  {
    id: 'venom_sac',
    name: 'Glândula de Veneno',
    category: 'relic',
    effect: 'Material de craft incomum',
    price: 40,
    description: 'Contém veneno potente. Manuseie com cuidado!',
    quantity: 0,
  },
  {
    id: 'feather_mystic',
    name: 'Pena Mística',
    category: 'relic',
    effect: 'Material de craft incomum',
    price: 45,
    description: 'Pena brilhante imbuída de energia mágica.',
    quantity: 0,
  },
  {
    id: 'horn_curved',
    name: 'Chifre Curvado',
    category: 'relic',
    effect: 'Material de craft incomum',
    price: 50,
    description: 'Chifre forte e imponente. Símbolo de poder.',
    quantity: 0,
  },
  {
    id: 'eye_crystal',
    name: 'Cristal Ocular',
    category: 'crystal',
    effect: 'Material de craft incomum',
    price: 55,
    description: 'Olho cristalizado de criatura ancestral. Vê além.',
    quantity: 0,
  },

  // === MATERIAIS RAROS (Difícil) ===
  {
    id: 'heart_stone',
    name: 'Coração de Pedra',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 100,
    description: 'Coração petrificado de golem antigo. Pulsa com energia.',
    quantity: 0,
  },
  {
    id: 'shadow_essence_raw',
    name: 'Essência Sombria Bruta',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 120,
    description: 'Escuridão pura e concentrada. Poder das sombras.',
    quantity: 0,
  },
  {
    id: 'flame_core',
    name: 'Núcleo Flamejante',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 110,
    description: 'Núcleo ainda quente de criatura ígnea. Queima eternamente.',
    quantity: 0,
  },
  {
    id: 'dragon_scale',
    name: 'Escama de Dragão',
    category: 'relic',
    effect: 'Material de craft raro',
    price: 150,
    description: 'Escama lendária. Impenetrável e preciosa.',
    quantity: 0,
  },
  {
    id: 'ethereal_dust',
    name: 'Poeira Etérea',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 90,
    description: 'Resíduo de espírito ancestral. Flutua no ar.',
    quantity: 0,
  },

  // === MATERIAIS ÉPICOS (Muito Raro) ===
  {
    id: 'ancient_blood',
    name: 'Sangue Ancestral',
    category: 'herb',
    effect: 'Material de craft épico',
    price: 250,
    description: 'Sangue de criatura lendária. Nunca coagula.',
    quantity: 0,
  },
  {
    id: 'titan_bone',
    name: 'Osso de Titã',
    category: 'relic',
    effect: 'Material de craft épico',
    price: 300,
    description: 'Osso gigantesco de titã caído. Poder primordial.',
    quantity: 0,
  },
  {
    id: 'phoenix_ash',
    name: 'Cinzas de Fênix',
    category: 'herb',
    effect: 'Material de craft épico',
    price: 280,
    description: 'Cinzas de fênix renascida. Revive o que foi perdido.',
    quantity: 0,
  },
  {
    id: 'void_fragment',
    name: 'Fragmento do Vazio',
    category: 'crystal',
    effect: 'Material de craft épico',
    price: 350,
    description: 'Pedaço do vazio absoluto. Não deveria existir.',
    quantity: 0,
  },
  {
    id: 'celestial_shard',
    name: 'Estilhaço Celestial',
    category: 'crystal',
    effect: 'Material de craft épico',
    price: 400,
    description: 'Fragmento de estrela caída. Brilha com luz divina.',
    quantity: 0,
  },
];

// ===== DROPS POR RARIDADE =====

export interface MaterialDrop {
  itemId: string;
  chance: number; // 0-100
  minQuantity: number;
  maxQuantity: number;
}

// Pools de drops por raridade
export const DROP_POOLS = {
  common: [
    { itemId: 'leather_scrap', chance: 40, minQuantity: 1, maxQuantity: 3 },
    { itemId: 'bone_fragment', chance: 35, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'claw_shard', chance: 30, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'fur_tuft', chance: 45, minQuantity: 2, maxQuantity: 4 },
    { itemId: 'fang_small', chance: 25, minQuantity: 1, maxQuantity: 1 },
  ],
  uncommon: [
    { itemId: 'scale_iron', chance: 25, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'venom_sac', chance: 20, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'feather_mystic', chance: 22, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'horn_curved', chance: 18, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'eye_crystal', chance: 15, minQuantity: 1, maxQuantity: 1 },
  ],
  rare: [
    { itemId: 'heart_stone', chance: 10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'shadow_essence_raw', chance: 8, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'flame_core', chance: 9, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'dragon_scale', chance: 5, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'ethereal_dust', chance: 12, minQuantity: 1, maxQuantity: 2 },
  ],
  epic: [
    { itemId: 'ancient_blood', chance: 3, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'titan_bone', chance: 2, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'phoenix_ash', chance: 3, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'void_fragment', chance: 1, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'celestial_shard', chance: 1, minQuantity: 1, maxQuantity: 1 },
  ],
};

// ===== HELPER FUNCTIONS =====

/**
 * Gera drops baseado em raridade
 */
export function generateDrops(rarity: 'common' | 'uncommon' | 'rare' | 'epic'): Item[] {
  const pool = DROP_POOLS[rarity];
  const drops: Item[] = [];

  for (const dropConfig of pool) {
    // Verifica chance
    if (Math.random() * 100 <= dropConfig.chance) {
      const quantity = Math.floor(
        Math.random() * (dropConfig.maxQuantity - dropConfig.minQuantity + 1)
      ) + dropConfig.minQuantity;

      const material = EXPLORATION_MATERIALS.find(m => m.id === dropConfig.itemId);
      if (material) {
        drops.push({
          ...material,
          quantity,
        });
      }
    }
  }

  return drops;
}

/**
 * Gera drops múltiplos (combate com vários inimigos)
 */
export function generateMultipleDrops(
  rarity: 'common' | 'uncommon' | 'rare' | 'epic',
  count: number
): Item[] {
  const allDrops: Item[] = [];

  for (let i = 0; i < count; i++) {
    const drops = generateDrops(rarity);
    allDrops.push(...drops);
  }

  // Consolida itens iguais
  const consolidated: Map<string, Item> = new Map();
  
  for (const drop of allDrops) {
    if (consolidated.has(drop.id)) {
      const existing = consolidated.get(drop.id)!;
      existing.quantity = (existing.quantity || 0) + (drop.quantity || 0);
    } else {
      consolidated.set(drop.id, { ...drop });
    }
  }

  return Array.from(consolidated.values());
}

/**
 * Retorna material por ID
 */
export function getMaterialById(id: string): Item | undefined {
  return EXPLORATION_MATERIALS.find(m => m.id === id);
}

/**
 * Retorna materiais por categoria
 */
export function getMaterialsByCategory(category: Item['category']): Item[] {
  return EXPLORATION_MATERIALS.filter(m => m.category === category);
}

