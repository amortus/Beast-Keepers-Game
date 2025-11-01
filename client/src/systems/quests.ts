/**
 * Sistema de Quests/Missões
 * Missões que dão recompensas
 */

import type { GameEvent } from './game-events';
import type { GameState } from '../types';

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'battle' | 'training' | 'collection' | 'social';
  goal: QuestGoal;
  rewards: QuestRewards;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
}

export interface QuestGoal {
  type: 'win_battles' | 'train' | 'rest' | 'work' | 'collect_item' | 'talk_to_npc' | 'reach_level' | 'spend_money' | 
        'exploration_completed' | 'money_accumulated' | 'craft' | 'win_streak' | 'materials_collected' | 'money_from_work' | 'unique_items';
  target: number | string;
  current: number;
}

export interface QuestRewards {
  coronas?: number;
  items?: Array<{ itemId: string; quantity: number }>;
  experience?: number;
  unlockFeature?: string;
}

/**
 * Quests Disponíveis
 */
export const AVAILABLE_QUESTS: Quest[] = [
  // Quests Iniciantes
  {
    id: 'first_victory',
    name: 'Primeira Vitória',
    description: 'Ganhe sua primeira batalha em um torneio',
    type: 'battle',
    goal: { type: 'win_battles', target: 1, current: 0 },
    rewards: {
      coronas: 200,
      items: [{ itemId: 'premium_food', quantity: 2 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'first_training',
    name: 'Treinamento Básico',
    description: 'Treine sua besta 3 vezes',
    type: 'training',
    goal: { type: 'train', target: 3, current: 0 },
    rewards: {
      coronas: 150,
      items: [{ itemId: 'training_weights', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'rest_master',
    name: 'Mestre do Descanso',
    description: 'Descanse 5 vezes para cuidar bem da sua besta',
    type: 'training',
    goal: { type: 'rest', target: 5, current: 0 },
    rewards: {
      coronas: 100,
      items: [{ itemId: 'serene_herb', quantity: 3 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },

  // Quests Intermediárias
  {
    id: 'silver_champion',
    name: 'Campeão de Prata',
    description: 'Ganhe 5 batalhas em torneios',
    type: 'battle',
    goal: { type: 'win_battles', target: 5, current: 0 },
    rewards: {
      coronas: 500,
      items: [
        { itemId: 'echo_crystal', quantity: 1 },
        { itemId: 'healing_herb', quantity: 2 },
      ],
    },
    isCompleted: false,
    isActive: false, // Desbloqueia depois da primeira vitória
    progress: 0,
  },
  {
    id: 'social_butterfly',
    name: 'Borboleta Social',
    description: 'Fale com todos os NPCs da vila',
    type: 'social',
    goal: { type: 'talk_to_npc', target: 4, current: 0 },
    rewards: {
      coronas: 300,
      items: [{ itemId: 'vital_fruit', quantity: 5 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'big_spender',
    name: 'Grande Gastador',
    description: 'Gaste 1000 Coronas na loja',
    type: 'collection',
    goal: { type: 'spend_money', target: 1000, current: 0 },
    rewards: {
      coronas: 500,
      items: [{ itemId: 'elixir_vitality', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },

  // Quests Avançadas
  {
    id: 'gold_legend',
    name: 'Lenda Dourada',
    description: 'Ganhe 10 batalhas em torneios',
    type: 'battle',
    goal: { type: 'win_battles', target: 10, current: 0 },
    rewards: {
      coronas: 1500,
      items: [
        { itemId: 'legendary_crystal', quantity: 1 },
        { itemId: 'ancient_relic', quantity: 1 },
      ],
    },
    isCompleted: false,
    isActive: false, // Desbloqueia depois de Silver Champion
    progress: 0,
  },
  {
    id: 'master_trainer',
    name: 'Mestre Treinador',
    description: 'Treine sua besta 20 vezes',
    type: 'training',
    goal: { type: 'train', target: 20, current: 0 },
    rewards: {
      coronas: 1000,
      items: [{ itemId: 'master_training_manual', quantity: 1 }],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'relic_collector',
    name: 'Colecionador de Relíquias',
    description: 'Possua 5 relíquias diferentes',
    type: 'collection',
    goal: { type: 'collect_item', target: 5, current: 0 },
    rewards: {
      coronas: 2000,
      items: [{ itemId: 'legendary_relic', quantity: 1 }],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // ===== NOVAS MISSÕES VARIADAS =====
  
  {
    id: 'explorer_rookie',
    name: 'Explorador Novato',
    description: 'Complete 5 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 5, current: 0 },
    rewards: {
      coronas: 400,
      items: [{ itemId: 'explorer_compass', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'explorer_veteran',
    name: 'Explorador Veterano',
    description: 'Complete 25 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 25, current: 0 },
    rewards: {
      coronas: 1500,
      items: [
        { itemId: 'legendary_map', quantity: 1 },
        { itemId: 'ancient_compass', quantity: 1 },
      ],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  {
    id: 'wealth_builder',
    name: 'Construtor de Riquezas',
    description: 'Acumule 5000 Coronas',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 5000, current: 0 },
    rewards: {
      coronas: 1000,
      items: [{ itemId: 'golden_crown', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'hardworker',
    name: 'Trabalhador Dedicado',
    description: 'Complete 10 trabalhos',
    type: 'training',
    goal: { type: 'work', target: 10, current: 0 },
    rewards: {
      coronas: 600,
      items: [{ itemId: 'work_certificate', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'master_crafter_quest',
    name: 'Artesão Habilidoso',
    description: 'Crafte 15 itens diferentes',
    type: 'collection',
    goal: { type: 'craft', target: 15, current: 0 },
    rewards: {
      coronas: 800,
      items: [
        { itemId: 'master_crafting_kit', quantity: 1 },
        { itemId: 'rare_materials_pack', quantity: 3 },
      ],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'relaxation_expert',
    name: 'Especialista em Relaxamento',
    description: 'Descanse 15 vezes',
    type: 'training',
    goal: { type: 'rest', target: 15, current: 0 },
    rewards: {
      coronas: 500,
      items: [
        { itemId: 'meditation_guide', quantity: 1 },
        { itemId: 'serene_herb', quantity: 5 },
      ],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'battle_survivor',
    name: 'Sobrevivente de Batalhas',
    description: 'Ganhe 3 batalhas seguidas sem perder',
    type: 'battle',
    goal: { type: 'win_streak', target: 3, current: 0 },
    rewards: {
      coronas: 700,
      items: [{ itemId: 'victory_banner', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'material_gatherer',
    name: 'Coletor de Materiais',
    description: 'Colete 50 materiais em explorações',
    type: 'collection',
    goal: { type: 'materials_collected', target: 50, current: 0 },
    rewards: {
      coronas: 600,
      items: [
        { itemId: 'gatherers_bag', quantity: 1 },
        { itemId: 'material_magnet', quantity: 1 },
      ],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'big_earner',
    name: 'Grande Faturador',
    description: 'Ganhe 10000 Coronas através de trabalhos',
    type: 'training',
    goal: { type: 'money_from_work', target: 10000, current: 0 },
    rewards: {
      coronas: 2500,
      items: [{ itemId: 'entrepreneurs_medal', quantity: 1 }],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  {
    id: 'equipment_collector',
    name: 'Colecionador de Equipamentos',
    description: 'Possua 20 itens diferentes no inventário',
    type: 'collection',
    goal: { type: 'unique_items', target: 20, current: 0 },
    rewards: {
      coronas: 1200,
      items: [{ itemId: 'collectors_vault', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
];

// REMOVIDO: Sistema antigo de tracking (trackAction, updateQuestProgress, trackSpending)
// Agora tudo funciona via eventos (updateQuests + game-events.ts)
// Isso previne contagem duplicada de progresso

/**
 * Retorna quests completadas e não coletadas
 */
export function getCompletedQuests(quests: Quest[]): Quest[] {
  return quests.filter(q => q.isCompleted);
}

/**
 * Retorna quests ativas
 */
export function getActiveQuests(quests: Quest[]): Quest[] {
  return quests.filter(q => q.isActive && !q.isCompleted);
}

/**
 * Desbloqueia quests baseado em progresso
 */
export function unlockQuests(quests: Quest[]): void {
  const victories = quests.find(q => q.id === 'first_victory' && q.isCompleted);
  if (victories) {
    const silverQuest = quests.find(q => q.id === 'silver_champion');
    if (silverQuest && !silverQuest.isActive) {
      silverQuest.isActive = true;
      silverQuest.goal.current = 0;
      silverQuest.progress = 0;
      console.log('[Quest] Desbloqueada: Campeão de Prata');
    }
  }

  const silverChampion = quests.find(q => q.id === 'silver_champion' && q.isCompleted);
  if (silverChampion) {
    const goldQuest = quests.find(q => q.id === 'gold_legend');
    if (goldQuest && !goldQuest.isActive) {
      goldQuest.isActive = true;
      goldQuest.goal.current = 0;
      goldQuest.progress = 0;
      console.log('[Quest] Desbloqueada: Lenda Dourada');
    }
  }

  const firstTraining = quests.find(q => q.id === 'first_training' && q.isCompleted);
  if (firstTraining) {
    const masterQuest = quests.find(q => q.id === 'master_trainer');
    if (masterQuest && !masterQuest.isActive) {
      masterQuest.isActive = true;
      // BUG FIX: Resetar progresso ao desbloquear quest
      // Isso previne que treinos feitos ANTES da quest contem
      masterQuest.goal.current = 0;
      masterQuest.progress = 0;
      console.log('[Quest] Desbloqueada: Mestre Treinador');
    }
  }
  
  // Desbloquear "Explorador Veterano" após completar "Explorador Novato"
  const explorerRookie = quests.find(q => q.id === 'explorer_rookie' && q.isCompleted);
  if (explorerRookie) {
    const veteranQuest = quests.find(q => q.id === 'explorer_veteran');
    if (veteranQuest && !veteranQuest.isActive) {
      veteranQuest.isActive = true;
      veteranQuest.goal.current = 0;
      veteranQuest.progress = 0;
      console.log('[Quest] Desbloqueada: Explorador Veterano');
    }
  }
  
  // Desbloquear "Grande Faturador" após completar "Trabalhador Dedicado"
  const hardworker = quests.find(q => q.id === 'hardworker' && q.isCompleted);
  if (hardworker) {
    const bigEarner = quests.find(q => q.id === 'big_earner');
    if (bigEarner && !bigEarner.isActive) {
      bigEarner.isActive = true;
      bigEarner.goal.current = 0;
      bigEarner.progress = 0;
      console.log('[Quest] Desbloqueada: Grande Faturador');
    }
  }
}

// ===== NOVO SISTEMA DE EVENTOS =====

/**
 * Atualiza quests baseado em eventos do jogo
 */
export function updateQuests(event: GameEvent, gameState: GameState): void {
  if (!gameState.quests) return;
  
  for (const quest of gameState.quests) {
    // CRÍTICO: Ignorar quests completadas ou inativas
    // BUG FIX: Antes contava progresso mesmo com isActive: false
    if (quest.isCompleted || !quest.isActive) continue;
    
    let progressIncrement = 0;
    
    // Match event type com quest goal type
    switch (event.type) {
      case 'battle_won':
        if (quest.goal.type === 'win_battles') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_trained':
        if (quest.goal.type === 'train') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_rested':
        if (quest.goal.type === 'rest') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_worked':
        if (quest.goal.type === 'work') {
          progressIncrement = 1;
        }
        // Também rastrear dinheiro ganho de trabalho
        if (quest.goal.type === 'money_from_work') {
          progressIncrement = event.coronasEarned;
        }
        break;
        
      case 'exploration_completed':
        if (quest.goal.type === 'exploration_completed') {
          progressIncrement = 1;
        }
        if (quest.goal.type === 'materials_collected') {
          // Materiais coletados durante a exploração
          progressIncrement = event.distance / 100; // Estimativa
        }
        break;
        
      case 'item_crafted':
        if (quest.goal.type === 'craft') {
          progressIncrement = 1;
        }
        break;
        
      case 'money_earned':
        if (quest.goal.type === 'money_accumulated') {
          // Verificar dinheiro total atual
          const currentMoney = gameState.coronas || 0;
          quest.goal.current = currentMoney;
          progressIncrement = 0; // Já setamos current
        }
        break;
        
      case 'win_streak':
        if (quest.goal.type === 'win_streak') {
          quest.goal.current = event.currentStreak;
          progressIncrement = 0; // Já setamos current
        }
        break;
        
      case 'item_collected':
        if (quest.goal.type === 'collect_item') {
          // Verificar se é o item específico da quest
          if (quest.goal.target === event.itemId) {
            progressIncrement = event.quantity;
          }
        }
        // Rastrear materiais coletados
        if (quest.goal.type === 'materials_collected' && event.source === 'exploration') {
          progressIncrement = event.quantity;
        }
        // Rastrear itens únicos no inventário
        if (quest.goal.type === 'unique_items') {
          const uniqueItems = new Set(gameState.inventory.map(i => i.id)).size;
          quest.goal.current = uniqueItems;
          progressIncrement = 0; // Já setamos current
        }
        break;
        
      case 'npc_talked':
        if (quest.goal.type === 'talk_to_npc') {
          progressIncrement = 1;
        }
        break;
        
      case 'money_spent':
        if (quest.goal.type === 'spend_money') {
          progressIncrement = event.amount;
        }
        break;
        
      case 'level_up':
        if (quest.goal.type === 'reach_level') {
          if (typeof quest.goal.target === 'number' && event.newLevel >= quest.goal.target) {
            quest.goal.current = event.newLevel;
            progressIncrement = 0; // Já setamos current
          }
        }
        break;
    }
    
    // Incrementar progresso
    if (progressIncrement > 0) {
      quest.goal.current += progressIncrement;
      quest.progress = Math.min((quest.goal.current / (quest.goal.target as number)) * 100, 100);
      
      console.log(`[Quest] ${quest.name}: ${quest.goal.current}/${quest.goal.target}`);
    }
    
    // Verificar se completou
    if (typeof quest.goal.target === 'number' && quest.goal.current >= quest.goal.target) {
      completeQuest(quest, gameState);
    }
  }
  
  // Desbloquear quests encadeadas
  unlockQuests(gameState.quests);
}

/**
 * Completa uma quest e aplica recompensas
 */
function completeQuest(quest: Quest, gameState: GameState): void {
  if (quest.isCompleted) return;
  
  quest.isCompleted = true;
  quest.progress = 100;
  
  console.log(`[Quest] ✅ COMPLETED: ${quest.name}`);
  
  // Aplicar recompensas
  if (quest.rewards.coronas) {
    gameState.coronas += quest.rewards.coronas;
    console.log(`[Quest] Reward: +${quest.rewards.coronas} coronas`);
  }
  
  if (quest.rewards.experience && gameState.activeBeast) {
    gameState.activeBeast.experience = (gameState.activeBeast.experience || 0) + quest.rewards.experience;
    console.log(`[Quest] Reward: +${quest.rewards.experience} XP`);
  }
  
  if (quest.rewards.items) {
    for (const itemReward of quest.rewards.items) {
      const existing = gameState.inventory.find(i => i.id === itemReward.itemId);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + itemReward.quantity;
      } else {
        // Criar item no inventário
        gameState.inventory.push({
          id: itemReward.itemId,
          name: itemReward.itemId,
          category: 'special',
          effect: 'Quest reward',
          price: 0,
          description: 'Recompensa de quest',
          quantity: itemReward.quantity,
        });
      }
      console.log(`[Quest] Reward: +${itemReward.quantity}x ${itemReward.itemId}`);
    }
  }
}

