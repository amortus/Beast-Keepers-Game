/**
 * Theme tokens for the "crystal glass" UI overhaul.
 * These tokens centralize colors, radii, shadows and gradients so we can
 * keep the look consistent across every canvas-based UI module.
 */

export const GLASS_THEME = {
  palette: {
    background: '#031021',
    header: {
      gradient: ['rgba(10, 28, 60, 0.92)', 'rgba(6, 18, 40, 0.88)'],
      border: 'rgba(140, 190, 255, 0.32)',
    },
    panel: {
      gradient: ['rgba(36, 78, 135, 0.48)', 'rgba(14, 36, 70, 0.86)'],
      border: 'rgba(190, 225, 255, 0.55)',
    },
    popup: {
      gradient: ['rgba(24, 56, 105, 0.82)', 'rgba(10, 28, 60, 0.9)'],
      border: 'rgba(220, 240, 255, 0.72)',
    },
    input: {
      gradient: ['rgba(26, 58, 110, 0.78)', 'rgba(12, 30, 64, 0.82)'],
      border: 'rgba(175, 210, 255, 0.85)',
    },
    text: {
      primary: '#F2F7FF',
      secondary: 'rgba(198, 214, 240, 0.82)',
      muted: 'rgba(135, 160, 200, 0.72)',
      highlight: '#FFFFFF',
    },
    accent: {
      cyan: '#6AAEFF',
      cyanSoft: 'rgba(106, 174, 255, 0.32)',
      lilac: '#9CB5FF',
      purple: '#4D6FD9',
      emerald: '#5BE3B6',
      amber: '#FFD76C',
      danger: '#FF8C8C',
    },
    overlay: 'rgba(3, 7, 18, 0.65)',
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },
  shadow: {
    soft: { color: 'rgba(5, 15, 35, 0.55)', blur: 26, offsetX: 0, offsetY: 12 },
    heavy: { color: 'rgba(3, 8, 18, 0.75)', blur: 42, offsetX: 0, offsetY: 24 },
    button: { color: 'rgba(40, 120, 210, 0.4)', blur: 18, offsetX: 0, offsetY: 10 },
  },
  button: {
    gradient: {
      primary: ['rgba(90, 165, 255, 0.5)', 'rgba(48, 110, 210, 0.4)'],
      hover: ['rgba(96, 188, 255, 0.62)', 'rgba(58, 128, 230, 0.52)'],
      active: ['rgba(40, 94, 175, 0.72)', 'rgba(28, 70, 150, 0.6)'],
      disabled: ['rgba(30, 52, 90, 0.26)', 'rgba(20, 36, 64, 0.18)'],
    },
    border: {
      base: 'rgba(220, 240, 255, 0.9)',
      hover: 'rgba(240, 250, 255, 0.95)',
      active: 'rgba(190, 220, 255, 0.95)',
      disabled: 'rgba(130, 150, 180, 0.45)',
    },
    text: {
      base: '#F7FAFF',
      disabled: 'rgba(170, 190, 215, 0.55)',
    },
    droplet: 'rgba(255, 255, 255, 0.38)',
  },
  tabs: {
    gradient: {
      base: ['rgba(64, 122, 210, 0.32)', 'rgba(42, 90, 180, 0.26)'],
      active: ['rgba(96, 170, 255, 0.45)', 'rgba(70, 120, 230, 0.35)'],
    },
    border: {
      base: 'rgba(185, 220, 255, 0.68)',
      active: 'rgba(225, 245, 255, 0.92)',
    },
    underline: 'rgba(160, 215, 255, 0.9)',
    glow: 'rgba(90, 160, 255, 0.45)',
  },
  bar: {
    background: 'rgba(18, 42, 80, 0.45)',
    border: 'rgba(165, 215, 255, 0.55)',
    gradient: ['rgba(108, 185, 255, 0.85)', 'rgba(78, 142, 240, 0.72)'],
    success: ['rgba(88, 230, 170, 0.85)', 'rgba(54, 195, 135, 0.75)'],
    warning: ['rgba(255, 193, 94, 0.85)', 'rgba(240, 150, 56, 0.75)'],
    radius: 14,
    highlight: 'rgba(255, 255, 255, 0.32)',
  },
  overlay: {
    color: 'rgba(3, 7, 18, 0.65)',
  },
};

export type GlassPanelVariant = 'default' | 'header' | 'card' | 'popup' | 'input';

export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba')) {
    const matches = color.match(/rgba?\(([^)]+)\)/);
    if (!matches) return color;
    const parts = matches[1].split(',').map((p) => p.trim());
    const [r, g, b] = parts;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (color.startsWith('rgb')) {
    const matches = color.match(/rgb\(([^)]+)\)/);
    if (!matches) return color;
    const parts = matches[1].split(',').map((p) => p.trim());
    const [r, g, b] = parts;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

