/**
 * Helpers para desenhar UI
 */

import { COLORS, hexToRgba } from './colors';

/**
 * Desenha um painel com borda
 */
export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    bgColor?: string;
    borderColor?: string;
    borderWidth?: number;
    alpha?: number;
  } = {}
) {
  const {
    bgColor = COLORS.bg.medium,
    borderColor = COLORS.primary.purple,
    borderWidth = 2,
    alpha = 0.95,
  } = options;

  // Fundo - se já é rgba, usar direto, senão aplicar alpha
  if (bgColor.startsWith('rgba')) {
    ctx.fillStyle = bgColor;
  } else {
    ctx.fillStyle = hexToRgba(bgColor, alpha);
  }
  ctx.fillRect(x, y, width, height);

  // Borda
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(x, y, width, height);
}

/**
 * Desenha texto com sombra
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color?: string;
    font?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    shadow?: boolean;
  } = {}
) {
  const {
    color = COLORS.ui.text,
    font = '16px monospace',
    align = 'left',
    baseline = 'top',
    shadow = true,
  } = options;

  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  if (shadow) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

/**
 * Desenha uma barra (HP, Essência, etc)
 */
export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  current: number,
  max: number,
  options: {
    bgColor?: string;
    fillColor?: string;
    borderColor?: string;
    label?: string;
  } = {}
) {
  const {
    bgColor = COLORS.bg.dark,
    fillColor = COLORS.primary.green,
    borderColor = COLORS.ui.text,
    label,
  } = options;

  const percentage = Math.max(0, Math.min(1, current / max));

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, height);

  // Fill
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, width * percentage, height);

  // Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Label
  if (label) {
    drawText(ctx, label, x + width / 2, y + height / 2, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 14px monospace',
    });
  }
}

/**
 * Desenha um botão
 */
export function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options: {
    bgColor?: string;
    hoverColor?: string;
    textColor?: string;
    isHovered?: boolean;
    isDisabled?: boolean;
  } = {}
) {
  const {
    bgColor = COLORS.primary.purple,
    hoverColor = COLORS.primary.purpleDark,
    textColor = COLORS.ui.text,
    isHovered = false,
    isDisabled = false,
  } = options;

  const color = isDisabled
    ? COLORS.bg.light
    : isHovered
    ? hoverColor
    : bgColor;

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  // Border
  ctx.strokeStyle = isDisabled ? COLORS.ui.textDim : COLORS.ui.text;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Text
  drawText(ctx, text, x + width / 2, y + height / 2, {
    align: 'center',
    baseline: 'middle',
    font: 'bold 14px monospace',
    color: isDisabled ? COLORS.ui.textDim : textColor,
  });
}

/**
 * Verifica se o mouse está sobre um retângulo
 */
export function isMouseOver(
  mouseX: number,
  mouseY: number,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
}

/**
 * Quebra texto em múltiplas linhas
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

