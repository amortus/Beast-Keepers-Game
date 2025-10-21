/**
 * Sistema de geração e gerenciamento de Bestas
 */

import type { Beast, BeastLine, Attributes, PersonalityTrait } from '../types';
import { getBeastLineData } from '../data/beasts';
import { getStartingTechniques } from '../data/techniques';

/**
 * Gera um ID único para a besta
 */
function generateBeastId(): string {
  return `beast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula HP máximo baseado em Vitalidade
 */
function calculateMaxHp(vitality: number): number {
  return vitality * 2 + 50;
}

/**
 * Gera uma nova Besta de uma linha específica
 */
export function createBeast(line: BeastLine, name: string, currentWeek: number): Beast {
  const lineData = getBeastLineData(line);
  const startingTechniques = getStartingTechniques(line);

  // Copia atributos base
  const attributes: Attributes = { ...lineData.baseAttributes };

  // Adiciona pequena variação aleatória (-5% a +5%)
  Object.keys(attributes).forEach(key => {
    const attrKey = key as keyof Attributes;
    const base = attributes[attrKey];
    const variation = Math.floor(base * (Math.random() * 0.1 - 0.05));
    attributes[attrKey] = Math.max(10, base + variation);
  });

  const maxHp = calculateMaxHp(attributes.vitality);

  // Traço inicial aleatório (simplificado para MVP)
  const possibleTraits: PersonalityTrait[] = ['loyal', 'brave', 'curious', 'lazy', 'proud'];
  const initialTrait = possibleTraits[Math.floor(Math.random() * possibleTraits.length)];

  const beast: Beast = {
    id: generateBeastId(),
    name,
    line,
    blood: 'common', // Por enquanto sempre comum
    affinity: lineData.affinity[0], // Primeira afinidade
    
    attributes,
    secondaryStats: {
      fatigue: 0,
      stress: 0,
      loyalty: 50,
      age: 0,
      maxAge: lineData.baseLifespan,
    },
    
    traits: [initialTrait],
    mood: 'happy',
    
    techniques: startingTechniques,
    currentHp: maxHp,
    maxHp,
    essence: 50,
    maxEssence: 99,
    
    birthWeek: currentWeek,
    lifeEvents: [{
      week: currentWeek,
      type: 'birth',
      description: `${name} nasceu de uma Relíquia de Eco`,
    }],
    victories: 0,
    defeats: 0,
  };

  return beast;
}

/**
 * Aplica crescimento de atributos baseado na curva e treino
 */
export function applyGrowth(beast: Beast, attribute: keyof Attributes, intensity: number = 1): number {
  const lineData = getBeastLineData(beast.line);
  const growthRate = lineData.growthCurve[attribute];
  
  // Multiplicadores de crescimento
  const multipliers = {
    none: 0,
    slow: 0.5,
    medium: 1.0,
    fast: 1.5,
    veryfast: 2.0,
  };

  const baseGrowth = multipliers[growthRate] * intensity;
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 a 1.2
  const growth = Math.floor(baseGrowth * randomFactor);

  // Aplica crescimento
  beast.attributes[attribute] = Math.min(beast.attributes[attribute] + growth, 150);

  // Atualiza HP máximo se treinou vitalidade
  if (attribute === 'vitality') {
    const newMaxHp = calculateMaxHp(beast.attributes.vitality);
    const hpDiff = newMaxHp - beast.maxHp;
    beast.maxHp = newMaxHp;
    beast.currentHp = Math.min(beast.currentHp + hpDiff, beast.maxHp);
  }

  return growth;
}

/**
 * Envelhece a besta em 1 semana
 */
export function ageBeast(beast: Beast) {
  beast.secondaryStats.age++;
  
  // Recuperação natural de fadiga/stress ao envelhecer
  beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 5);
  beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 3);
  
  // Atualiza mood baseado em stress
  if (beast.secondaryStats.stress > 70) {
    beast.mood = 'angry';
  } else if (beast.secondaryStats.stress > 40) {
    beast.mood = 'tired';
  } else if (beast.secondaryStats.fatigue > 60) {
    beast.mood = 'tired';
  } else if (beast.secondaryStats.stress < 20 && beast.secondaryStats.fatigue < 30) {
    beast.mood = 'happy';
  } else {
    beast.mood = 'neutral';
  }
}

/**
 * Verifica se a besta está viva
 */
export function isBeastAlive(beast: Beast): boolean {
  return beast.secondaryStats.age < beast.secondaryStats.maxAge;
}

/**
 * Calcula a fase de vida da besta
 */
export function getLifePhase(beast: Beast): 'infant' | 'young' | 'adult' | 'mature' | 'elder' {
  const age = beast.secondaryStats.age;
  const maxAge = beast.secondaryStats.maxAge;
  const percentage = (age / maxAge) * 100;

  if (percentage < 13) return 'infant';       // 0-20 semanas (~13%)
  if (percentage < 38) return 'young';        // 21-60 semanas
  if (percentage < 75) return 'adult';        // 61-150 semanas
  if (percentage < 90) return 'mature';       // 151-180 semanas
  return 'elder';                             // 181+ semanas
}

/**
 * Adiciona evento ao histórico da besta
 */
export function addLifeEvent(
  beast: Beast,
  week: number,
  type: Beast['lifeEvents'][0]['type'],
  description: string
) {
  beast.lifeEvents.push({ week, type, description });
}

/**
 * Cura a besta (recupera HP)
 */
export function healBeast(beast: Beast, amount: number) {
  beast.currentHp = Math.min(beast.currentHp + amount, beast.maxHp);
}

/**
 * Recupera essência
 */
export function recoverEssence(beast: Beast, amount: number) {
  beast.essence = Math.min(beast.essence + amount, beast.maxEssence);
}

/**
 * Reduz fadiga
 */
export function reduceFatigue(beast: Beast, amount: number) {
  beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - amount);
}

/**
 * Reduz stress
 */
export function reduceStress(beast: Beast, amount: number) {
  beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - amount);
}

/**
 * Adiciona fadiga
 */
export function addFatigue(beast: Beast, amount: number) {
  beast.secondaryStats.fatigue = Math.min(100, beast.secondaryStats.fatigue + amount);
}

/**
 * Adiciona stress
 */
export function addStress(beast: Beast, amount: number) {
  beast.secondaryStats.stress = Math.min(100, beast.secondaryStats.stress + amount);
}

/**
 * Serializa besta para save
 */
export function serializeBeast(beast: Beast): string {
  return JSON.stringify(beast);
}

/**
 * Deserializa besta do save
 */
export function deserializeBeast(data: string): Beast {
  return JSON.parse(data) as Beast;
}

