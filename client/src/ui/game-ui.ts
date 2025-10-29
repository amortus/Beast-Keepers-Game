/**
 * UI Principal do Beast Keepers
 */

import type { GameState, Beast, WeeklyAction, BeastAction } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { getLifePhase, calculateBeastAge } from '../systems/beast';
import { getBeastLineData } from '../data/beasts';
import { getBeastSprite } from '../utils/beast-images';
import { BeastMiniViewer3D } from '../3d/BeastMiniViewer3D';
import { canStartAction, getActionProgress, getActionName as getRealtimeActionName } from '../systems/realtime-actions';
import { formatTime } from '../utils/time-format';

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
  
  // 3D Mini Viewer
  private miniViewer3D: BeastMiniViewer3D | null = null;
  private miniViewer3DContainer: HTMLDivElement | null = null;
  private currentBeastForViewer: Beast | null = null;
  private is3DViewerVisible: boolean = true; // ← Flag para controlar visibilidade
  
  // Public callbacks
  public onView3D: () => void = () => {};

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.gameState = gameState;
    
    this.setupEventListeners();
  }
  
  // Cleanup 3D mini viewer
  private cleanup3DMiniViewer() {
    console.log('[GameUI] Cleanup started...', {
      hasViewer: !!this.miniViewer3D,
      hasContainer: !!this.miniViewer3DContainer
    });
    
    if (this.miniViewer3D) {
      console.log('[GameUI] Disposing viewer...');
      this.miniViewer3D.dispose();
      this.miniViewer3D = null;
    }
    
    if (this.miniViewer3DContainer && this.miniViewer3DContainer.parentNode) {
      console.log('[GameUI] Removing container from DOM...');
      this.miniViewer3DContainer.parentNode.removeChild(this.miniViewer3DContainer);
      this.miniViewer3DContainer = null;
    }
    
    this.currentBeastForViewer = null;
    console.log('[GameUI] ✓ Cleanup complete');
  }
  
  // Call this when UI is destroyed or beast changes significantly
  public dispose() {
    this.cleanup3DMiniViewer();
  }

  // Public method to hide 3D viewer when changing screens
  public hide3DViewer() {
    this.is3DViewerVisible = false;
    if (this.miniViewer3DContainer) {
      this.miniViewer3DContainer.style.display = 'none';
      console.log('[GameUI] 3D viewer hidden');
    }
  }

  // Public method to show 3D viewer when returning to ranch
  public show3DViewer() {
    this.is3DViewerVisible = true;
    if (this.miniViewer3DContainer) {
      this.miniViewer3DContainer.style.display = 'block';
      console.log('[GameUI] 3D viewer shown');
    }
  }

  // Public method to update 3D viewer position (called on window resize)
  public update3DViewerPosition() {
    if (!this.miniViewer3DContainer || !this.is3DViewerVisible || !this.gameState.activeBeast) {
      return;
    }

    // Calculate position based on current canvas size
    const x = 20;
    const y = 105;
    const width = 175;
    const height = 175;

    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;

    const leftPos = canvasRect.left + (x * scaleX);
    const topPos = canvasRect.top + (y * scaleY);
    const containerWidth = width * scaleX;
    const containerHeight = height * scaleY;

    this.miniViewer3DContainer.style.left = `${leftPos}px`;
    this.miniViewer3DContainer.style.top = `${topPos}px`;
    this.miniViewer3DContainer.style.width = `${containerWidth}px`;
    this.miniViewer3DContainer.style.height = `${containerHeight}px`;

    // Also update the Three.js renderer size
    if (this.miniViewer3D) {
      this.miniViewer3D.onResize(containerWidth, containerHeight);
    }

    console.log('[GameUI] 3D viewer position updated on resize:', {
      width: containerWidth,
      height: containerHeight,
      left: leftPos,
      top: topPos
    });
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

    // Logout button (top right, below coronas)
    const logoutBtnX = this.canvas.width - 110;
    const logoutBtnY = 52;
    const logoutBtnWidth = 100;
    const logoutBtnHeight = 26;
    const isLogoutHovered = isMouseOver(this.mouseX, this.mouseY, logoutBtnX, logoutBtnY, logoutBtnWidth, logoutBtnHeight);
    
    drawButton(this.ctx, logoutBtnX, logoutBtnY, logoutBtnWidth, logoutBtnHeight, '🚪 Sair', {
      bgColor: '#e53e3e',
      hoverColor: '#c53030',
      isHovered: isLogoutHovered,
    });

    this.buttons.set('logout', {
      x: logoutBtnX,
      y: logoutBtnY,
      width: logoutBtnWidth,
      height: logoutBtnHeight,
      action: () => this.onLogout(),
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

    // Beast name and line (formatted as "Nome (Linhagem)")
    const lineData = getBeastLineData(beast.line);
    const formattedName = `${beast.name} (${lineData.name})`;
    drawText(this.ctx, formattedName, x + 10, y + 10, {
      font: 'bold 20px monospace',
      color: COLORS.primary.green,
    });

    // Beast "sprite" (placeholder)
    console.log('[GameUI] About to call drawBeastSprite...');
    this.drawBeastSprite(x + width / 2 - 60, y + 80, 120, 120, beast);
    console.log('[GameUI] drawBeastSprite call completed');

    // 3D View button (below sprite)
    const view3DBtnX = x + width / 2 - 75;
    const view3DBtnY = y + 205;
    const view3DBtnWidth = 150;
    const view3DBtnHeight = 30;
    const isView3DHovered = isMouseOver(this.mouseX, this.mouseY, view3DBtnX, view3DBtnY, view3DBtnWidth, view3DBtnHeight);
    
    drawButton(this.ctx, view3DBtnX, view3DBtnY, view3DBtnWidth, view3DBtnHeight, '🎮 Ver em 3D', {
      bgColor: COLORS.primary.blue,
      hoverColor: '#2c5aa0',
      isHovered: isView3DHovered,
    });
    
    this.buttons.set('view3d', {
      x: view3DBtnX,
      y: view3DBtnY,
      width: view3DBtnWidth,
      height: view3DBtnHeight,
      action: () => this.onView3D(),
    });

    // Age and phase
    const phase = getLifePhase(beast);
    const phaseNames = {
      infant: 'Filhote',
      young: 'Jovem',
      adult: 'Adulto',
      mature: 'Maduro',
      elder: 'Idoso',
    };

    drawText(this.ctx, `Idade: ${beast.secondaryStats.age} / ${beast.secondaryStats.maxAge} semanas`, x + 10, y + 250, {
      font: '14px monospace',
      color: COLORS.ui.text,
    });

    drawText(this.ctx, `Fase: ${phaseNames[phase]}`, x + 10, y + 270, {
      font: '14px monospace',
      color: COLORS.ui.info,
    });

    // Mood
    const moodEmoji: Record<string, string> = {
      happy: '😊',
      neutral: '😐',
      sad: '😢',
      angry: '😠',
      tired: '😴',
    };
    
    // CORREÇÃO: Tratar mood undefined
    const mood = beast.mood || 'neutral';
    const moodDisplay = moodEmoji[mood] || moodEmoji.neutral;

    drawText(this.ctx, `Humor: ${moodDisplay}`, x + 10, y + 290, {
      font: '14px monospace',
      color: COLORS.status[mood] || COLORS.status.neutral,
    });

    // HP Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 320,
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
      y + 355,
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
      y + 390,
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
    // Don't create or update 3D viewer if it should be hidden
    if (!this.is3DViewerVisible) {
      // Just draw the border
      this.ctx.strokeStyle = COLORS.primary.purple;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }
    
    // Only create viewer once, not every frame
    if (!this.miniViewer3D || this.currentBeastForViewer?.name !== beast.name) {
      console.log('[GameUI] Creating mini viewer for:', beast.name);
      this.cleanup3DMiniViewer();
      
      // Create container for 3D viewer
      this.miniViewer3DContainer = document.createElement('div');
      this.miniViewer3DContainer.id = 'beast-mini-viewer-3d';
      this.miniViewer3DContainer.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 100;
        background: rgba(106, 61, 122, 0.3);
        border: 2px solid rgba(106, 61, 122, 0.6);
      `;
      
      document.body.appendChild(this.miniViewer3DContainer);
      console.log('[GameUI] ✓ Container created and appended');
      
      // Calculate initial position and size
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const containerWidth = width * scaleX;
      const containerHeight = height * scaleY;
      
      // Create 3D viewer
      try {
        this.miniViewer3D = new BeastMiniViewer3D(
          this.miniViewer3DContainer, 
          beast, 
          containerWidth, 
          containerHeight
        );
        this.currentBeastForViewer = beast;
        console.log('[GameUI] ✓ Viewer created successfully');
      } catch (error) {
        console.error('[GameUI] ❌ Failed:', error);
      }
    }
    
    // Update position every frame (but only if not hidden)
    if (this.miniViewer3DContainer) {
      // Don't update position if viewer is hidden
      if (this.miniViewer3DContainer.style.display === 'none') {
        return;
      }
      
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const leftPos = canvasRect.left + (x * scaleX);
      const topPos = canvasRect.top + (y * scaleY);
      const containerWidth = width * scaleX;
      const containerHeight = height * scaleY;
      
      // Check if size changed and update renderer if needed
      const currentWidth = parseFloat(this.miniViewer3DContainer.style.width || '0');
      const currentHeight = parseFloat(this.miniViewer3DContainer.style.height || '0');
      const sizeChanged = Math.abs(currentWidth - containerWidth) > 1 || Math.abs(currentHeight - containerHeight) > 1;
      
      this.miniViewer3DContainer.style.left = `${leftPos}px`;
      this.miniViewer3DContainer.style.top = `${topPos}px`;
      this.miniViewer3DContainer.style.width = `${containerWidth}px`;
      this.miniViewer3DContainer.style.height = `${containerHeight}px`;
      
      // Update Three.js renderer when size changes
      if (sizeChanged && this.miniViewer3D) {
        this.miniViewer3D.onResize(containerWidth, containerHeight);
      }
    }
    
    // Draw border on canvas
    this.ctx.strokeStyle = COLORS.primary.purple;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);
  }

  private drawBeastFallback(x: number, y: number, width: number, height: number, beast: Beast) {
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
    // CORREÇÃO: Tratar victories e defeats undefined
    const victories = beast.victories ?? 0;
    const defeats = beast.defeats ?? 0;
    drawText(this.ctx, `Vitórias: ${victories} | Derrotas: ${defeats}`, x + 10, yOffset, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });
  }

  private drawActionMenu() {
    if (!this.gameState.activeBeast) return;
    
    const beast = this.gameState.activeBeast;
    const serverTime = this.gameState.serverTime || Date.now();
    
    const x = 20;
    const y = 570;
    const width = this.canvas.width - 40;
    const height = 170;

    drawPanel(this.ctx, x, y, width, height);

    // Se tem ação em progresso, mostrar progresso
    if (beast.currentAction) {
      this.drawActionProgress(beast, serverTime, x, y, width, height);
      return;
    }

    // Se não tem ação, mostrar menu de ações
    drawText(this.ctx, 'AÇÕES DISPONÍVEIS', x + 10, y + 10, {
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
      this.drawActionList(x + 10, y + 95, beast, serverTime);
    } else {
      drawText(this.ctx, 'Selecione uma categoria acima', x + 10, y + 100, {
        font: '16px monospace',
        color: COLORS.ui.textDim,
      });
    }
  }
  
  private drawActionProgress(beast: Beast, serverTime: number, x: number, y: number, width: number, height: number) {
    if (!beast.currentAction) return;
    
    const action = beast.currentAction;
    const progress = getActionProgress(action, serverTime);
    const timeRemaining = Math.max(0, action.completesAt - serverTime);
    
    drawText(this.ctx, '⏳ AÇÃO EM PROGRESSO', x + 10, y + 10, {
      font: 'bold 20px monospace',
      color: COLORS.primary.gold,
    });
    
    // Nome da ação
    drawText(this.ctx, getRealtimeActionName(action.type), x + 10, y + 45, {
      font: 'bold 18px monospace',
      color: COLORS.ui.text,
    });
    
    // Barra de progresso
    const barX = x + 10;
    const barY = y + 75;
    const barWidth = width - 20;
    const barHeight = 30;
    
    // Fundo da barra
    this.ctx.fillStyle = COLORS.bg.dark;
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progresso
    this.ctx.fillStyle = COLORS.primary.green;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Borda
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Texto de progresso
    drawText(this.ctx, `${Math.floor(progress * 100)}%`, barX + barWidth / 2, barY + 18, {
      align: 'center',
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });
    
    // Tempo restante
    drawText(this.ctx, `Tempo restante: ${formatTime(timeRemaining)}`, x + 10, y + 120, {
      font: 'bold 16px monospace',
      color: COLORS.ui.info,
    });
    
    // Botão cancelar
    if (action.canCancel) {
      const cancelBtnX = x + width - 210;
      const cancelBtnY = y + height - 45;
      const cancelBtnWidth = 200;
      const cancelBtnHeight = 35;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, cancelBtnX, cancelBtnY, cancelBtnWidth, cancelBtnHeight);
      
      drawButton(this.ctx, cancelBtnX, cancelBtnY, cancelBtnWidth, cancelBtnHeight, '❌ Cancelar Ação', {
        bgColor: COLORS.ui.error,
        isHovered,
      });
      
      this.buttons.set('cancel_action', {
        x: cancelBtnX,
        y: cancelBtnY,
        width: cancelBtnWidth,
        height: cancelBtnHeight,
        action: () => {
          this.onCancelAction();
        },
      });
    }
  }

  private drawActionList(x: number, y: number, beast: Beast, serverTime: number) {
    const actions = this.getActionsForCategory();
    const buttonWidth = 160;
    const buttonHeight = 35;
    const spacing = 10;

    actions.forEach((action, index) => {
      const buttonX = x + (buttonWidth + spacing) * (index % 4);
      const buttonY = y + Math.floor(index / 4) * (buttonHeight + spacing);
      const isHovered = isMouseOver(this.mouseX, this.mouseY, buttonX, buttonY, buttonWidth, buttonHeight);
      const isSelected = this.selectedAction === action.id;
      
      // Verificar se pode iniciar esta ação
      const canStart = canStartAction(beast, action.id, serverTime);

      drawButton(this.ctx, buttonX, buttonY, buttonWidth, buttonHeight, action.label, {
        bgColor: isSelected ? COLORS.ui.success : COLORS.bg.light,
        isHovered,
        isDisabled: !canStart.can,
      });

      this.buttons.set(`action_${action.id}`, {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          if (canStart.can) {
            this.onStartAction(action.id as BeastAction['type']);
          } else {
            // Mostrar mensagem de erro se não pode iniciar
            console.log('[UI] Cannot start action:', canStart.reason);
          }
        },
      });
      
      // Mostrar cooldown se houver
      if (!canStart.can && canStart.timeRemaining) {
        drawText(this.ctx, formatTime(canStart.timeRemaining), buttonX + buttonWidth / 2, buttonY + buttonHeight + 12, {
          align: 'center',
          font: '10px monospace',
          color: COLORS.ui.error,
        });
      }
    });
  }

  private getActionsForCategory(): Array<{ id: WeeklyAction; label: string }> {
    if (this.actionCategory === 'train') {
      return [
        { id: 'train_might', label: 'Força (2min)' },
        { id: 'train_wit', label: 'Astúcia (2min)' },
        { id: 'train_focus', label: 'Foco (2min)' },
        { id: 'train_agility', label: 'Agilidade (2min)' },
        { id: 'train_ward', label: 'Resistência (2min)' },
        { id: 'train_vitality', label: 'Vitalidade (2min)' },
      ];
    } else if (this.actionCategory === 'work') {
      return [
        { id: 'work_warehouse', label: 'Armazém (10min, 400💰)' },
        { id: 'work_farm', label: 'Fazenda (10min, 350💰)' },
        { id: 'work_guard', label: 'Guarda (10min, 500💰)' },
        { id: 'work_library', label: 'Biblioteca (10min, 350💰)' },
      ];
    } else if (this.actionCategory === 'rest') {
      return [
        { id: 'rest_sleep', label: 'Dormir (4h)' },
        { id: 'rest_freetime', label: 'Tempo Livre (10min)' },
        { id: 'rest_walk', label: 'Passeio (10min)' },
        { id: 'rest_eat', label: 'Comer Bem (10min)' },
      ];
    } else if (this.actionCategory === 'tournament') {
      return [
        { id: 'tournament', label: '🏆 Torneio (4h cooldown)' },
      ];
    }
    return [];
  }

  private drawWeekInfo() {
    if (!this.gameState.activeBeast) return;
    
    const beast = this.gameState.activeBeast;
    const serverTime = this.gameState.serverTime || Date.now();
    
    // CORREÇÃO: Posicionar no canto inferior direito, mas acima dos botões de ação
    // Para evitar sobreposição com "Selecione uma categoria acima"
    const width = 500;
    const height = 50;
    const x = this.canvas.width - width - 20; // 20px de margem da borda
    const y = this.canvas.height - height - 150; // 150px acima da parte inferior para não sobrepor ações

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
    });

    // Mostrar idade da besta em dias
    const ageInfo = calculateBeastAge(beast, serverTime);
    
    drawText(this.ctx, `${beast.name} - ${ageInfo.ageInDays} dias`, x + 10, y + 15, {
      font: 'bold 16px monospace',
      color: COLORS.primary.gold,
    });

    // Mostrar contador de explorações
    const explorationCount = beast.explorationCount || 0;
    drawText(this.ctx, `Explorações: ${explorationCount}/10`, x + 10, y + 35, {
      font: '14px monospace',
      color: explorationCount >= 10 ? COLORS.ui.error : COLORS.ui.success,
    });
    
    // Mostrar cooldown de torneio se ativo
    if (beast.lastTournament) {
      const tournamentCooldown = (beast.lastTournament + (4 * 60 * 60 * 1000)) - serverTime;
      if (tournamentCooldown > 0) {
        drawText(this.ctx, `Torneio: ${formatTime(tournamentCooldown)}`, x + 250, y + 35, {
          font: '14px monospace',
          color: COLORS.ui.error,
        });
      } else {
        drawText(this.ctx, `Torneio: Disponível`, x + 250, y + 35, {
          font: '14px monospace',
          color: COLORS.ui.success,
        });
      }
    }
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
  public onStartAction: (action: BeastAction['type']) => void = () => {};
  public onCancelAction: () => void = () => {};
  public onOpenTemple: () => void = () => {};
  public onOpenVillage: () => void = () => {};
  public onOpenInventory: () => void = () => {};
  public onOpenCraft: () => void = () => {};
  public onOpenQuests: () => void = () => {};
  public onOpenAchievements: () => void = () => {};
  public onOpenExploration: () => void = () => {};
  public onNavigate: (screen: string) => void = () => {};
  public onLogout: () => void = () => {};

  public updateGameState(gameState: GameState) {
    this.gameState = gameState;
  }
}

