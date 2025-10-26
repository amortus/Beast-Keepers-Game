/**
 * Sistema de Loja - Catálogo de Itens
 */

import type { Item } from '../types';

export const SHOP_ITEMS: Item[] = [
  // ===== ALIMENTOS =====
  {
    id: 'basic_food',
    name: 'Ração Básica',
    category: 'food',
    effect: 'Reduz 10 de Fadiga',
    price: 50,
    description: 'Alimento padrão e nutritivo para Bestas.',
  },
  {
    id: 'premium_food',
    name: 'Ração Premium',
    category: 'food',
    effect: 'Reduz 20 de Fadiga',
    price: 100,
    description: 'Ração de alta qualidade com ingredientes selecionados.',
  },
  {
    id: 'vital_fruit',
    name: 'Fruta Vital',
    category: 'food',
    effect: 'Reduz 15 de Stress',
    price: 80,
    description: 'Fruta refrescante que acalma as Bestas.',
  },
  {
    id: 'feast',
    name: 'Banquete Especial',
    category: 'food',
    effect: 'Reduz 30 de Fadiga e 20 de Stress',
    price: 200,
    description: 'Uma refeição completa e deliciosa.',
  },

  // ===== ERVAS MEDICINAIS =====
  {
    id: 'serene_herb',
    name: 'Erva Serena',
    category: 'herb',
    effect: 'Cura 20 de Fadiga',
    price: 120,
    description: 'Erva medicinal que alivia o cansaço.',
  },
  {
    id: 'healing_herb',
    name: 'Erva Curativa',
    category: 'herb',
    effect: 'Recupera 30% do HP máximo',
    price: 150,
    description: 'Erva poderosa que cura ferimentos.',
  },
  {
    id: 'energy_herb',
    name: 'Erva Energética',
    category: 'herb',
    effect: 'Recupera 25% da Essência máxima',
    price: 180,
    description: 'Erva que restaura energia mística.',
  },
  {
    id: 'mood_herb',
    name: 'Erva do Ânimo',
    category: 'herb',
    effect: 'Melhora o humor da Besta',
    price: 100,
    description: 'Erva aromática que melhora o humor.',
  },

  // ===== CRISTAIS =====
  {
    id: 'echo_crystal',
    name: 'Cristal de Eco',
    category: 'crystal',
    effect: 'Aumenta 10% de chance de aprender técnicas',
    price: 300,
    description: 'Cristal ressonante que facilita o aprendizado.',
  },
  {
    id: 'essence_crystal',
    name: 'Cristal de Essência',
    category: 'crystal',
    effect: 'Aumenta Essência máxima em 10',
    price: 500,
    description: 'Cristal que expande a capacidade de Essência.',
  },
  {
    id: 'vitality_crystal',
    name: 'Cristal Vital',
    category: 'crystal',
    effect: 'Aumenta HP máximo em 15',
    price: 500,
    description: 'Cristal que fortalece a vitalidade.',
  },

  // ===== ITENS DE TREINO =====
  {
    id: 'training_weights',
    name: 'Pesos de Treino',
    category: 'training',
    effect: '+20% ganho de Força no próximo treino',
    price: 250,
    description: 'Pesos especiais para treino de força.',
  },
  {
    id: 'focus_charm',
    name: 'Talismã de Foco',
    category: 'training',
    effect: '+20% ganho de Foco no próximo treino',
    price: 250,
    description: 'Amuleto que ajuda na concentração.',
  },
  {
    id: 'agility_boots',
    name: 'Botas de Agilidade',
    category: 'training',
    effect: '+20% ganho de Agilidade no próximo treino',
    price: 250,
    description: 'Equipamento leve que melhora movimentos.',
  },
  {
    id: 'wisdom_tome',
    name: 'Tomo da Sabedoria',
    category: 'training',
    effect: '+20% ganho de Astúcia no próximo treino',
    price: 250,
    description: 'Livro antigo com conhecimentos místicos.',
  },

  // ===== RELÍQUIAS =====
  {
    id: 'common_relic',
    name: 'Relíquia Comum',
    category: 'relic',
    effect: 'Pode gerar uma Besta Comum',
    price: 1000,
    description: 'Relíquia básica encontrada em ruínas antigas.',
  },
  {
    id: 'ancient_relic',
    name: 'Relíquia Antiga',
    category: 'relic',
    effect: 'Pode gerar uma Besta com atributos especiais',
    price: 3000,
    description: 'Relíquia rara com poder latente.',
  },
];

// ===== ITENS RAROS (Loja Dinâmica) =====
export const RARE_ITEMS: Item[] = [
  // Alimentos Raros
  {
    id: 'elixir_vitality',
    name: 'Elixir Vital',
    category: 'food',
    effect: 'Restaura 100% HP e 50% Essência',
    price: 500,
    description: 'Poção mágica que revitaliza completamente uma Besta.',
  },
  {
    id: 'ambrosía',
    name: 'Ambrósia',
    category: 'food',
    effect: 'Remove Fadiga e Stress completamente',
    price: 600,
    description: 'Alimento dos deuses, extremamente raro.',
  },

  // Cristais Raros
  {
    id: 'echo_crystal_supreme',
    name: 'Cristal de Eco Supremo',
    category: 'crystal',
    effect: 'Aprende instantaneamente 1 técnica aleatória',
    price: 800,
    description: 'Cristal poderoso que concede conhecimento instantâneo.',
  },
  {
    id: 'legendary_crystal',
    name: 'Cristal Lendário',
    category: 'crystal',
    effect: 'Aumenta TODOS os atributos em +5',
    price: 1500,
    description: 'Cristal extremamente raro com poder imenso.',
  },
  {
    id: 'rejuvenation_crystal',
    name: 'Cristal da Juventude',
    category: 'crystal',
    effect: 'Reduz idade da Besta em 20 semanas',
    price: 2000,
    description: 'Cristal místico que reverte o envelhecimento.',
  },

  // Itens de Treino Raros
  {
    id: 'master_training_manual',
    name: 'Manual do Mestre',
    category: 'training',
    effect: '+50% ganho em TODOS os treinos por 3 semanas',
    price: 1000,
    description: 'Livro sagrado com técnicas avançadas de treinamento.',
  },
  {
    id: 'elemental_stone',
    name: 'Pedra Elemental',
    category: 'training',
    effect: 'Aumenta poder das técnicas por 5 batalhas',
    price: 700,
    description: 'Pedra que amplifica o poder elemental da Besta.',
  },

  // Relíquias Raras
  {
    id: 'obscure_relic',
    name: 'Relíquia Obscura',
    category: 'relic',
    effect: 'Gera Besta com traço especial garantido',
    price: 5000,
    description: 'Relíquia misteriosa envolta em névoa sombria.',
  },
  {
    id: 'legendary_relic',
    name: 'Relíquia Lendária',
    category: 'relic',
    effect: 'Gera Besta com stats máximos',
    price: 10000,
    description: 'A relíquia mais poderosa já descoberta.',
  },
];

/**
 * Retorna itens da loja por categoria
 */
export function getItemsByCategory(category: Item['category']): Item[] {
  return SHOP_ITEMS.filter(item => item.category === category);
}

/**
 * Retorna um item por ID (busca em SHOP_ITEMS e RARE_ITEMS)
 */
export function getItemById(id: string): Item | undefined {
  return [...SHOP_ITEMS, ...RARE_ITEMS].find(item => item.id === id);
}

/**
 * Retorna itens que o jogador pode comprar com o dinheiro disponível
 */
export function getAffordableItems(coronas: number): Item[] {
  return SHOP_ITEMS.filter(item => item.price <= coronas);
}

/**
 * Categorias de itens com ícones
 */
export const ITEM_CATEGORIES = [
  { id: 'food', name: 'Alimentos', icon: '🍖' },
  { id: 'herb', name: 'Ervas', icon: '🌿' },
  { id: 'crystal', name: 'Cristais', icon: '💎' },
  { id: 'training', name: 'Treino', icon: '⚔️' },
  { id: 'relic', name: 'Relíquias', icon: '✨' },
] as const;

/**
 * Sistema de Loja Dinâmica
 * Gera itens raros aleatórios semanalmente
 */
export function getWeeklyRareItems(week: number): Item[] {
  const seed = week; // Usa a semana como seed para determinismo
  const rng = new SeededRandom(seed);
  
  // Seleciona 2-4 itens raros aleatoriamente
  const count = rng.nextInt(2, 5);
  const available = [...RARE_ITEMS];
  const selected: Item[] = [];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = rng.nextInt(0, available.length);
    selected.push(available[index]);
    available.splice(index, 1);
  }
  
  return selected;
}

/**
 * RNG simples baseado em seed
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

