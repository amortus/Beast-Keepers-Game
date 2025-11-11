/**
 * Theme tokens for the "crystal glass" UI overhaul.
 * These tokens centralize colors, radii, shadows and gradients so we can
 * keep the look consistent across every canvas-based UI module.
 */

export const GLASS_THEME = {
  palette: {
    background: '#040f1e',
    header: {
      gradient: ['rgba(6, 20, 40, 0.97)', 'rgba(4, 16, 32, 0.94)'],
      border: 'rgba(70, 150, 220, 0.42)',
    },
    panel: {
      gradient: ['rgba(16, 48, 78, 0.94)', 'rgba(10, 30, 56, 0.96)'],
      border: 'rgba(90, 180, 240, 0.48)',
    },
    popup: {
      gradient: ['rgba(18, 52, 92, 0.9)', 'rgba(8, 26, 50, 0.94)'],
      border: 'rgba(140, 205, 255, 0.68)',
    },
    input: {
      gradient: ['rgba(20, 50, 88, 0.88)', 'rgba(12, 28, 58, 0.92)'],
      border: 'rgba(110, 185, 250, 0.82)',
    },
    text: {
      primary: '#E6F3FF',
      secondary: 'rgba(172, 198, 228, 0.88)',
      muted: 'rgba(122, 148, 184, 0.7)',
      highlight: '#FFFFFF',
    },
    accent: {
      cyan: '#33B8FF',
      cyanSoft: 'rgba(51, 184, 255, 0.28)',
      lilac: '#8AA9FF',
      purple: '#4266E3',
      emerald: '#4CE6B8',
      amber: '#FFC768',
      danger: '#FF7A7A',
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
    heavy: { color: 'rgba(2, 6, 18, 0.78)', blur: 46, offsetX: 0, offsetY: 26 },
    button: { color: 'rgba(32, 110, 210, 0.48)', blur: 20, offsetX: 0, offsetY: 12 },
  },
  button: {
    gradient: {
      primary: ['rgba(60, 150, 255, 0.64)', 'rgba(24, 72, 160, 0.52)'],
      hover: ['rgba(74, 190, 255, 0.74)', 'rgba(32, 96, 190, 0.6)'],
      active: ['rgba(30, 74, 150, 0.78)', 'rgba(18, 48, 126, 0.68)'],
      disabled: ['rgba(24, 46, 78, 0.26)', 'rgba(16, 32, 58, 0.2)'],
    },
    border: {
      base: 'rgba(170, 215, 255, 0.85)',
      hover: 'rgba(205, 235, 255, 0.92)',
      active: 'rgba(150, 205, 255, 0.9)',
      disabled: 'rgba(110, 135, 170, 0.45)',
    },
    text: {
      base: '#F7FAFF',
      disabled: 'rgba(170, 190, 215, 0.55)',
    },
    droplet: 'rgba(255, 255, 255, 0.32)',
  },
  tabs: {
    gradient: {
      base: ['rgba(40, 92, 150, 0.42)', 'rgba(22, 60, 108, 0.35)'],
      active: ['rgba(70, 150, 220, 0.58)', 'rgba(46, 100, 185, 0.4)'],
    },
    border: {
      base: 'rgba(150, 205, 255, 0.7)',
      active: 'rgba(210, 245, 255, 0.96)',
    },
    underline: 'rgba(120, 200, 255, 0.95)',
    glow: 'rgba(70, 160, 255, 0.48)',
  },
  bar: {
    background: 'rgba(14, 36, 62, 0.55)',
    border: 'rgba(135, 195, 250, 0.6)',
    gradient: ['rgba(88, 178, 255, 0.88)', 'rgba(46, 120, 220, 0.76)'],
    success: ['rgba(82, 220, 160, 0.88)', 'rgba(44, 172, 128, 0.76)'],
    warning: ['rgba(255, 176, 78, 0.88)', 'rgba(236, 132, 48, 0.76)'],
    radius: 14,
    highlight: 'rgba(255, 255, 255, 0.28)',
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

