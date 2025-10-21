/**
 * UI Principal do Beast Keepers
 */

import type { GameState, Beast, WeeklyAction } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { getLifePhase } from '../systems/beast';
import { getBeastLineData } from '../data/beasts';

export class GameUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // UI state
  private selectedAction: WeeklyAction | null = null;
  private actionCategory: 'train' | 'work' | 'rest' | 'tournament' | null = null;
  
  // Button positions
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.gameState = gameState;
    
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
    // Check button clicks
    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        if (button.action) {
          button.action();
        }
      }
    });
  }

  public draw() {
    this.buttons.clear();
    
    // Clear
    this.ctx.fillStyle = COLORS.bg.dark;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState.activeBeast) {
      this.drawNoBeastScreen();
      return;
    }

    // Draw sections
    this.drawHeader();
    this.drawBeastDisplay();
    this.drawStatusPanel();
    this.drawActionMenu();
    this.drawWeekInfo();
  }

  private drawHeader() {
    const headerHeight = 80;
    drawPanel(this.ctx, 0, 0, this.canvas.width, headerHeight, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.purple,
    });

    // Title
    drawText(this.ctx, 'BEAST KEEPERS', 20, 18, {
      font: 'bold 24px monospace',
      color: COLORS.primary.gold,
    });

    // Guardian info (center-left)
    const guardian = this.gameState.guardian;
    drawText(this.ctx, `Guardião: ${guardian.name} - ${guardian.title}`, 280, 22, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });

    // Money (top right)
    const moneyX = this.canvas.width - 20;
    drawText(this.ctx, `💰 ${this.gameState.economy.coronas} Coronas`, moneyX, 22, {
      font: 'bold 16px monospace',
      color: COLORS.primary.gold,
      align: 'right',
    });

    // Menu de navegação global
    this.drawGlobalMenu();
  }

  private drawGlobalMenu() {
    const menuY = 52;
    const btnWidth = 130;
    const btnHeight = 26;
    const btnSpacing = 10;
    let currentX = 30;

    const menuItems = [
      { id: 'ranch', label: '🏠 Rancho', color: COLORS.primary.green, action: () => this.onNavigate('ranch') },
      { id: 'village', label: '🏘️ Vila', color: COLORS.primary.blue, action: () => this.onOpenVillage() },
      { id: 'inventory', label: '🎒 Inventário', color: COLORS.primary.purple, action: () => this.onOpenInventory() },
      { id: 'craft', label: '⚗️ Craft', color: COLORS.primary.green, action: () => this.onOpenCraft() },
      { id: 'exploration', label: '🗺️ Explorar', color: COLORS.primary.blue, action: () => this.onOpenExploration() },
      { id: 'quests', label: '📜 Missões', color: COLORS.primary.gold, action: () => this.onOpenQuests() },
      { id: 'achievements', label: '🏆 Conquistas', color: COLORS.primary.gold, action: () => this.onOpenAchievements() },
      { id: 'temple', label: '🏛️ Templo', color: COLORS.primary.purple, action: () => this.onOpenTemple() },
    ];

    menuItems.forEach((item) => {
      const isHovered = isMouseOver(this.mouseX, this.mouseY, currentX, menuY, btnWidth, btnHeight);

      drawButton(this.ctx, currentX, menuY, btnWidth, btnHeight, item.label, {
        bgColor: item.color,
        isHovered: isHovered,
      });

      this.buttons.set(item.id, {
        x: currentX,
        y: menuY,
        width: btnWidth,
        height: btnHeight,
        action: item.action,
      });

      currentX += btnWidth + btnSpacing;
    });
  }

  private drawBeastDisplay() {
    const beast = this.gameState.activeBeast!;
    const x = 20;
    const y = 100;
    const width = 450;
    const height = 450;

    drawPanel(this.ctx, x, y, width, height);

    // Beast name and line
    const lineData = getBeastLineData(beast.line);
    drawText(this.ctx, beast.name, x + 10, y + 10, {
      font: 'bold 24px monospace',
      color: COLORS.primary.green,
    });

    drawText(this.ctx, lineData.name, x + 10, y + 38, {
      font: '16px monospace',
      color: COLORS.ui.textDim,
    });

    // Beast "sprite" (placeholder)
    this.drawBeastSprite(x + width / 2 - 60, y + 80, 120, 120, beast);

    // Age and phase
    const phase = getLifePhase(beast);
    const phaseNames = {
      infant: 'Filhote',
      young: 'Jovem',
      adult: 'Adulto',
      mature: 'Maduro',
      elder: 'Idoso',
    };

    drawText(this.ctx, `Idade: ${beast.secondaryStats.age} / ${beast.secondaryStats.maxAge} semanas`, x + 10, y + 220, {
      font: '14px monospace',
      color: COLORS.ui.text,
    });

    drawText(this.ctx, `Fase: ${phaseNames[phase]}`, x + 10, y + 240, {
      font: '14px monospace',
      color: COLORS.ui.info,
    });

    // Mood
    const moodEmoji = {
      happy: '😊',
      neutral: '😐',
      sad: '😢',
      angry: '😠',
      tired: '😴',
    };

    drawText(this.ctx, `Humor: ${moodEmoji[beast.mood]}`, x + 10, y + 260, {
      font: '14px monospace',
      color: COLORS.status[beast.mood],
    });

    // HP Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 290,
      width - 20,
      25,
      beast.currentHp,
      beast.maxHp,
      {
        fillColor: COLORS.attributes.vitality,
        label: `HP: ${beast.currentHp} / ${beast.maxHp}`,
      }
    );

    // Essence Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 325,
      width - 20,
      25,
      beast.essence,
      beast.maxEssence,
      {
        fillColor: COLORS.primary.purple,
        label: `Essência: ${beast.essence} / ${beast.maxEssence}`,
      }
    );

    // Fatigue Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 360,
      width - 20,
      15,
      beast.secondaryStats.fatigue,
      100,
      {
        fillColor: COLORS.ui.warning,
        label: `Fadiga: ${beast.secondaryStats.fatigue}`,
      }
    );
  }

  private drawBeastSprite(x: number, y: number, width: number, height: number, beast: Beast) {
    // Placeholder: colored rectangle representing the beast
    const lineColors: Record<string, string> = {
      olgrim: '#9f7aea',
      terravox: '#8b7355',
      feralis: '#48bb78',
      brontis: '#38a169',
      zephyra: '#63b3ed',
      ignar: '#fc8181',
      mirella: '#4299e1',
      umbrix: '#2d3748',
      sylphid: '#fbbf24',
      raukor: '#a0aec0',
    };

    const color = lineColors[beast.line] || COLORS.primary.green;

    // Body
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = COLORS.ui.text;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);

    // "Eyes" to indicate it's alive
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 30, y + 30, 15, 15);
    this.ctx.fillRect(x + width - 45, y + 30, 15, 15);
  }

  private drawStatusPanel() {
    const beast = this.gameState.activeBeast!;
    const x = 490;
    const y = 100;
    const width = 890;
    const height = 450;

    drawPanel(this.ctx, x, y, width, height);

    drawText(this.ctx, 'ATRIBUTOS', x + 10, y + 10, {
      font: 'bold 20px monospace',
      color: COLORS.primary.gold,
    });

    const attrs = [
      { key: 'might', name: 'Força', color: COLORS.attributes.might },
      { key: 'wit', name: 'Astúcia', color: COLORS.attributes.wit },
      { key: 'focus', name: 'Foco', color: COLORS.attributes.focus },
      { key: 'agility', name: 'Agilidade', color: COLORS.attributes.agility },
      { key: 'ward', name: 'Resistência', color: COLORS.attributes.ward },
      { key: 'vitality', name: 'Vitalidade', color: COLORS.attributes.vitality },
    ];

    let yOffset = y + 45;
    attrs.forEach((attr) => {
      const value = beast.attributes[attr.key as keyof typeof beast.attributes];
      
      drawText(this.ctx, attr.name, x + 10, yOffset, {
        font: '16px monospace',
        color: COLORS.ui.text,
      });

      drawBar(
        this.ctx,
        x + 200,
        yOffset,
        650,
        25,
        value,
        150,
        {
          fillColor: attr.color,
          label: `${value}`,
        }
      );

      yOffset += 35;
    });

    // Stats secundários
    yOffset += 20;
    drawText(this.ctx, 'STATUS', x + 10, yOffset, {
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
    });

    yOffset += 30;
    drawText(this.ctx, `Stress: ${beast.secondaryStats.stress}`, x + 10, yOffset, {
      font: '14px monospace',
      color: beast.secondaryStats.stress > 70 ? COLORS.ui.error : COLORS.ui.text,
    });

    yOffset += 25;
    drawText(this.ctx, `Lealdade: ${beast.secondaryStats.loyalty}`, x + 10, yOffset, {
      font: '14px monospace',
      color: COLORS.ui.info,
    });

    yOffset += 25;
    drawText(this.ctx, `Vitórias: ${beast.victories} | Derrotas: ${beast.defeats}`, x + 10, yOffset, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });
  }

  private drawActionMenu() {
    const x = 20;
    const y = 570;
    const width = this.canvas.width - 40;
    const height = 170;

    drawPanel(this.ctx, x, y, width, height);

    drawText(this.ctx, 'AÇÕES SEMANAIS', x + 10, y + 10, {
      font: 'bold 20px monospace',
      color: COLORS.primary.gold,
    });

    // Category buttons
    const buttonWidth = 155;
    const buttonHeight = 40;
    const buttonY = y + 45;
    const buttonSpacing = 165;

    const categories = [
      { id: 'train', label: '🏋️ Treinar', x: x + 10 },
      { id: 'work', label: '💼 Trabalhar', x: x + 10 + buttonSpacing },
      { id: 'rest', label: '😴 Descansar', x: x + 10 + buttonSpacing * 2 },
      { id: 'tournament', label: '🏆 Torneio', x: x + 10 + buttonSpacing * 3 },
    ];

    categories.forEach((cat) => {
      const isHovered = isMouseOver(this.mouseX, this.mouseY, cat.x, buttonY, buttonWidth, buttonHeight);
      const isSelected = this.actionCategory === cat.id;

      drawButton(this.ctx, cat.x, buttonY, buttonWidth, buttonHeight, cat.label, {
        bgColor: isSelected ? COLORS.primary.purpleDark : COLORS.primary.purple,
        isHovered,
      });

      this.buttons.set(`category_${cat.id}`, {
        x: cat.x,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          this.actionCategory = cat.id as any;
          this.selectedAction = null;
        },
      });
    });

    // Show actions for selected category
    if (this.actionCategory) {
      this.drawActionList(x + 10, y + 95);
    } else {
      drawText(this.ctx, 'Selecione uma categoria acima', x + 10, y + 100, {
        font: '16px monospace',
        color: COLORS.ui.textDim,
      });
    }
  }

  private drawActionList(x: number, y: number) {
    const actions = this.getActionsForCategory();
    const buttonWidth = 160;
    const buttonHeight = 35;
    const spacing = 10;

    actions.forEach((action, index) => {
      const buttonX = x + (buttonWidth + spacing) * (index % 4);
      const buttonY = y + Math.floor(index / 4) * (buttonHeight + spacing);
      const isHovered = isMouseOver(this.mouseX, this.mouseY, buttonX, buttonY, buttonWidth, buttonHeight);
      const isSelected = this.selectedAction === action.id;

      drawButton(this.ctx, buttonX, buttonY, buttonWidth, buttonHeight, action.label, {
        bgColor: isSelected ? COLORS.ui.success : COLORS.bg.light,
        isHovered,
      });

      this.buttons.set(`action_${action.id}`, {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          this.selectedAction = action.id;
        },
      });
    });
  }

  private getActionsForCategory(): Array<{ id: WeeklyAction; label: string }> {
    if (this.actionCategory === 'train') {
      return [
        { id: 'train_might', label: 'Força' },
        { id: 'train_wit', label: 'Astúcia' },
        { id: 'train_focus', label: 'Foco' },
        { id: 'train_agility', label: 'Agilidade' },
        { id: 'train_ward', label: 'Resistência' },
        { id: 'train_vitality', label: 'Vitalidade' },
      ];
    } else if (this.actionCategory === 'work') {
      return [
        { id: 'work_warehouse', label: 'Armazém (300💰)' },
        { id: 'work_farm', label: 'Fazenda (400💰)' },
        { id: 'work_guard', label: 'Guarda (500💰)' },
        { id: 'work_library', label: 'Biblioteca (350💰)' },
      ];
    } else if (this.actionCategory === 'rest') {
      return [
        { id: 'rest_sleep', label: 'Dormir' },
        { id: 'rest_freetime', label: 'Tempo Livre' },
        { id: 'rest_walk', label: 'Passeio' },
        { id: 'rest_eat', label: 'Comer Bem' },
      ];
    } else if (this.actionCategory === 'tournament') {
      return [
        { id: 'tournament', label: '🏆 Entrar em Torneio' },
      ];
    }
    return [];
  }

  private drawWeekInfo() {
    const x = 20;
    const y = this.canvas.height - 60;
    const width = 500;
    const height = 50;

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
    });

    drawText(this.ctx, `Semana ${this.gameState.currentWeek} - Ano ${this.gameState.year}`, x + 10, y + 15, {
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
    });

    if (this.selectedAction) {
      drawText(this.ctx, `Ação selecionada: ${this.getActionName(this.selectedAction)}`, x + 10, y + 35, {
        font: '14px monospace',
        color: COLORS.ui.success,
      });
    }

    // Advance week button
    const buttonX = this.canvas.width - 220;
    const buttonY = y;
    const buttonWidth = 200;
    const buttonHeight = 50;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, buttonX, buttonY, buttonWidth, buttonHeight);
    const isDisabled = !this.selectedAction;

    drawButton(this.ctx, buttonX, buttonY, buttonWidth, buttonHeight, '⏩ Avançar Semana', {
      bgColor: COLORS.ui.success,
      isHovered,
      isDisabled,
    });

    this.buttons.set('advance_week', {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: () => {
        if (this.selectedAction) {
          this.onAdvanceWeek(this.selectedAction);
        }
      },
    });
  }

  private getActionName(action: WeeklyAction): string {
    const names: Record<WeeklyAction, string> = {
      train_might: 'Treinar Força',
      train_wit: 'Treinar Astúcia',
      train_focus: 'Treinar Foco',
      train_agility: 'Treinar Agilidade',
      train_ward: 'Treinar Resistência',
      train_vitality: 'Treinar Vitalidade',
      work_warehouse: 'Trabalhar no Armazém',
      work_farm: 'Trabalhar na Fazenda',
      work_guard: 'Trabalhar como Guarda',
      work_library: 'Trabalhar na Biblioteca',
      rest_sleep: 'Dormir',
      rest_freetime: 'Tempo Livre',
      rest_walk: 'Passear',
      rest_eat: 'Comer Bem',
      tournament: 'Torneio',
      exploration: 'Exploração',
    };
    return names[action] || action;
  }

  private drawNoBeastScreen() {
    drawText(this.ctx, 'Nenhuma besta ativa!', this.canvas.width / 2, this.canvas.height / 2, {
      align: 'center',
      font: 'bold 24px monospace',
      color: COLORS.ui.error,
    });
  }

  // Callbacks
  public onAdvanceWeek: (action: WeeklyAction) => void = () => {};
  public onOpenTemple: () => void = () => {};
  public onOpenVillage: () => void = () => {};
  public onOpenInventory: () => void = () => {};
  public onOpenCraft: () => void = () => {};
  public onOpenQuests: () => void = () => {};
  public onOpenAchievements: () => void = () => {};
  public onOpenExploration: () => void = () => {};
  public onNavigate: (screen: string) => void = () => {};

  public updateGameState(gameState: GameState) {
    this.gameState = gameState;
  }
}

