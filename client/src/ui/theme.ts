/**
 * Theme tokens for the "crystal glass" UI overhaul.
 * These tokens centralize colors, radii, shadows and gradients so we can
 * keep the look consistent across every canvas-based UI module.
 */

export const GLASS_THEME = {
  palette: {
    background: '#030712',
    header: {
      gradient: ['rgba(5, 9, 26, 0.94)', 'rgba(8, 15, 32, 0.86)'],
      border: 'rgba(160, 200, 255, 0.28)',
    },
    panel: {
      gradient: ['rgba(30, 72, 120, 0.28)', 'rgba(12, 28, 56, 0.72)'],
      border: 'rgba(210, 235, 255, 0.55)',
    },
    popup: {
      gradient: ['rgba(12, 36, 72, 0.82)', 'rgba(6, 18, 40, 0.88)'],
      border: 'rgba(230, 245, 255, 0.7)',
    },
    input: {
      gradient: ['rgba(24, 46, 86, 0.72)', 'rgba(10, 24, 52, 0.78)'],
      border: 'rgba(185, 220, 255, 0.85)',
    },
    text: {
      primary: '#F5F9FF',
      secondary: 'rgba(198, 210, 238, 0.78)',
      muted: 'rgba(150, 170, 210, 0.68)',
      highlight: '#FFFFFF',
    },
    accent: {
      cyan: '#38BDF8',
      cyanSoft: 'rgba(56, 189, 248, 0.4)',
      lilac: '#C084FC',
      purple: '#7C3AED',
      emerald: '#22C55E',
      amber: '#FACC15',
      danger: '#F87171',
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
    button: { color: 'rgba(30, 120, 200, 0.35)', blur: 18, offsetX: 0, offsetY: 10 },
  },
  button: {
    gradient: {
      primary: ['rgba(60, 200, 255, 0.38)', 'rgba(90, 120, 255, 0.16)'],
      hover: ['rgba(60, 200, 255, 0.58)', 'rgba(90, 120, 255, 0.28)'],
      active: ['rgba(36, 82, 140, 0.65)', 'rgba(40, 60, 120, 0.45)'],
      disabled: ['rgba(26, 44, 72, 0.26)', 'rgba(18, 32, 56, 0.18)'],
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
      dark: '#0B1120',
    },
    droplet: 'rgba(255, 255, 255, 0.38)',
  },
  tabs: {
    gradient: {
      base: ['rgba(55, 180, 255, 0.25)', 'rgba(120, 90, 255, 0.12)'],
      active: ['rgba(80, 200, 255, 0.35)', 'rgba(140, 120, 255, 0.2)'],
    },
    border: {
      base: 'rgba(210, 235, 255, 0.7)',
      active: 'rgba(235, 250, 255, 0.9)',
    },
    underline: 'rgba(164, 218, 255, 0.95)',
    glow: 'rgba(80, 200, 255, 0.35)',
  },
  bar: {
    background: 'rgba(12, 28, 58, 0.45)',
    border: 'rgba(160, 210, 255, 0.55)',
    gradient: ['rgba(56, 189, 248, 0.85)', 'rgba(59, 130, 246, 0.72)'],
    success: ['rgba(34, 197, 94, 0.85)', 'rgba(16, 185, 129, 0.75)'],
    warning: ['rgba(246, 173, 55, 0.85)', 'rgba(249, 115, 22, 0.75)'],
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

