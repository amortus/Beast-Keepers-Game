/**
 * Sistema de Craft
 * Combina itens para criar novos
 */

import type { Item } from '../types';

export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{ itemId: string; quantity: number }>;
  result: { itemId: string; quantity: number };
  resultItem?: Item; // Item resultante para preview
}

/**
 * Receitas de Craft Disponíveis
 */
export const CRAFT_RECIPES: CraftRecipe[] = [
  // Alimentos Avançados
  {
    id: 'feast_from_basics',
    name: 'Banquete Especial',
    description: 'Combine alimentos básicos para criar um banquete',
    ingredients: [
      { itemId: 'basic_food', quantity: 2 },
      { itemId: 'vital_fruit', quantity: 1 },
    ],
    result: { itemId: 'feast', quantity: 1 },
  },

  // Cristais Combinados
  {
    id: 'supreme_echo',
    name: 'Cristal de Eco Supremo',
    description: 'Funde 3 Cristais de Eco em um Cristal Supremo',
    ingredients: [
      { itemId: 'echo_crystal', quantity: 3 },
    ],
    result: { itemId: 'echo_crystal_supreme', quantity: 1 },
  },
  {
    id: 'legendary_from_vitals',
    name: 'Cristal Lendário',
    description: 'Combine cristais de Essência e Vitais para criar um Lendário',
    ingredients: [
      { itemId: 'essence_crystal', quantity: 2 },
      { itemId: 'vitality_crystal', quantity: 2 },
    ],
    result: { itemId: 'legendary_crystal', quantity: 1 },
  },

  // Elixires Poderosos
  {
    id: 'elixir_from_herbs',
    name: 'Elixir Vital',
    description: 'Combine ervas medicinais para criar um elixir poderoso',
    ingredients: [
      { itemId: 'healing_herb', quantity: 2 },
      { itemId: 'energy_herb', quantity: 2 },
      { itemId: 'serene_herb', quantity: 1 },
    ],
    result: { itemId: 'elixir_vitality', quantity: 1 },
  },
  {
    id: 'ambrosia_from_feast',
    name: 'Ambrósia',
    description: 'Transforme banquetes e ervas em Ambrósia',
    ingredients: [
      { itemId: 'feast', quantity: 3 },
      { itemId: 'mood_herb', quantity: 2 },
    ],
    result: { itemId: 'ambrosía', quantity: 1 },
  },

  // Relíquias Upgrade
  {
    id: 'ancient_from_common',
    name: 'Relíquia Antiga',
    description: 'Combine 3 Relíquias Comuns para criar uma Antiga',
    ingredients: [
      { itemId: 'common_relic', quantity: 3 },
    ],
    result: { itemId: 'ancient_relic', quantity: 1 },
  },
  {
    id: 'obscure_from_ancient',
    name: 'Relíquia Obscura',
    description: 'Funde 2 Relíquias Antigas em uma Obscura',
    ingredients: [
      { itemId: 'ancient_relic', quantity: 2 },
    ],
    result: { itemId: 'obscure_relic', quantity: 1 },
  },

  // Itens de Treino Especiais
  {
    id: 'master_manual',
    name: 'Manual do Mestre',
    description: 'Combine todos os itens de treino básicos',
    ingredients: [
      { itemId: 'training_weights', quantity: 1 },
      { itemId: 'focus_charm', quantity: 1 },
      { itemId: 'agility_boots', quantity: 1 },
      { itemId: 'wisdom_tome', quantity: 1 },
    ],
    result: { itemId: 'master_training_manual', quantity: 1 },
  },
];

/**
 * Verifica se o jogador tem os ingredientes necessários
 */
export function canCraft(recipe: CraftRecipe, inventory: Item[]): boolean {
  for (const ingredient of recipe.ingredients) {
    const item = inventory.find(i => i.id === ingredient.itemId);
    if (!item || !item.quantity || item.quantity < ingredient.quantity) {
      return false;
    }
  }
  return true;
}

/**
 * Consome os ingredientes e retorna o item craftado
 */
export function executeCraft(recipe: CraftRecipe, inventory: Item[]): { success: boolean; message: string; result?: Item } {
  // Verificar se pode craftar
  if (!canCraft(recipe, inventory)) {
    return {
      success: false,
      message: 'Você não tem os ingredientes necessários!',
    };
  }

  // Consumir ingredientes
  for (const ingredient of recipe.ingredients) {
    const item = inventory.find(i => i.id === ingredient.itemId);
    if (item && item.quantity) {
      item.quantity -= ingredient.quantity;
      
      // Remover do inventário se quantidade chegar a 0
      if (item.quantity <= 0) {
        const index = inventory.indexOf(item);
        inventory.splice(index, 1);
      }
    }
  }

  // Criar item resultante (será adicionado ao inventário externamente)
  return {
    success: true,
    message: `✨ ${recipe.name} craftado com sucesso!`,
    result: {
      id: recipe.result.itemId,
      name: recipe.name,
      category: 'crystal', // Placeholder, será substituído pelo item real
      effect: '',
      price: 0,
      description: '',
      quantity: recipe.result.quantity,
    },
  };
}

/**
 * Retorna receitas que o jogador pode craftar
 */
export function getAvailableRecipes(inventory: Item[]): CraftRecipe[] {
  return CRAFT_RECIPES.filter(recipe => canCraft(recipe, inventory));
}

/**
 * Retorna todas as receitas
 */
export function getAllRecipes(): CraftRecipe[] {
  return CRAFT_RECIPES;
}

