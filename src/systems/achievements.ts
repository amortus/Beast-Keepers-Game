/**
 * Sistema de Conquistas (Achievements)
 * Badges e títulos especiais
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'battle' | 'training' | 'collection' | 'social' | 'special';
  requirement: AchievementRequirement;
  reward: AchievementReward;
  isUnlocked: boolean;
  unlockedAt?: number; // timestamp
  progress: number;
  hidden?: boolean; // Conquista secreta
}

export interface AchievementRequirement {
  type: 'win_battles' | 'train_count' | 'collect_items' | 'spend_money' | 'talk_npcs' | 'craft_items' | 'win_streak' | 'beast_age' | 'tournament_rank' | 'special';
  target: number | string;
  current: number;
}

export interface AchievementReward {
  title?: string; // Título desbloqueável
  coronas?: number;
  items?: Array<{ itemId: string; quantity: number }>;
  badge: string; // Emoji/ícone do badge
}

/**
 * Lista de todas as conquistas
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ===== BATALHA =====
  {
    id: 'first_blood',
    name: 'Primeira Vitória',
    description: 'Ganhe sua primeira batalha',
    icon: '⚔️',
    category: 'battle',
    requirement: { type: 'win_battles', target: 1, current: 0 },
    reward: { coronas: 100, badge: '🥉' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'warrior',
    name: 'Guerreiro',
    description: 'Ganhe 25 batalhas',
    icon: '⚔️',
    category: 'battle',
    requirement: { type: 'win_battles', target: 25, current: 0 },
    reward: { coronas: 500, title: 'Guerreiro', badge: '🥈' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'champion',
    name: 'Campeão',
    description: 'Ganhe 100 batalhas',
    icon: '👑',
    category: 'battle',
    requirement: { type: 'win_battles', target: 100, current: 0 },
    reward: { coronas: 2000, title: 'Campeão Lendário', badge: '🥇' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'unstoppable',
    name: 'Imparável',
    description: 'Ganhe 10 batalhas seguidas',
    icon: '🔥',
    category: 'battle',
    requirement: { type: 'win_streak', target: 10, current: 0 },
    reward: { coronas: 1000, title: 'Imparável', badge: '🔥' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'mythic_master',
    name: 'Mestre Mítico',
    description: 'Vença um torneio Mítico',
    icon: '✨',
    category: 'battle',
    requirement: { type: 'tournament_rank', target: 'mythic', current: 0 },
    reward: { coronas: 5000, title: 'Mestre Mítico', badge: '✨' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== TREINO =====
  {
    id: 'dedicated_trainer',
    name: 'Treinador Dedicado',
    description: 'Treine sua besta 50 vezes',
    icon: '💪',
    category: 'training',
    requirement: { type: 'train_count', target: 50, current: 0 },
    reward: { coronas: 800, title: 'Treinador Dedicado', badge: '💪' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'master_trainer',
    name: 'Mestre dos Treinos',
    description: 'Treine sua besta 200 vezes',
    icon: '🎯',
    category: 'training',
    requirement: { type: 'train_count', target: 200, current: 0 },
    reward: { coronas: 3000, title: 'Mestre dos Treinos', badge: '🎯' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'elder_keeper',
    name: 'Guardião Ancião',
    description: 'Mantenha uma besta viva por mais de 150 semanas',
    icon: '🧙',
    category: 'training',
    requirement: { type: 'beast_age', target: 150, current: 0 },
    reward: { coronas: 5000, title: 'Guardião Ancião', badge: '🧙' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== COLEÇÃO =====
  {
    id: 'collector',
    name: 'Colecionador',
    description: 'Possua 50 itens diferentes',
    icon: '📦',
    category: 'collection',
    requirement: { type: 'collect_items', target: 50, current: 0 },
    reward: { coronas: 1000, badge: '📦' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'hoarder',
    name: 'Acumulador',
    description: 'Possua 100 itens diferentes',
    icon: '💎',
    category: 'collection',
    requirement: { type: 'collect_items', target: 100, current: 0 },
    reward: { coronas: 3000, title: 'Acumulador de Tesouros', badge: '💎' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'big_spender',
    name: 'Gastador',
    description: 'Gaste 10.000 Coronas',
    icon: '💰',
    category: 'collection',
    requirement: { type: 'spend_money', target: 10000, current: 0 },
    reward: { coronas: 2000, title: 'Gastador Mítico', badge: '💰' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'master_crafter',
    name: 'Mestre Artesão',
    description: 'Crafte 30 itens',
    icon: '⚗️',
    category: 'collection',
    requirement: { type: 'craft_items', target: 30, current: 0 },
    reward: { coronas: 2000, title: 'Mestre Artesão', badge: '⚗️' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== SOCIAL =====
  {
    id: 'friendly',
    name: 'Amigável',
    description: 'Converse com todos os NPCs',
    icon: '👥',
    category: 'social',
    requirement: { type: 'talk_npcs', target: 7, current: 0 },
    reward: { coronas: 500, badge: '👥' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'socialite',
    name: 'Socialite',
    description: 'Converse com NPCs 100 vezes',
    icon: '💬',
    category: 'social',
    requirement: { type: 'talk_npcs', target: 100, current: 0 },
    reward: { coronas: 1500, title: 'Socialite da Vila', badge: '💬' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== ESPECIAIS =====
  {
    id: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Desbloqueie todas as outras conquistas',
    icon: '🌟',
    category: 'special',
    requirement: { type: 'special', target: 'all_achievements', current: 0 },
    reward: { coronas: 10000, title: 'Guardião Perfeito', badge: '🌟' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'speed_runner',
    name: 'Velocista',
    description: 'Vença um torneio Ouro em menos de 20 semanas',
    icon: '⚡',
    category: 'special',
    requirement: { type: 'special', target: 'gold_fast', current: 0 },
    reward: { coronas: 3000, title: 'Velocista', badge: '⚡' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'survivor',
    name: 'Sobrevivente',
    description: 'Perca 10 batalhas seguidas e continue jogando',
    icon: '🛡️',
    category: 'special',
    requirement: { type: 'special', target: 'lose_streak', current: 0 },
    reward: { coronas: 1000, title: 'Sobrevivente', badge: '🛡️' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
];

/**
 * Atualiza o progresso de uma conquista
 */
export function updateAchievementProgress(
  achievements: Achievement[],
  achievementId: string,
  increment: number = 1
): boolean {
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement || achievement.isUnlocked) return false;

  achievement.requirement.current = Math.min(
    achievement.requirement.current + increment,
    achievement.requirement.target as number
  );
  achievement.progress = achievement.requirement.current / (achievement.requirement.target as number);

  if (achievement.requirement.current >= (achievement.requirement.target as number)) {
    achievement.isUnlocked = true;
    achievement.unlockedAt = Date.now();
    return true; // Conquista desbloqueada!
  }

  return false;
}

/**
 * Desbloqueia uma conquista instantaneamente
 */
export function unlockAchievement(achievements: Achievement[], achievementId: string): boolean {
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement || achievement.isUnlocked) return false;

  achievement.isUnlocked = true;
  achievement.unlockedAt = Date.now();
  achievement.requirement.current = achievement.requirement.target as number;
  achievement.progress = 1;

  return true;
}

/**
 * Retorna conquistas desbloqueadas
 */
export function getUnlockedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.filter(a => a.isUnlocked);
}

/**
 * Retorna conquistas por categoria
 */
export function getAchievementsByCategory(
  achievements: Achievement[],
  category: Achievement['category']
): Achievement[] {
  return achievements.filter(a => a.category === category);
}

/**
 * Retorna porcentagem de conclusão
 */
export function getCompletionPercentage(achievements: Achievement[]): number {
  const total = achievements.filter(a => !a.hidden).length;
  const unlocked = achievements.filter(a => a.isUnlocked && !a.hidden).length;
  return (unlocked / total) * 100;
}

/**
 * Retorna títulos disponíveis
 */
export function getAvailableTitles(achievements: Achievement[]): string[] {
  return achievements
    .filter(a => a.isUnlocked && a.reward.title)
    .map(a => a.reward.title!);
}

/**
 * Verifica se todas as conquistas foram desbloqueadas
 */
export function checkAllAchievements(achievements: Achievement[]): boolean {
  const nonHidden = achievements.filter(a => !a.hidden);
  return nonHidden.every(a => a.isUnlocked);
}

/**
 * Tracking automático de conquistas baseado em ações
 */
export function trackAchievements(
  achievements: Achievement[],
  action: string,
  value: number = 1
): Achievement[] {
  const unlocked: Achievement[] = [];

  switch (action) {
    case 'win_battle':
      if (updateAchievementProgress(achievements, 'first_blood', value)) {
        unlocked.push(achievements.find(a => a.id === 'first_blood')!);
      }
      if (updateAchievementProgress(achievements, 'warrior', value)) {
        unlocked.push(achievements.find(a => a.id === 'warrior')!);
      }
      if (updateAchievementProgress(achievements, 'champion', value)) {
        unlocked.push(achievements.find(a => a.id === 'champion')!);
      }
      break;

    case 'train':
      if (updateAchievementProgress(achievements, 'dedicated_trainer', value)) {
        unlocked.push(achievements.find(a => a.id === 'dedicated_trainer')!);
      }
      if (updateAchievementProgress(achievements, 'master_trainer', value)) {
        unlocked.push(achievements.find(a => a.id === 'master_trainer')!);
      }
      break;

    case 'craft':
      if (updateAchievementProgress(achievements, 'master_crafter', value)) {
        unlocked.push(achievements.find(a => a.id === 'master_crafter')!);
      }
      break;

    case 'spend':
      if (updateAchievementProgress(achievements, 'big_spender', value)) {
        unlocked.push(achievements.find(a => a.id === 'big_spender')!);
      }
      break;

    case 'talk_npc':
      if (updateAchievementProgress(achievements, 'friendly', value)) {
        unlocked.push(achievements.find(a => a.id === 'friendly')!);
      }
      if (updateAchievementProgress(achievements, 'socialite', value)) {
        unlocked.push(achievements.find(a => a.id === 'socialite')!);
      }
      break;
  }

  // Verifica conquista de perfeccionista
  if (checkAllAchievements(achievements)) {
    if (unlockAchievement(achievements, 'perfectionist')) {
      unlocked.push(achievements.find(a => a.id === 'perfectionist')!);
    }
  }

  return unlocked;
}

