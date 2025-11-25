/**
 * Sistema de Level Up - Beast Keepers
 * Inspirado em Pokémon com tabelas de experiência e aprendizado de técnicas por nível
 */

import type { Beast, BeastLine, Technique } from '../types';
import { getBeastLineData } from '../data/beasts';
import { TECHNIQUES, getLineTechniques } from '../data/techniques';
import { recalculateDerivedStats } from './beast';
import { addLifeEvent } from './beast';

/**
 * Tipos de curva de experiência (como Pokémon)
 */
export type ExperienceGroup = 'fast' | 'medium_fast' | 'medium_slow' | 'slow';

/**
 * Tabelas de experiência por grupo (baseado em Pokémon)
 * Retorna a experiência necessária para alcançar um nível específico
 */
export function getExperienceForLevel(level: number, group: ExperienceGroup): number {
  if (level <= 1) return 0;
  if (level > 100) level = 100; // Cap em nível 100

  switch (group) {
    case 'fast':
      // Fórmula: n³ * 0.8 (arredondado)
      return Math.floor(Math.pow(level, 3) * 0.8);
    
    case 'medium_fast':
      // Fórmula: n³ (padrão)
      return Math.floor(Math.pow(level, 3));
    
    case 'medium_slow':
      // Fórmula: (6/5 * n³) - (15 * n²) + (100 * n) - 140
      return Math.floor((6/5 * Math.pow(level, 3)) - (15 * Math.pow(level, 2)) + (100 * level) - 140);
    
    case 'slow':
      // Fórmula: n³ * 1.25 (arredondado)
      return Math.floor(Math.pow(level, 3) * 1.25);
    
    default:
      return Math.floor(Math.pow(level, 3)); // Fallback para medium_fast
  }
}

/**
 * Mapeia cada linha de beast para seu grupo de experiência
 * Baseado nas características da linha
 */
export function getExperienceGroup(line: BeastLine): ExperienceGroup {
  const groupMap: Record<BeastLine, ExperienceGroup> = {
    // Fast: Beasts mágicas/especialistas (níveis rápidos)
    olgrim: 'fast',      // Mágico especialista
    sylphid: 'fast',     // Mágico especialista
    
    // Medium Fast: Beasts equilibradas
    feralis: 'medium_fast',  // Equilibrado
    mirella: 'medium_fast',  // Equilibrado
    raukor: 'medium_fast',   // Equilibrado
    
    // Medium Slow: Beasts físicas/tanques
    terravox: 'medium_slow', // Tanque
    brontis: 'medium_slow',  // Tanque físico
    ignar: 'medium_slow',    // Físico agressivo
    
    // Slow: Beasts sombrias/complexas
    umbrix: 'slow',      // Sombrio/complexo
    zephyra: 'slow',     // Velocista especializado
  };

  return groupMap[line] || 'medium_fast';
}

/**
 * Retorna a experiência necessária para o próximo nível
 */
export function getExperienceToNextLevel(beast: Beast): number {
  const currentLevel = beast.level || 1;
  const nextLevel = currentLevel + 1;
  const group = getExperienceGroup(beast.line);
  
  const expForNext = getExperienceForLevel(nextLevel, group);
  const expForCurrent = getExperienceForLevel(currentLevel, group);
  
  return expForNext - expForCurrent;
}

/**
 * Retorna a experiência atual até o próximo nível
 */
export function getCurrentExperienceProgress(beast: Beast): number {
  const currentLevel = beast.level || 1;
  const group = getExperienceGroup(beast.line);
  
  const expForCurrent = getExperienceForLevel(currentLevel, group);
  return (beast.experience || 0) - expForCurrent;
}

/**
 * Calcula o nível baseado na experiência total
 */
export function calculateLevelFromExperience(experience: number, line: BeastLine): number {
  const group = getExperienceGroup(line);
  let level = 1;
  
  // Encontrar o nível máximo que a experiência permite
  for (let l = 1; l <= 100; l++) {
    const expRequired = getExperienceForLevel(l, group);
    if (experience >= expRequired) {
      level = l;
    } else {
      break;
    }
  }
  
  return level;
}

/**
 * Tabela de aprendizado de técnicas por nível (como Pokémon)
 * Cada linha tem suas técnicas aprendidas em níveis específicos
 */
export function getTechniqueLearnset(line: BeastLine): Array<{ level: number; techniqueId: string }> {
  const learnsets: Record<BeastLine, Array<{ level: number; techniqueId: string }>> = {
    olgrim: [
      { level: 1, techniqueId: 'ethereal_ray' },
      { level: 8, techniqueId: 'paralyzing_gaze' },
      { level: 15, techniqueId: 'mental_explosion' },
      { level: 25, techniqueId: 'fragment_rain' },
    ],
    terravox: [
      { level: 1, techniqueId: 'seismic_punch' },
      { level: 7, techniqueId: 'living_wall' },
      { level: 14, techniqueId: 'crystal_crush' },
      { level: 22, techniqueId: 'mountain_echo' },
    ],
    feralis: [
      { level: 1, techniqueId: 'twin_claws' },
      { level: 6, techniqueId: 'cutting_leap' },
      { level: 12, techniqueId: 'predator_instinct' },
      { level: 20, techniqueId: 'savage_cry' },
    ],
    brontis: [
      { level: 1, techniqueId: 'brutal_headbutt' },
      { level: 9, techniqueId: 'tail_destroyer' },
      { level: 16, techniqueId: 'gastric_flame' },
      { level: 24, techniqueId: 'earth_tremor' },
    ],
    zephyra: [
      { level: 1, techniqueId: 'cutting_wing' },
      { level: 5, techniqueId: 'ascending_gust' },
      { level: 11, techniqueId: 'low_flight' },
      { level: 18, techniqueId: 'celestial_storm' },
    ],
    ignar: [
      { level: 1, techniqueId: 'fire_whip' },
      { level: 10, techniqueId: 'igneous_explosion' },
      { level: 17, techniqueId: 'volcanic_roar' },
      { level: 23, techniqueId: 'flaming_collision' },
    ],
    mirella: [
      { level: 1, techniqueId: 'water_jet' },
      { level: 8, techniqueId: 'reflective_scale' },
      { level: 15, techniqueId: 'aquatic_tail_strike' },
      { level: 21, techniqueId: 'deluge' },
    ],
    umbrix: [
      { level: 1, techniqueId: 'shadow_bite' },
      { level: 9, techniqueId: 'stalking_shadow' },
      { level: 16, techniqueId: 'black_mist' },
      { level: 22, techniqueId: 'soul_devourer' },
    ],
    sylphid: [
      { level: 1, techniqueId: 'light_ray' },
      { level: 7, techniqueId: 'luminous_barrier' },
      { level: 13, techniqueId: 'radiant_blade' },
      { level: 19, techniqueId: 'purification' },
    ],
    raukor: [
      { level: 1, techniqueId: 'lupine_charge' },
      { level: 8, techniqueId: 'lunar_fangs' },
      { level: 15, techniqueId: 'moon_howl' },
      { level: 21, techniqueId: 'relentless_hunt' },
    ],
  };

  return learnsets[line] || [];
}

/**
 * Retorna técnicas que devem ser aprendidas ao alcançar um nível específico
 */
export function getTechniquesForLevel(line: BeastLine, level: number): Technique[] {
  const learnset = getTechniqueLearnset(line);
  const techniquesToLearn: Technique[] = [];

  for (const entry of learnset) {
    if (entry.level === level) {
      const technique = TECHNIQUES[entry.techniqueId];
      if (technique) {
        techniquesToLearn.push(technique);
      }
    }
  }

  return techniquesToLearn;
}

/**
 * Retorna todas as técnicas que a beast deveria ter aprendido até o nível atual
 */
export function getLearnedTechniquesForLevel(line: BeastLine, level: number): Technique[] {
  const learnset = getTechniqueLearnset(line);
  const learnedTechniques: Technique[] = [];

  for (const entry of learnset) {
    if (entry.level <= level) {
      const technique = TECHNIQUES[entry.techniqueId];
      if (technique) {
        learnedTechniques.push(technique);
      }
    }
  }

  return learnedTechniques;
}

/**
 * Adiciona uma técnica à beast se ela ainda não a possui
 * Retorna um objeto indicando se precisa de substituição
 */
function addTechniqueIfNotExists(beast: Beast, technique: Technique): {
  added: boolean;
  needsReplacement: boolean;
} {
  const hasTechnique = beast.techniques.some(t => t.id === technique.id);
  if (hasTechnique) {
    return { added: false, needsReplacement: false };
  }
  
  // Se já tem 4 técnicas, precisa substituir
  if (beast.techniques.length >= 4) {
    return { added: false, needsReplacement: true };
  }
  
  // Adiciona normalmente
  beast.techniques.push(technique);
  return { added: true, needsReplacement: false };
}

/**
 * Substitui uma técnica antiga por uma nova
 */
export function replaceTechnique(beast: Beast, oldTechniqueId: string, newTechnique: Technique): boolean {
  const index = beast.techniques.findIndex(t => t.id === oldTechniqueId);
  if (index === -1) {
    return false;
  }
  
  // Verifica se já tem a nova técnica
  if (beast.techniques.some(t => t.id === newTechnique.id)) {
    return false;
  }
  
  beast.techniques[index] = newTechnique;
  return true;
}

/**
 * Calcula crescimento de atributos por nível
 * Baseado na curva de crescimento da linha
 */
function calculateAttributeGrowth(beast: Beast, attribute: keyof typeof beast.attributes): number {
  const lineData = getBeastLineData(beast.line);
  const growthRate = lineData.growthCurve[attribute];
  const level = beast.level || 1;
  
  // Multiplicadores base por tipo de crescimento
  const baseMultipliers: Record<string, number> = {
    none: 0,
    slow: 0.5,
    medium: 1.0,
    fast: 1.5,
    veryfast: 2.0,
  };

  const multiplier = baseMultipliers[growthRate] || 1.0;
  
  // Crescimento base: 1-3 pontos por nível, ajustado pela curva
  const baseGrowth = Math.floor(multiplier * (1 + Math.random() * 2));
  
  // Redução gradual em níveis altos (após nível 50)
  if (level > 50) {
    const reduction = Math.floor((level - 50) / 10) * 0.1;
    return Math.max(1, Math.floor(baseGrowth * (1 - reduction)));
  }
  
  return Math.max(1, baseGrowth);
}

/**
 * Aplica crescimento de atributos ao subir de nível
 */
function applyLevelUpAttributeGrowth(beast: Beast): {
  attributeGains: Record<string, number>;
  totalGains: number;
} {
  const attributeGains: Record<string, number> = {};
  let totalGains = 0;

  // Crescer todos os atributos baseado na curva
  const attributes: Array<keyof typeof beast.attributes> = [
    'might', 'wit', 'focus', 'agility', 'ward', 'vitality'
  ];

  for (const attr of attributes) {
    const growth = calculateAttributeGrowth(beast, attr);
    beast.attributes[attr] += growth;
    attributeGains[attr] = growth;
    totalGains += growth;
  }

  return { attributeGains, totalGains };
}

/**
 * Sistema principal de level up
 * Verifica se a beast deve subir de nível e aplica todas as mudanças
 */
export function processLevelUp(beast: Beast, currentWeek?: number): {
  leveledUp: boolean;
  newLevel?: number;
  techniquesLearned?: Technique[];
  techniquesNeedingReplacement?: Array<{ technique: Technique; level: number }>;
  attributeGains?: Record<string, number>;
  message?: string;
} {
  const currentLevel = beast.level || 1;
  const currentExp = beast.experience || 0;
  
  // Calcular nível baseado na experiência
  const calculatedLevel = calculateLevelFromExperience(currentExp, beast.line);
  
  // Se não subiu de nível, retornar
  if (calculatedLevel <= currentLevel) {
    return { leveledUp: false };
  }

  const newLevel = calculatedLevel;
  const techniquesLearned: Technique[] = [];
  const allAttributeGains: Record<string, number> = {};

  // Técnicas que precisam de substituição (será retornado para UI)
  const techniquesNeedingReplacement: Array<{ technique: Technique; level: number }> = [];

  // Processar cada nível ganho (caso tenha pulado múltiplos níveis)
  for (let level = currentLevel + 1; level <= newLevel; level++) {
    // Aprender técnicas deste nível
    const newTechniques = getTechniquesForLevel(beast.line, level);
    for (const technique of newTechniques) {
      const result = addTechniqueIfNotExists(beast, technique);
      if (result.added) {
        techniquesLearned.push(technique);
      } else if (result.needsReplacement) {
        // Marcar para substituição (não adiciona ainda)
        techniquesNeedingReplacement.push({ technique, level });
      }
    }

    // Aplicar crescimento de atributos
    const { attributeGains } = applyLevelUpAttributeGrowth(beast);
    for (const [attr, gain] of Object.entries(attributeGains)) {
      allAttributeGains[attr] = (allAttributeGains[attr] || 0) + gain;
    }
  }

  // Atualizar nível
  beast.level = newLevel;

  // Recalcular stats derivados (HP, Essência)
  recalculateDerivedStats(beast);

  // Adicionar evento de vida
  if (currentWeek !== undefined) {
    const techniqueNames = techniquesLearned.map(t => t.name).join(', ');
    addLifeEvent(
      beast,
      currentWeek,
      'special',
      `${beast.name} subiu para o nível ${newLevel}!${techniquesLearned.length > 0 ? ` Aprendeu: ${techniqueNames}` : ''}`
    );
  }

  // Construir mensagem
  let message = `🎉 ${beast.name} subiu para o nível ${newLevel}!`;
  
  if (techniquesLearned.length > 0) {
    message += `\n\n✨ Técnicas aprendidas:`;
    techniquesLearned.forEach(tech => {
      message += `\n  • ${tech.name}`;
    });
  }

  if (Object.keys(allAttributeGains).length > 0) {
    message += `\n\n📈 Atributos aumentaram:`;
    const attrNames: Record<string, string> = {
      might: 'Força',
      wit: 'Astúcia',
      focus: 'Foco',
      agility: 'Agilidade',
      ward: 'Resistência',
      vitality: 'Vitalidade',
    };
    for (const [attr, gain] of Object.entries(allAttributeGains)) {
      message += `\n  • ${attrNames[attr] || attr}: +${gain}`;
    }
  }

  return {
    leveledUp: true,
    newLevel,
    techniquesLearned,
    techniquesNeedingReplacement: techniquesNeedingReplacement.length > 0 ? techniquesNeedingReplacement : undefined,
    attributeGains: allAttributeGains,
    message,
  };
}

/**
 * Adiciona experiência à beast e processa level up se necessário
 */
export function addExperience(
  beast: Beast,
  amount: number,
  currentWeek?: number
): {
  leveledUp: boolean;
  newLevel?: number;
  techniquesLearned?: Technique[];
  techniquesNeedingReplacement?: Array<{ technique: Technique; level: number }>;
  attributeGains?: Record<string, number>;
  message?: string;
} {
  const oldLevel = beast.level || 1;
  beast.experience = (beast.experience || 0) + amount;

  // Processar level up
  const levelUpResult = processLevelUp(beast, currentWeek);

  return levelUpResult;
}

/**
 * Garante que a beast tem todas as técnicas que deveria ter aprendido até seu nível atual
 * Útil ao carregar beasts antigas ou após migrações
 */
export function syncTechniquesToLevel(beast: Beast): {
  addedTechniques: Technique[];
} {
  const currentLevel = beast.level || 1;
  const shouldHaveTechniques = getLearnedTechniquesForLevel(beast.line, currentLevel);
  const addedTechniques: Technique[] = [];

  for (const technique of shouldHaveTechniques) {
    if (addTechniqueIfNotExists(beast, technique)) {
      addedTechniques.push(technique);
    }
  }

  return { addedTechniques };
}

/**
 * Calcula experiência ganha ao derrotar um inimigo
 * Baseado no nível do inimigo e diferença de níveis
 */
export function calculateExperienceGain(
  playerLevel: number,
  enemyLevel: number,
  baseExp: number = 50
): number {
  // Experiência base ajustada pelo nível do inimigo
  let exp = baseExp * enemyLevel;

  // Bônus por derrotar inimigo mais forte
  if (enemyLevel > playerLevel) {
    const levelDiff = enemyLevel - playerLevel;
    exp = Math.floor(exp * (1 + levelDiff * 0.1)); // +10% por nível acima
  }

  // Penalidade por derrotar inimigo muito mais fraco
  if (enemyLevel < playerLevel - 5) {
    const levelDiff = playerLevel - enemyLevel - 5;
    exp = Math.floor(exp * Math.max(0.1, 1 - levelDiff * 0.1)); // -10% por nível abaixo
  }

  return Math.max(1, Math.floor(exp));
}

/**
 * Processa ganho de experiência e retorna informações sobre level up
 * Esta função é usada por sistemas que precisam processar XP mas não podem
 * mostrar modais diretamente (como realtime-actions.ts)
 */
export function processExperienceGainSilent(
  beast: Beast,
  amount: number,
  currentWeek?: number
): {
  leveledUp: boolean;
  newLevel?: number;
  techniquesNeedingReplacement?: Array<{ technique: Technique; level: number }>;
  message?: string;
} {
  return addExperience(beast, amount, currentWeek);
}

