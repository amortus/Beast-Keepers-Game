/**
 * Paleta de cores do Beast Keepers
 * Estilo vibrante inspirado em PS1
 */

export const COLORS = {
  // Background
  bg: {
    dark: '#0f1419',
    medium: '#1a1a2e',
    light: '#2d3748',
  },

  // Primárias
  primary: {
    purple: '#667eea',
    purpleDark: '#764ba2',
    green: '#48bb78',
    gold: '#fbbf24',
    blue: '#4299e1',
  },

  // Atributos
  attributes: {
    might: '#e53e3e',      // Vermelho (Força)
    wit: '#9f7aea',        // Roxo (Astúcia)
    focus: '#4299e1',      // Azul (Foco)
    agility: '#48bb78',    // Verde (Agilidade)
    ward: '#718096',       // Cinza (Resistência)
    vitality: '#f56565',   // Rosa (Vitalidade)
  },

  // Elementos
  elements: {
    fire: '#f56565',
    water: '#4299e1',
    earth: '#8b7355',
    air: '#a0aec0',
    shadow: '#2d3748',
    light: '#fbbf24',
    ether: '#9f7aea',
    moon: '#cbd5e0',
    blood: '#c53030',
  },

  // UI
  ui: {
    success: '#48bb78',
    warning: '#f6ad55',
    error: '#fc8181',
    info: '#63b3ed',
    text: '#e2e8f0',
    textDim: '#a0aec0',
  },

  // Status
  status: {
    happy: '#48bb78',
    neutral: '#a0aec0',
    sad: '#4299e1',
    angry: '#fc8181',
    tired: '#f6ad55',
  },
};

/**
 * Converte hex para rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

