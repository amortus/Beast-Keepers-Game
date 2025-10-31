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
  type: 'win_battles' | 'train' | 'rest' | 'collect_item' | 'talk_to_npc' | 'reach_level' | 'spend_money';
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
];

/**
 * Atualiza o progresso de uma quest
 */
export function updateQuestProgress(quests: Quest[], questId: string, increment: number = 1): void {
  const quest = quests.find(q => q.id === questId);
  if (!quest || !quest.isActive || quest.isCompleted) return;

  quest.goal.current = Math.min(quest.goal.current + increment, quest.goal.target as number);
  quest.progress = quest.goal.current / (quest.goal.target as number);

  if (quest.goal.current >= (quest.goal.target as number)) {
    quest.isCompleted = true;
  }
}

/**
 * Atualiza progresso baseado em tipo de ação
 */
export function trackAction(quests: Quest[], actionType: string): void {
  switch (actionType) {
    case 'win_battle':
      quests.filter(q => q.goal.type === 'win_battles').forEach(q => {
        updateQuestProgress(quests, q.id, 1);
      });
      break;
    case 'train':
      quests.filter(q => q.goal.type === 'train').forEach(q => {
        updateQuestProgress(quests, q.id, 1);
      });
      break;
    case 'rest':
      quests.filter(q => q.goal.type === 'rest').forEach(q => {
        updateQuestProgress(quests, q.id, 1);
      });
      break;
    case 'talk_npc':
      quests.filter(q => q.goal.type === 'talk_to_npc').forEach(q => {
        updateQuestProgress(quests, q.id, 1);
      });
      break;
  }
}

/**
 * Atualiza progresso de gastos
 */
export function trackSpending(quests: Quest[], amount: number): void {
  quests.filter(q => q.goal.type === 'spend_money' && q.isActive && !q.isCompleted).forEach(q => {
    updateQuestProgress(quests, q.id, amount);
  });
}

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
    if (silverQuest) silverQuest.isActive = true;
  }

  const silverChampion = quests.find(q => q.id === 'silver_champion' && q.isCompleted);
  if (silverChampion) {
    const goldQuest = quests.find(q => q.id === 'gold_legend');
    if (goldQuest) goldQuest.isActive = true;
  }

  const firstTraining = quests.find(q => q.id === 'first_training' && q.isCompleted);
  if (firstTraining) {
    const masterQuest = quests.find(q => q.id === 'master_trainer');
    if (masterQuest) masterQuest.isActive = true;
  }
}

// ===== NOVO SISTEMA DE EVENTOS =====

/**
 * Atualiza quests baseado em eventos do jogo
 */
export function updateQuests(event: GameEvent, gameState: GameState): void {
  if (!gameState.quests) return;
  
  for (const quest of gameState.quests) {
    // Ignorar quests completadas ou inativas
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
        
      case 'item_collected':
        if (quest.goal.type === 'collect_item') {
          // Verificar se é o item específico da quest
          if (quest.goal.target === event.itemId) {
            progressIncrement = event.quantity;
          }
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

