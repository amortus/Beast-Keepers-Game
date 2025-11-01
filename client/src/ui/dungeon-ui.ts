/**
 * UI de Dungeons
 * Sistema de exploração de masmorras com múltiplos andares
 */

import type { GameState } from '../types';
import type { Dungeon, DungeonFloor } from '../data/dungeons';
import { DUNGEONS, getAvailableDungeons, calculateStaminaCost } from '../data/dungeons';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';

export class DungeonUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedDungeon: Dungeon | null = null;
  private selectedFloor: number = 1;

  public onEnterDungeon: ((dungeonId: string, floor: number) => void) | null = null;
  public onClose: (() => void) | null = null;

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

  public draw(gameState: GameState) {
    this.buttons.clear();

    // Fundo semi-transparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Painel principal
    const panelWidth = 1000;
    const panelHeight = 650;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.purple,
    });

    // Header
    drawText(this.ctx, '🏛️ Dungeons', panelX + 20, panelY + 25, {
      font: 'bold 36px monospace',
      color: COLORS.primary.purple,
    });

    // Stamina
    const stamina = gameState.stamina || 100;
    const maxStamina = 100;
    drawText(this.ctx, `⚡ Stamina: ${stamina}/${maxStamina}`, panelX + panelWidth - 20, panelY + 30, {
      align: 'right',
      font: 'bold 20px monospace',
      color: stamina > 50 ? COLORS.primary.green : COLORS.ui.error,
    });

    // Botão de fechar
    const closeBtnWidth = 100;
    const closeBtnHeight = 35;
    const closeBtnX = panelX + panelWidth - closeBtnWidth - 10;
    const closeBtnY = panelY + 10;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);

    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖ Fechar', {
      bgColor: COLORS.ui.error,
      isHovered: closeIsHovered,
    });

    this.buttons.set('close', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth,
      height: closeBtnHeight,
      action: () => {
        if (this.onClose) this.onClose();
      },
    });

    if (!this.selectedDungeon) {
      // Mostrar lista de dungeons
      this.drawDungeonList(panelX + 20, panelY + 80, panelWidth - 40, panelHeight - 100, gameState);
    } else {
      // Mostrar detalhes do dungeon selecionado
      this.drawDungeonDetails(panelX + 20, panelY + 80, panelWidth - 40, panelHeight - 100, gameState);
    }
  }

  private drawDungeonList(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawText(this.ctx, 'Dungeons Disponíveis', x, y, {
      font: 'bold 24px monospace',
      color: COLORS.ui.text,
    });

    const playerLevel = gameState.activeBeast?.level || 1;
    const availableDungeons = getAvailableDungeons(playerLevel);

    let currentY = y + 50;
    const dungeonHeight = 100;
    const spacing = 15;

    DUNGEONS.forEach((dungeon) => {
      const isAvailable = dungeon.minLevel <= playerLevel;
      const isCompleted = gameState.dungeonProgress?.[dungeon.id]?.completed || false;
      const currentFloor = gameState.dungeonProgress?.[dungeon.id]?.currentFloor || 1;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, x, currentY, width, dungeonHeight);

      // Background
      this.ctx.fillStyle = isHovered 
        ? COLORS.bg.light 
        : (isCompleted ? 'rgba(72, 187, 120, 0.2)' : COLORS.bg.dark);
      this.ctx.fillRect(x, currentY, width, dungeonHeight);

      // Borda
      this.ctx.strokeStyle = isCompleted ? COLORS.primary.green : COLORS.primary.purple;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, currentY, width, dungeonHeight);

      // Ícone
      drawText(this.ctx, dungeon.icon, x + 15, currentY + 35, {
        font: '48px monospace',
      });

      // Nome
      const nameColor = isAvailable ? COLORS.ui.text : COLORS.ui.textDim;
      drawText(this.ctx, dungeon.name, x + 80, currentY + 25, {
        font: 'bold 22px monospace',
        color: nameColor,
      });

      // Descrição
      drawText(this.ctx, dungeon.description, x + 80, currentY + 50, {
        font: '14px monospace',
        color: COLORS.ui.textDim,
      });

      // Nível mínimo
      const levelText = isAvailable 
        ? `Nível ${dungeon.minLevel}+` 
        : `🔒 Nível ${dungeon.minLevel}+ necessário`;
      const levelColor = isAvailable ? COLORS.primary.green : COLORS.ui.error;
      drawText(this.ctx, levelText, x + 80, currentY + 75, {
        font: 'bold 14px monospace',
        color: levelColor,
      });

      // Progresso
      if (isAvailable) {
        const progressText = isCompleted 
          ? '✅ Completo!' 
          : `Andar ${currentFloor}/5`;
        drawText(this.ctx, progressText, x + width - 15, currentY + 50, {
          align: 'right',
          font: 'bold 18px monospace',
          color: isCompleted ? COLORS.primary.gold : COLORS.primary.purple,
        });
      }

      // Botão para selecionar
      if (isAvailable) {
        this.buttons.set(`dungeon_${dungeon.id}`, {
          x,
          y: currentY,
          width,
          height: dungeonHeight,
          action: () => {
            this.selectedDungeon = dungeon;
            this.selectedFloor = currentFloor;
          },
        });
      }

      currentY += dungeonHeight + spacing;
    });
  }

  private drawDungeonDetails(x: number, y: number, width: number, height: number, gameState: GameState) {
    if (!this.selectedDungeon) return;

    const dungeon = this.selectedDungeon;
    const stamina = gameState.stamina || 100;
    const dungeonProgress = gameState.dungeonProgress?.[dungeon.id] || { currentFloor: 1, completed: false };

    // Botão voltar
    const backBtnWidth = 100;
    const backBtnHeight = 35;
    const backIsHovered = isMouseOver(this.mouseX, this.mouseY, x, y, backBtnWidth, backBtnHeight);

    drawButton(this.ctx, x, y, backBtnWidth, backBtnHeight, '← Voltar', {
      bgColor: COLORS.bg.light,
      isHovered: backIsHovered,
    });

    this.buttons.set('back', {
      x,
      y,
      width: backBtnWidth,
      height: backBtnHeight,
      action: () => {
        this.selectedDungeon = null;
      },
    });

    // Nome do dungeon
    drawText(this.ctx, `${dungeon.icon} ${dungeon.name}`, x + width / 2, y + 15, {
      align: 'center',
      font: 'bold 32px monospace',
      color: COLORS.primary.gold,
    });

    // Descrição
    drawText(this.ctx, dungeon.description, x + width / 2, y + 55, {
      align: 'center',
      font: '16px monospace',
      color: COLORS.ui.textDim,
    });

    // Progresso
    const progressText = dungeonProgress.completed 
      ? '✅ Dungeon Completada!' 
      : `Progresso: Andar ${dungeonProgress.currentFloor}/5`;
    drawText(this.ctx, progressText, x + width / 2, y + 85, {
      align: 'center',
      font: 'bold 20px monospace',
      color: dungeonProgress.completed ? COLORS.primary.green : COLORS.primary.purple,
    });

    // Lista de andares
    const floorListY = y + 120;
    const floorHeight = 80;
    const floorSpacing = 10;

    drawText(this.ctx, 'Selecione o Andar:', x, floorListY, {
      font: 'bold 18px monospace',
      color: COLORS.ui.text,
    });

    let currentFloorY = floorListY + 35;

    dungeon.floors.forEach((floor, index) => {
      const floorNum = index + 1;
      const isUnlocked = floorNum <= dungeonProgress.currentFloor;
      const isCleared = floorNum < dungeonProgress.currentFloor || dungeonProgress.completed;
      const staminaCost = calculateStaminaCost(floorNum);
      const canEnter = isUnlocked && stamina >= staminaCost;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, x, currentFloorY, width, floorHeight);

      // Background
      this.ctx.fillStyle = isHovered && canEnter
        ? COLORS.bg.light
        : (isCleared ? 'rgba(72, 187, 120, 0.15)' : COLORS.bg.dark);
      this.ctx.fillRect(x, currentFloorY, width, floorHeight);

      // Borda
      this.ctx.strokeStyle = isCleared 
        ? COLORS.primary.green 
        : (isUnlocked ? COLORS.primary.purple : COLORS.ui.textDim);
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, currentFloorY, width, floorHeight);

      // Número do andar
      const floorIcon = floor.boss ? '👑' : '⚔️';
      drawText(this.ctx, `${floorIcon} Andar ${floorNum}`, x + 15, currentFloorY + 20, {
        font: 'bold 20px monospace',
        color: isUnlocked ? COLORS.ui.text : COLORS.ui.textDim,
      });

      // Nome do andar
      drawText(this.ctx, floor.name, x + 15, currentFloorY + 45, {
        font: '16px monospace',
        color: COLORS.ui.textDim,
      });

      // Inimigos
      const enemyCount = floor.enemies.length + (floor.boss ? 1 : 0);
      drawText(this.ctx, `${enemyCount} inimigos`, x + 15, currentFloorY + 65, {
        font: '14px monospace',
        color: COLORS.ui.textDim,
      });

      // Custo de stamina
      const costColor = stamina >= staminaCost ? COLORS.primary.green : COLORS.ui.error;
      drawText(this.ctx, `⚡ ${staminaCost}`, x + width - 150, currentFloorY + 35, {
        font: 'bold 18px monospace',
        color: costColor,
      });

      // Status
      let statusText = '';
      let statusColor = COLORS.ui.text;

      if (isCleared) {
        statusText = '✅ Completo';
        statusColor = COLORS.primary.green;
      } else if (!isUnlocked) {
        statusText = '🔒 Bloqueado';
        statusColor = COLORS.ui.textDim;
      } else if (!canEnter) {
        statusText = '⚠️ Sem Stamina';
        statusColor = COLORS.ui.error;
      } else {
        statusText = '▶ Entrar';
        statusColor = COLORS.primary.purple;
      }

      drawText(this.ctx, statusText, x + width - 15, currentFloorY + 35, {
        align: 'right',
        font: 'bold 16px monospace',
        color: statusColor,
      });

      // Botão para entrar no andar
      if (canEnter && !isCleared) {
        this.buttons.set(`floor_${floorNum}`, {
          x,
          y: currentFloorY,
          width,
          height: floorHeight,
          action: () => {
            if (this.onEnterDungeon) {
              this.onEnterDungeon(dungeon.id, floorNum);
            }
          },
        });
      }

      currentFloorY += floorHeight + floorSpacing;
    });
  }

  public close() {
    this.selectedDungeon = null;
    this.selectedFloor = 1;
  }
}

