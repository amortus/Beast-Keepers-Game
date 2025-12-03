/**
 * UI de Exploração - Beast Keepers
 * Interface visual para exploração e encontros
 */

import type { ExplorationState, ExplorationZone, Encounter, WildEnemy } from '../systems/exploration';
import type { Item } from '../types';
import { GLASS_THEME } from './theme';
import { drawPanel, drawText, drawButton, isMouseOver, drawBar } from './ui-helper';
import { EXPLORATION_ZONES } from '../systems/exploration';

export class ExplorationUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: ExplorationState | null = null;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // Animation
  private animationFrame = 0;
  
  // UI state
  private showZoneSelection = true;
  
  // Buttons
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
    });

    this.canvas.addEventListener('mousedown', () => {
      this.handleClick();
    });
  }

  private handleClick() {
    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        if (button.action) {
          button.action();
        }
      }
    });
  }

  public draw(state?: ExplorationState) {
    this.animationFrame++;
    
    if (state) {
      this.state = state;
    }
    
    // Clear
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Rebuild buttons
    this.buttons.clear();

    // Draw based on state
    if (this.showZoneSelection) {
      this.drawZoneSelection();
    } else if (this.state) {
      this.drawExplorationActive();
    }
  }

  // ===== SELEÇÃO DE ZONA =====

  private drawZoneSelection() {
    const panelWidth = 1000;
    const panelHeight = 720; // AUMENTADO para caber o botão de dungeons
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      variant: 'popup',
      borderWidth: 1.5,
    });

    // Title
    drawText(this.ctx, '🗺️ EXPLORAÇÃO', this.canvas.width / 2, panelY + 30, {
      align: 'center',
      font: 'bold 32px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    // Subtitle
    drawText(this.ctx, 'Escolha uma zona para explorar', this.canvas.width / 2, panelY + 65, {
      align: 'center',
      font: '16px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });

    // Zone cards
    const zones: ExplorationZone[] = ['forest', 'mountains', 'caves', 'desert', 'swamp', 'ruins'];
    const cardWidth = 300;
    const cardHeight = 150;
    const startX = panelX + 50;
    const startY = panelY + 100;
    const spacing = 20;
    const perRow = 3;

    zones.forEach((zone, index) => {
      const col = index % perRow;
      const row = Math.floor(index / perRow);
      const x = startX + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);

      this.drawZoneCard(zone, x, y, cardWidth, cardHeight);
    });

    // Close button
    const closeBtnWidth = 120;
    const closeBtnHeight = 40;
    const closeBtnX = panelX + panelWidth - closeBtnWidth - 20;
    const closeBtnY = panelY + panelHeight - closeBtnHeight - 20;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);

    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖ Fechar', {
      variant: 'danger',
      isHovered: closeIsHovered,
    });

    this.buttons.set('btn_close', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth,
      height: closeBtnHeight,
      action: () => {
        this.onClose();
      },
    });
  }

  private drawZoneCard(zone: ExplorationZone, x: number, y: number, width: number, height: number) {
    const zoneData = EXPLORATION_ZONES[zone];
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);

    // Card background com gradiente glass
    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
    if (isHovered) {
      gradient.addColorStop(0, 'rgba(60, 194, 255, 0.25)');
      gradient.addColorStop(1, 'rgba(26, 84, 176, 0.2)');
    } else {
      gradient.addColorStop(0, 'rgba(16, 52, 90, 0.4)');
      gradient.addColorStop(1, 'rgba(8, 26, 48, 0.5)');
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, height);
    
    this.ctx.strokeStyle = this.getDifficultyColor(zoneData.difficulty);
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(x, y, width, height);

    // Zone name
    drawText(this.ctx, zoneData.name, x + width / 2, y + 20, {
      align: 'center',
      font: 'bold 18px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    // Difficulty stars
    const stars = '★'.repeat(zoneData.difficulty) + '☆'.repeat(5 - zoneData.difficulty);
    drawText(this.ctx, stars, x + width / 2, y + 45, {
      align: 'center',
      font: '16px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    // Description (wrapped)
    this.drawWrappedText(zoneData.description, x + 10, y + 70, width - 20, 16);

    // Start button
    const btnWidth = 120;
    const btnHeight = 30;
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + height - btnHeight - 10;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '⚔️ Explorar', {
      variant: 'primary',
      isHovered: btnIsHovered,
    });

    this.buttons.set(`zone_${zone}`, {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.onZoneSelected(zone);
      },
    });
  }

  // ===== EXPLORAÇÃO ATIVA =====

  private drawExplorationActive() {
    if (!this.state) return;

    // Header
    this.drawExplorationHeader();

    // Progress bar
    this.drawProgressBar();

    // Current encounter
    const currentEncounter = this.state.currentEncounter >= 0 ? this.state.encounters[this.state.currentEncounter] : null;
    
    // Verificar se está em loop
    if (this.state.currentEncounter >= 0 && this.state.currentEncounter < this.state.encounters.length) {
      this.drawCurrentEncounter(currentEncounter!);
    } else {
      this.drawWalkingPrompt();
    }

    // Materials collected panel
    this.drawMaterialsPanel();

    // Action buttons
    this.drawActionButtons();
  }

  private drawExplorationHeader() {
    if (!this.state) return;

    const zoneData = EXPLORATION_ZONES[this.state.zone];

    drawText(this.ctx, `🗺️ ${zoneData.name}`, this.canvas.width / 2, 30, {
      align: 'center',
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    drawText(this.ctx, `📍 Distância: ${this.state.distance}m | ⚔️ Derrotados: ${this.state.enemiesDefeated} | 💎 Tesouros: ${this.state.treasuresFound}`, this.canvas.width / 2, 55, {
      align: 'center',
      font: '14px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });
  }

  private drawProgressBar() {
    const barWidth = 800;
    const barHeight = 20;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 75;

    // NOVO: Mostrar progresso total (0-5000m)
    const MAX_DISTANCE = 5000;
    const currentDistance = this.state?.distance || 0;
    const progress = Math.min(currentDistance, MAX_DISTANCE);

    drawBar(this.ctx, barX, barY, barWidth, barHeight, progress, MAX_DISTANCE, {
      fillColor: GLASS_THEME.palette.accent.emerald,
      label: `Progresso: ${currentDistance}m / ${MAX_DISTANCE}m`,
    });
  }

  private drawCurrentEncounter(encounter: Encounter) {
    const panelWidth = 700;
    const panelHeight = 400;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = 120;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.medium,
    });

    // Draw based on encounter type
    if (encounter.type === 'enemy' && encounter.enemy) {
      this.drawEnemyEncounter(encounter.enemy, panelX, panelY, panelWidth, panelHeight);
    } else if (encounter.type === 'treasure' && encounter.treasure) {
      this.drawTreasureEncounter(encounter.treasure, panelX, panelY, panelWidth, panelHeight);
    } else if (encounter.type === 'event' && encounter.eventMessage) {
      this.drawEventEncounter(encounter.eventMessage, panelX, panelY, panelWidth, panelHeight);
    } else {
      this.drawNothingEncounter(panelX, panelY, panelWidth, panelHeight);
    }
  }

  private drawEnemyEncounter(enemy: WildEnemy, x: number, y: number, width: number, height: number) {
    drawText(this.ctx, '⚔️ INIMIGO ENCONTRADO!', x + width / 2, y + 30, {
      align: 'center',
      font: 'bold 22px monospace',
      color: GLASS_THEME.palette.accent.danger,
    });

    drawText(this.ctx, enemy.name, x + width / 2, y + 60, {
      align: 'center',
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    drawText(this.ctx, `Level ${enemy.level} | Raridade: ${enemy.rarity.toUpperCase()}`, x + width / 2, y + 85, {
      align: 'center',
      font: '14px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });

    // Stats
    const statsY = y + 120;
    const stats = [
      { name: 'Força', value: enemy.stats.might },
      { name: 'Astúcia', value: enemy.stats.wit },
      { name: 'Foco', value: enemy.stats.focus },
      { name: 'Agilidade', value: enemy.stats.agility },
      { name: 'Resistência', value: enemy.stats.ward },
      { name: 'Vitalidade', value: enemy.stats.vitality },
    ];

    stats.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const statX = x + 50 + col * 300;
      const statY = statsY + row * 30;

      drawText(this.ctx, `${stat.name}: ${stat.value}`, statX, statY, {
        font: '14px monospace',
        color: GLASS_THEME.palette.text.primary,
      });
    });

    // Description
    drawText(this.ctx, enemy.description, x + width / 2, y + height - 80, {
      align: 'center',
      font: '13px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });

    // Battle button
    const btnWidth = 150;
    const btnHeight = 40;
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + height - 50;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '⚔️ LUTAR!', {
      variant: 'danger',
      isHovered: btnIsHovered,
    });

    this.buttons.set('btn_battle', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        if (this.onBattleStart) {
          this.onBattleStart(enemy);
        }
      },
    });
  }

  private drawTreasureEncounter(treasure: Item[], x: number, y: number, width: number, height: number) {
    drawText(this.ctx, '💎 TESOURO ENCONTRADO!', x + width / 2, y + 30, {
      align: 'center',
      font: 'bold 22px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    // List treasures
    let currentY = y + 70;
    treasure.forEach(item => {
      drawText(this.ctx, `• ${item.name} x${item.quantity}`, x + width / 2, currentY, {
        align: 'center',
        font: '16px monospace',
        color: GLASS_THEME.palette.text.primary,
      });
      currentY += 25;
    });

    // Collect button
    const btnWidth = 150;
    const btnHeight = 40;
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + height - 50;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '💰 Coletar', {
      variant: 'success',
      isHovered: btnIsHovered,
    });

    this.buttons.set('btn_collect', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.onTreasureCollect(treasure);
      },
    });
  }

  private drawEventEncounter(message: string, x: number, y: number, width: number, height: number) {
    drawText(this.ctx, '📜 EVENTO!', x + width / 2, y + 30, {
      align: 'center',
      font: 'bold 22px monospace',
      color: GLASS_THEME.palette.accent.cyan,
    });

    this.drawWrappedText(message, x + 40, y + 80, width - 80, 22);

    // Continue button
    const btnWidth = 150;
    const btnHeight = 40;
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + height - 50;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '➡️ Continuar', {
      variant: 'primary',
      isHovered: btnIsHovered,
    });

    this.buttons.set('btn_continue', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        if (this.onEventContinue) {
          this.onEventContinue();
        }
      },
    });
  }

  private drawNothingEncounter(x: number, y: number, width: number, height: number) {
    drawText(this.ctx, '🌿 Nada por aqui...', x + width / 2, y + 30, {
      align: 'center',
      font: 'bold 22px monospace',
      color: GLASS_THEME.palette.text.muted,
    });

    drawText(this.ctx, 'Continue explorando!', x + width / 2, y + 80, {
      align: 'center',
      font: '16px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });

    // Walk button
    const btnWidth = 150;
    const btnHeight = 40;
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + height - 50;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '🚶 Andar', {
      variant: 'primary',
      isHovered: btnIsHovered,
    });

    this.buttons.set('btn_walk', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.onWalk();
      },
    });
  }

  private drawWalkingPrompt() {
    const panelWidth = 700;
    const panelHeight = 200;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = 150;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      variant: 'popup',
      borderWidth: 1.5,
    });

    drawText(this.ctx, '🚶 Continue explorando...', this.canvas.width / 2, panelY + 60, {
      align: 'center',
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    // Walk button
    const btnWidth = 150;
    const btnHeight = 40;
    const btnX = panelX + (panelWidth - btnWidth) / 2;
    const btnY = panelY + 110;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '➡️ Andar 100m', {
      variant: 'primary',
      isHovered: btnIsHovered,
    });

    this.buttons.set('btn_walk', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.onWalk();
      },
    });
  }

  private drawMaterialsPanel() {
    if (!this.state) return;

    const panelWidth = 350;
    const panelHeight = 300;
    const panelX = this.canvas.width - panelWidth - 20;
    const panelY = 120;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      variant: 'popup',
      borderWidth: 1.5,
    });

    drawText(this.ctx, '💎 Materiais Coletados', panelX + panelWidth / 2, panelY + 25, {
      align: 'center',
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });

    // List materials
    let currentY = panelY + 50;
    const maxDisplay = 10;
    const materials = this.state.collectedMaterials.slice(0, maxDisplay);

    if (materials.length === 0) {
      drawText(this.ctx, 'Nenhum material ainda', panelX + panelWidth / 2, currentY, {
        align: 'center',
        font: '14px monospace',
        color: GLASS_THEME.palette.text.muted,
      });
    } else {
      materials.forEach(material => {
        drawText(this.ctx, `• ${material.name} x${material.quantity}`, panelX + 20, currentY, {
          font: '13px monospace',
          color: GLASS_THEME.palette.text.primary,
        });
        currentY += 22;
      });

      if (this.state.collectedMaterials.length > maxDisplay) {
        drawText(this.ctx, `... e mais ${this.state.collectedMaterials.length - maxDisplay}`, panelX + 20, currentY, {
          font: '12px monospace',
          color: GLASS_THEME.palette.text.secondary,
        });
      }
    }
  }

  private drawActionButtons() {
    const btnWidth = 130;
    const btnHeight = 40;
    
    // CORREÇÃO: Reposicionar botão "Voltar" para o topo direito para não conflitar com chat
    // Chat está no bottom-left, então vamos colocar o botão no top-right
    const returnX = this.canvas.width - btnWidth - 20; // Canto superior direito
    const y = 20; // Topo da tela
    const returnIsHovered = isMouseOver(this.mouseX, this.mouseY, returnX, y, btnWidth, btnHeight);

    drawButton(this.ctx, returnX, y, btnWidth, btnHeight, '🏠 Voltar', {
      variant: 'ghost',
      isHovered: returnIsHovered,
    });

    this.buttons.set('btn_return', {
      x: returnX,
      y,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.onReturn();
      },
    });
  }

  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = GLASS_THEME.palette.text.primary;
    this.ctx.textAlign = 'left';

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && line) {
        this.ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, currentY);
  }

  private getDifficultyColor(difficulty: number): string {
    if (difficulty <= 1) return GLASS_THEME.palette.accent.emerald;
    if (difficulty <= 2) return GLASS_THEME.palette.accent.cyan;
    if (difficulty <= 3) return GLASS_THEME.palette.accent.amber;
    if (difficulty <= 4) return GLASS_THEME.palette.accent.danger;
    return GLASS_THEME.palette.accent.lilac;
  }

  public showZoneSelect() {
    this.showZoneSelection = true;
    this.state = null;
  }

  public hideZoneSelect() {
    this.showZoneSelection = false;
  }

  public updateState(state: ExplorationState) {
    this.state = state;
    this.showZoneSelection = false;
  }

  public close() {
    this.state = null;
    this.showZoneSelection = true;
  }

  // Callbacks
  public onZoneSelected: (zone: ExplorationZone) => void = () => {};
  public onWalk: () => void = () => {};
  public onBattleStart: (enemy: WildEnemy) => void = () => {};
  public onTreasureCollect: (treasure: Item[]) => void = () => {};
  public onEventContinue: () => void = () => {};
  public onReturn: () => void = () => {};
  public onClose: () => void = () => {};
}

