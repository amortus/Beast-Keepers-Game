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
 * Tabelas de experiência por grupo (baseado nas fórmulas exatas do Pokémon)
 * Retorna a experiência necessária para alcançar um nível específico
 * 
 * Fórmulas originais do Pokémon:
 * - Fast: n³ * 0.8 (arredondado)
 * - Medium Fast: n³
 * - Medium Slow: (6/5 * n³) - (15 * n²) + (100 * n) - 140
 * - Slow: n³ * 1.25 (arredondado)
 */
export function getExperienceForLevel(level: number, group: ExperienceGroup): number {
  if (level <= 1) return 0;
  if (level > 100) level = 100; // Cap em nível 100

  switch (group) {
    case 'fast':
      // Fórmula Pokémon Fast: n³ * 0.8 (arredondado)
      return Math.floor(Math.pow(level, 3) * 0.8);
    
    case 'medium_fast':
      // Fórmula Pokémon Medium Fast: n³
      return Math.floor(Math.pow(level, 3));
    
    case 'medium_slow':
      // Fórmula Pokémon Medium Slow: (6/5 * n³) - (15 * n²) + (100 * n) - 140
      return Math.floor((6/5 * Math.pow(level, 3)) - (15 * Math.pow(level, 2)) + (100 * level) - 140);
    
    case 'slow':
      // Fórmula Pokémon Slow: n³ * 1.25 (arredondado)
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
      { level: 5, techniqueId: 'mental_pulse' },
      { level: 8, techniqueId: 'paralyzing_gaze' },
      { level: 12, techniqueId: 'penetrating_vision' },
      { level: 15, techniqueId: 'mental_explosion' },
      { level: 20, techniqueId: 'concentrated_ray' },
      { level: 25, techniqueId: 'fragment_rain' },
      { level: 35, techniqueId: 'omniscient_eye' },
      { level: 45, techniqueId: 'psionic_storm' },
      { level: 55, techniqueId: 'reality_tear' },
      { level: 70, techniqueId: 'cosmic_judgment' },
      { level: 90, techniqueId: 'infinite_gaze' },
    ],
    terravox: [
      { level: 1, techniqueId: 'seismic_punch' },
      { level: 4, techniqueId: 'stone_protection' },
      { level: 7, techniqueId: 'living_wall' },
      { level: 11, techniqueId: 'rock_throw' },
      { level: 14, techniqueId: 'crystal_crush' },
      { level: 18, techniqueId: 'earthquake' },
      { level: 22, techniqueId: 'mountain_echo' },
      { level: 30, techniqueId: 'impenetrable_fortress' },
      { level: 42, techniqueId: 'tectonic_shift' },
      { level: 55, techniqueId: 'mountain_collapse' },
      { level: 70, techniqueId: 'earth_core_strike' },
      { level: 85, techniqueId: 'primordial_guardian' },
    ],
    feralis: [
      { level: 1, techniqueId: 'twin_claws' },
      { level: 3, techniqueId: 'quick_scratch' },
      { level: 6, techniqueId: 'cutting_leap' },
      { level: 9, techniqueId: 'feline_fury' },
      { level: 12, techniqueId: 'predator_instinct' },
      { level: 20, techniqueId: 'savage_cry' },
      { level: 32, techniqueId: 'predatory_rush' },
      { level: 40, techniqueId: 'wild_fury' },
      { level: 50, techniqueId: 'shadow_pounce' },
      { level: 60, techniqueId: 'berserker_rage' },
      { level: 75, techniqueId: 'death_claw_combo' },
      { level: 90, techniqueId: 'apex_predator' },
    ],
    brontis: [
      { level: 1, techniqueId: 'brutal_headbutt' },
      { level: 5, techniqueId: 'ferocious_bite' },
      { level: 9, techniqueId: 'tail_destroyer' },
      { level: 13, techniqueId: 'intimidating_roar' },
      { level: 16, techniqueId: 'gastric_flame' },
      { level: 20, techniqueId: 'colossal_charge' },
      { level: 24, techniqueId: 'earth_tremor' },
      { level: 35, techniqueId: 'prehistoric_fury' },
      { level: 48, techniqueId: 'volcanic_breath' },
      { level: 60, techniqueId: 'meteor_strike' },
      { level: 75, techniqueId: 'extinction_event' },
      { level: 90, techniqueId: 'primordial_roar' },
    ],
    zephyra: [
      { level: 1, techniqueId: 'cutting_wing' },
      { level: 3, techniqueId: 'wind_gust' },
      { level: 5, techniqueId: 'ascending_gust' },
      { level: 8, techniqueId: 'accelerated_flight' },
      { level: 11, techniqueId: 'low_flight' },
      { level: 15, techniqueId: 'tornado' },
      { level: 18, techniqueId: 'celestial_storm' },
      { level: 28, techniqueId: 'devastating_hurricane' },
      { level: 42, techniqueId: 'sky_dive' },
      { level: 55, techniqueId: 'wind_blade_storm' },
      { level: 70, techniqueId: 'stratospheric_dive' },
      { level: 85, techniqueId: 'divine_gale' },
    ],
    ignar: [
      { level: 1, techniqueId: 'fire_whip' },
      { level: 4, techniqueId: 'ember' },
      { level: 10, techniqueId: 'igneous_explosion' },
      { level: 14, techniqueId: 'fire_wall' },
      { level: 17, techniqueId: 'volcanic_roar' },
      { level: 22, techniqueId: 'flaming_meteor' },
      { level: 23, techniqueId: 'flaming_collision' },
      { level: 38, techniqueId: 'total_inferno' },
      { level: 50, techniqueId: 'magma_eruption' },
      { level: 62, techniqueId: 'solar_flare' },
      { level: 75, techniqueId: 'supernova' },
      { level: 90, techniqueId: 'hellfire_apocalypse' },
    ],
    mirella: [
      { level: 1, techniqueId: 'water_jet' },
      { level: 4, techniqueId: 'protective_bubble' },
      { level: 8, techniqueId: 'reflective_scale' },
      { level: 12, techniqueId: 'aquatic_current' },
      { level: 15, techniqueId: 'aquatic_tail_strike' },
      { level: 19, techniqueId: 'healing_mist' },
      { level: 21, techniqueId: 'deluge' },
      { level: 30, techniqueId: 'tsunami' },
      { level: 45, techniqueId: 'tidal_wave' },
      { level: 58, techniqueId: 'abyssal_whirlpool' },
      { level: 72, techniqueId: 'ocean_depth_pressure' },
      { level: 88, techniqueId: 'primordial_flood' },
    ],
    umbrix: [
      { level: 1, techniqueId: 'shadow_bite' },
      { level: 5, techniqueId: 'creeping_shadow' },
      { level: 9, techniqueId: 'stalking_shadow' },
      { level: 13, techniqueId: 'life_drain' },
      { level: 16, techniqueId: 'black_mist' },
      { level: 22, techniqueId: 'soul_devourer' },
      { level: 28, techniqueId: 'shadow_void' },
      { level: 40, techniqueId: 'eternal_eclipse' },
      { level: 52, techniqueId: 'shadow_void_strike' },
      { level: 65, techniqueId: 'soul_rend' },
      { level: 78, techniqueId: 'darkness_consumption' },
      { level: 95, techniqueId: 'absolute_void' },
    ],
    sylphid: [
      { level: 1, techniqueId: 'light_ray' },
      { level: 4, techniqueId: 'blinding_light' },
      { level: 7, techniqueId: 'luminous_barrier' },
      { level: 10, techniqueId: 'healing_light' },
      { level: 13, techniqueId: 'radiant_blade' },
      { level: 17, techniqueId: 'light_explosion' },
      { level: 19, techniqueId: 'purification' },
      { level: 35, techniqueId: 'divine_ascension' },
      { level: 48, techniqueId: 'holy_judgment' },
      { level: 62, techniqueId: 'celestial_beam' },
      { level: 75, techniqueId: 'divine_wrath' },
      { level: 90, techniqueId: 'godly_presence' },
    ],
    raukor: [
      { level: 1, techniqueId: 'lupine_charge' },
      { level: 4, techniqueId: 'quick_bite' },
      { level: 8, techniqueId: 'lunar_fangs' },
      { level: 12, techniqueId: 'intimidating_howl' },
      { level: 15, techniqueId: 'moon_howl' },
      { level: 20, techniqueId: 'relentless_pursuit' },
      { level: 21, techniqueId: 'relentless_hunt' },
      { level: 32, techniqueId: 'lunar_fury' },
      { level: 45, techniqueId: 'pack_hunt' },
      { level: 58, techniqueId: 'alpha_howl' },
      { level: 72, techniqueId: 'moonlit_savagery' },
      { level: 88, techniqueId: 'primal_alpha' },
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
 * Retorna o Base Experience Yield de uma beast baseado no grupo de experiência
 * Baseado no sistema do Pokémon onde cada grupo tem um baseExp típico
 */
function getBaseExperienceYield(line: BeastLine): number {
  const group = getExperienceGroup(line);
  
  // BaseExp típico por grupo (baseado em Pokémon)
  // Fast: geralmente 50-80 (ex: Abra, Gastly)
  // Medium Fast: geralmente 50-100 (ex: Pidgey, Rattata)
  // Medium Slow: geralmente 50-120 (ex: Bulbasaur, Squirtle)
  // Slow: geralmente 50-125 (ex: Charmander, Geodude)
  const baseExpMap: Record<ExperienceGroup, number> = {
    fast: 65,        // Média de beasts mágicas
    medium_fast: 50, // Média de beasts equilibradas
    medium_slow: 60, // Média de beasts físicas/tanques
    slow: 70,        // Média de beasts sombrias/complexas
  };
  
  return baseExpMap[group];
}

/**
 * Calcula experiência ganha ao derrotar um inimigo
 * Baseado na fórmula do Pokémon: (BaseExp * Nível) / 7 * modificadores
 */
export function calculateExperienceGain(
  playerLevel: number,
  enemyLevel: number,
  enemyLine?: BeastLine
): number {
  // Obter baseExp do inimigo (ou usar padrão se não especificado)
  const baseExp = enemyLine ? getBaseExperienceYield(enemyLine) : 50;
  
  // Fórmula base do Pokémon: (BaseExp * Nível) / 7
  let exp = Math.floor((baseExp * enemyLevel) / 7);
  
  // Modificadores do Pokémon:
  // - Se o inimigo é mais forte: multiplicador baseado na diferença
  // - Se o inimigo é muito mais fraco: redução
  if (enemyLevel > playerLevel) {
    // Bônus por derrotar inimigo mais forte (similar ao Pokémon)
    const levelDiff = enemyLevel - playerLevel;
    exp = Math.floor(exp * (1 + levelDiff * 0.1)); // +10% por nível acima
  } else if (enemyLevel < playerLevel - 5) {
    // Penalidade por derrotar inimigo muito mais fraco
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

