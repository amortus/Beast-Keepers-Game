/**
 * UI Principal do Beast Keepers
 */

import type { GameState, Beast, WeeklyAction, BeastAction } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { getLifePhase, calculateBeastAge } from '../systems/beast';
import { getBeastLineData } from '../data/beasts';
import { BeastMiniViewer3D } from '../3d/BeastMiniViewer3D';
import { RanchScene3D } from '../3d/scenes/RanchScene3D';
import { canStartAction, getActionProgress, getActionName as getRealtimeActionName } from '../systems/realtime-actions';
import { formatTime } from '../utils/time-format';

export class GameUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // Completion message state (inline no painel)
  private completionMessage: string | null = null;
  private completionMessageTimeout: number | null = null;
  
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
  
  // 3D Ranch Scene (full PS1 environment)
  private ranchScene3D: RanchScene3D | null = null;
  private ranchScene3DContainer: HTMLDivElement | null = null;
  private useFullRanchScene: boolean = true; // Toggle to use full ranch vs mini viewer
  private lastRealRanchSceneWidth: number = 0; // Cache do tamanho REAL (escalado) para detectar mudança
  private lastRealRanchSceneHeight: number = 0;
  
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
  
  // Cleanup Ranch Scene 3D
  private cleanupRanchScene3D() {
    console.log('[GameUI] Ranch Scene 3D cleanup started...');
    
    if (this.ranchScene3D) {
      console.log('[GameUI] Disposing Ranch Scene 3D...');
      this.ranchScene3D.stopLoop();
      this.ranchScene3D.dispose();
      this.ranchScene3D = null;
    }
    
    if (this.ranchScene3DContainer && this.ranchScene3DContainer.parentNode) {
      console.log('[GameUI] Removing Ranch Scene 3D container from DOM...');
      this.ranchScene3DContainer.parentNode.removeChild(this.ranchScene3DContainer);
      this.ranchScene3DContainer = null;
    }
    
    console.log('[GameUI] ✓ Ranch Scene 3D cleanup complete');
  }
  
  // Create or update Ranch Scene 3D
  private createOrUpdateRanchScene3D(x: number, y: number, width: number, height: number, beast: Beast) {
    // Calculate position based on canvas scale/transform
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;
    
    const realLeft = canvasRect.left + (x * scaleX);
    const realTop = canvasRect.top + (y * scaleY);
    const realWidth = width * scaleX;
    const realHeight = height * scaleY;
    
    // Detecta se tamanho REAL mudou (eficiente, sem overhead)
    const realSizeChanged = (
      Math.abs(realWidth - this.lastRealRanchSceneWidth) > 1 || 
      Math.abs(realHeight - this.lastRealRanchSceneHeight) > 1
    );
    
    // Recreate if: beast changes OR container doesn't exist OR real size changed
    if (!this.ranchScene3D || !this.ranchScene3DContainer || this.currentBeastForViewer?.line !== beast.line || realSizeChanged) {
      this.cleanupRanchScene3D();
      
      // Atualiza cache de tamanho REAL
      this.lastRealRanchSceneWidth = realWidth;
      this.lastRealRanchSceneHeight = realHeight;
      
      // Create container for Ranch Scene 3D
      this.ranchScene3DContainer = document.createElement('div');
      this.ranchScene3DContainer.id = 'ranch-scene-3d-container';
      this.ranchScene3DContainer.style.cssText = `
        position: fixed;
        left: ${realLeft}px;
        top: ${realTop}px;
        width: ${realWidth}px;
        height: ${realHeight}px;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
      `;
      
      // Create canvas for Three.js (usa tamanho REAL escalado)
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${realWidth}px`; // ✅ USA TAMANHO ESCALADO
      canvas.style.height = `${realHeight}px`; // ✅ USA TAMANHO ESCALADO
      canvas.style.display = 'block'; // Remove espaços extras
      this.ranchScene3DContainer.appendChild(canvas);
      
      document.body.appendChild(this.ranchScene3DContainer);
      
      // Create Ranch Scene 3D
      this.ranchScene3D = new RanchScene3D(canvas);
      this.ranchScene3D.setBeast(beast.line);
      this.ranchScene3D.startLoop();
      
      this.currentBeastForViewer = beast;
      
      // ✅ FORÇA resize APÓS layout finalizar (requestAnimationFrame)
      requestAnimationFrame(() => {
        if (this.ranchScene3D) {
          const finalRect = canvas.getBoundingClientRect();
          this.ranchScene3D.resize(finalRect.width, finalRect.height);
        }
      });
    }
    
    // Update container position if canvas was resized
    if (this.ranchScene3DContainer) {
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const realLeft = canvasRect.left + (x * scaleX);
      const realTop = canvasRect.top + (y * scaleY);
      const realWidth = width * scaleX;
      const realHeight = height * scaleY;
      
      this.ranchScene3DContainer.style.left = `${realLeft}px`;
      this.ranchScene3DContainer.style.top = `${realTop}px`;
      this.ranchScene3DContainer.style.width = `${realWidth}px`;
      this.ranchScene3DContainer.style.height = `${realHeight}px`;
    }
  }
  
  // Call this when UI is destroyed or beast changes significantly
  public dispose() {
    this.cleanup3DMiniViewer();
    this.cleanupRanchScene3D();
  }

  // Public method to hide 3D viewer when changing screens
  public hide3DViewer() {
    this.is3DViewerVisible = false;
    
    if (this.miniViewer3DContainer) {
      this.miniViewer3DContainer.style.display = 'none';
      console.log('[GameUI] 3D mini viewer hidden');
    }
    
    if (this.ranchScene3DContainer) {
      this.ranchScene3DContainer.style.display = 'none';
      console.log('[GameUI] Ranch Scene 3D hidden');
    }
  }

  // Public method to show 3D viewer when returning to ranch
  public show3DViewer() {
    this.is3DViewerVisible = true;
    
    if (this.miniViewer3DContainer) {
      this.miniViewer3DContainer.style.display = 'block';
      console.log('[GameUI] 3D mini viewer shown');
    }
    
    if (this.ranchScene3DContainer) {
      this.ranchScene3DContainer.style.display = 'block';
      console.log('[GameUI] Ranch Scene 3D shown');
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

  /**
   * REMOVIDO: Não precisa mais forçar redraw, detecção automática de mudança de tamanho
   */

  public draw() {
    this.buttons.clear();
    
    // Clear canvas (transparente para mostrar 3D)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState.activeBeast) {
      this.drawNoBeastScreen();
      return;
    }

    // Draw sections
    this.drawHeader();
    this.drawBeastDisplay();
    this.drawStatusPanel();
    this.drawActionMenu();
    // Week Info removido - exploração vai para o header
  }

  private drawHeader() {
    const headerHeight = 80;
    drawPanel(this.ctx, 0, 0, this.canvas.width, headerHeight, {
      bgColor: 'rgba(10, 10, 25, 0.95)',
      borderColor: COLORS.primary.purple,
      borderWidth: 2,
    });

    // Title
    drawText(this.ctx, 'BEAST KEEPERS', 20, 18, {
      font: 'bold 24px monospace',
      color: COLORS.primary.gold,
    });

    // Explorações (substituindo info do guardião)
    const beast = this.gameState.activeBeast;
    const explorationCount = beast?.explorationCount || 0;
    drawText(this.ctx, `🗺️ Explorações: ${explorationCount}/10`, 280, 22, {
      font: 'bold 16px monospace',
      color: explorationCount >= 10 ? COLORS.ui.error : COLORS.primary.blue,
    });

    // Money (top right)
    const moneyX = this.canvas.width - 20;
    drawText(this.ctx, `💰 ${this.gameState.economy.coronas} Coronas`, moneyX, 22, {
      font: 'bold 16px monospace',
      color: COLORS.primary.gold,
      align: 'right',
    });

    // Settings button (gear icon) - ao lado do botão Sair
    const settingsBtnWidth = 40;
    const settingsBtnHeight = 26;
    const settingsBtnX = this.canvas.width - 110 - settingsBtnWidth - 10;
    const settingsBtnY = 52;
    const isSettingsHovered = isMouseOver(this.mouseX, this.mouseY, settingsBtnX, settingsBtnY, settingsBtnWidth, settingsBtnHeight);
    
    drawButton(this.ctx, settingsBtnX, settingsBtnY, settingsBtnWidth, settingsBtnHeight, '⚙️', {
      bgColor: '#4a90e2',
      hoverColor: '#357abd',
      isHovered: isSettingsHovered,
    });

    this.buttons.set('settings', {
      x: settingsBtnX,
      y: settingsBtnY,
      width: settingsBtnWidth,
      height: settingsBtnHeight,
      action: () => this.onOpenSettings(),
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
    const btnSpacing = 8; // Reduzido de 10 para 8
    let currentX = 20; // Reduzido de 30 para 20
    
    // Espaço reservado para botão Sair + Settings (direita)
    const rightButtonsWidth = 160; // Settings + Sair
    const rightMargin = 20;

    const menuItems = [
      { id: 'ranch', label: '🏠 Rancho', color: COLORS.primary.green, action: () => this.onNavigate('ranch') },
      { id: 'village', label: '🏘️ Vila', color: COLORS.primary.blue, action: () => this.onOpenVillage() },
      { id: 'inventory', label: '🎒 Inventário', color: COLORS.primary.purple, action: () => this.onOpenInventory() },
      { id: 'arena', label: '🥊 Arena PVP', color: COLORS.primary.red, action: () => this.onOpenArenaPvp() },
      { id: 'exploration', label: '🗺️ Explorar', color: COLORS.primary.blue, action: () => this.onOpenExploration() },
      { id: 'dungeons', label: '⚔️ Dungeons', color: COLORS.primary.purple, action: () => this.onOpenDungeons() },
      { id: 'quests', label: '📜 Missões', color: COLORS.primary.gold, action: () => this.onOpenQuests() },
      { id: 'achievements', label: '🏆 Conquistas', color: COLORS.primary.gold, action: () => this.onOpenAchievements() },
      { id: 'temple', label: '🏛️ Templo', color: COLORS.primary.purple, action: () => this.onOpenTemple() },
    ];

    // Calcular largura disponível (descontando botões da direita)
    const totalItems = menuItems.length;
    const totalSpacing = (totalItems - 1) * btnSpacing;
    const availableWidth = this.canvas.width - currentX - rightButtonsWidth - rightMargin;
    const btnWidth = Math.max(90, Math.floor((availableWidth - totalSpacing) / totalItems)); // Mínimo 90px
    const btnHeight = 26;

    menuItems.forEach((item) => {
      const isHovered = isMouseOver(this.mouseX, this.mouseY, currentX, menuY, btnWidth, btnHeight);

      drawButton(this.ctx, currentX, menuY, btnWidth, btnHeight, item.label, {
        bgColor: item.color,
        isHovered: isHovered,
        fontSize: 11, // Reduzido de padrão para caber melhor
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
    
    // === 3D Ranch: preenche TODO o espaço disponível ===
    const headerHeight = 80; // Mesmo valor do drawHeader()
    const scene3DX = 0;
    const scene3DY = headerHeight; // Começa LOGO APÓS o header
    const scene3DWidth = this.canvas.width - 510; // Até os painéis direitos
    const scene3DHeight = this.canvas.height - headerHeight; // ATÉ O FUNDO (sem Week Info)
    
    // Criar/atualizar Ranch Scene 3D como background
    if (this.is3DViewerVisible && this.useFullRanchScene) {
      this.createOrUpdateRanchScene3D(scene3DX, scene3DY, scene3DWidth, scene3DHeight, beast);
    }
    
    // SEM painel flutuante - info vai para o painel STATUS (direita)

    // Info da besta vai para o painel STATUS (não mais flutuante)
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
    
    // Use full Ranch Scene 3D or mini viewer
    if (this.useFullRanchScene) {
      this.createOrUpdateRanchScene3D(x, y, width, height, beast);
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
    
    // Painel INFO + ATRIBUTOS + STATUS (lado direito - AUMENTADO para mostrar STATUS)
    const headerHeight = 80; // Mesmo valor do drawHeader()
    const x = this.canvas.width - 510;
    const y = headerHeight; // Começa LOGO APÓS o header
    const width = 510;
    const height = 430; // Aumentado de 350 → 430 (+80px para STATUS)

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(10, 10, 25, 0.88)',
      borderColor: COLORS.primary.gold,
      borderWidth: 2,
    });

    // Nome da besta (topo do painel)
    const lineData = getBeastLineData(beast.line);
    const formattedName = `${beast.name} - ${lineData.name}`;
    drawText(this.ctx, formattedName, x + 10, y + 8, {
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
    });
    
    // Info básica em linha
    const phase = getLifePhase(beast);
    const phaseNames = {
      infant: 'Filhote',
      young: 'Jovem',
      adult: 'Adulto',
      mature: 'Maduro',
      elder: 'Idoso',
    };
    
    // Idade em dias (atualizada a cada meia-noite)
    const ageInDays = beast.ageInDays || 0;
    const ageWeeks = Math.floor(ageInDays / 7);
    
    drawText(this.ctx, `${phaseNames[phase]} • Idade: ${ageInDays} dias (${ageWeeks} sem)`, x + 10, y + 30, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });
    
    // Barras HP, Essência, Fadiga (compactas)
    let barY = y + 50;
    drawBar(this.ctx, x + 10, barY, width - 20, 16, beast.currentHp, beast.maxHp, {
      fillColor: COLORS.attributes.vitality,
      label: `HP: ${beast.currentHp}/${beast.maxHp}`,
    });
    
    drawBar(this.ctx, x + 10, barY + 20, width - 20, 16, beast.essence, beast.maxEssence, {
      fillColor: COLORS.primary.purple,
      label: `Essência: ${beast.essence}/${beast.maxEssence}`,
    });
    
    drawBar(this.ctx, x + 10, barY + 40, width - 20, 12, beast.secondaryStats.fatigue, 100, {
      fillColor: COLORS.ui.warning,
      label: `Fadiga: ${beast.secondaryStats.fatigue}`,
    });
    
    // Divisor
    barY += 60;
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, barY);
    this.ctx.lineTo(x + width - 10, barY);
    this.ctx.stroke();
    
    // Título ATRIBUTOS
    barY += 15;
    drawText(this.ctx, 'ATRIBUTOS', x + 10, barY, {
      font: 'bold 16px monospace',
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

    let yOffset = barY + 25;
    const labelWidth = 100;
    const barWidth = 370;
    
    attrs.forEach((attr) => {
      const value = beast.attributes[attr.key as keyof typeof beast.attributes];
      
      drawText(this.ctx, attr.name, x + 10, yOffset, {
        font: '13px monospace',
        color: COLORS.ui.text,
      });

      drawBar(
        this.ctx,
        x + labelWidth + 10,
        yOffset - 3,
        barWidth,
        16,
        value,
        150,
        {
          fillColor: attr.color,
          label: `${value}`,
        }
      );

      yOffset += 24;
    });

    // Divisor
    yOffset += 12;
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, yOffset);
    this.ctx.lineTo(x + width - 10, yOffset);
    this.ctx.stroke();
    
    // STATUS (mais compacto)
    yOffset += 18;
    
    drawText(this.ctx, 'STATUS', x + 10, yOffset, {
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
    });
    
    yOffset += 30;

    // Grid de 2 colunas para stats
    const col1X = x + 10;
    const col2X = x + 240;
    
    drawText(this.ctx, `Stress: ${beast.secondaryStats.stress}`, col1X, yOffset, {
      font: '14px monospace',
      color: beast.secondaryStats.stress > 70 ? COLORS.ui.error : COLORS.ui.text,
    });

    drawText(this.ctx, `Lealdade: ${beast.secondaryStats.loyalty}`, col2X, yOffset, {
      font: '14px monospace',
      color: COLORS.ui.info,
    });
    
    yOffset += 25;

    // CORREÇÃO: Tratar victories e defeats undefined
    const victories = beast.victories ?? 0;
    const defeats = beast.defeats ?? 0;
    
    drawText(this.ctx, `Vitórias: ${victories}`, col1X, yOffset, {
      font: '14px monospace',
      color: COLORS.ui.success,
    });
    
    drawText(this.ctx, `Derrotas: ${defeats}`, col2X, yOffset, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });
  }

  private drawActionMenu() {
    if (!this.gameState.activeBeast) return;
    
    const beast = this.gameState.activeBeast;
    // Usar Date.now() para progresso em tempo real
    const serverTime = Date.now();
    
    // Painel AÇÕES - lado direito, abaixo do STATUS (ATÉ O FUNDO)
    const headerHeight = 80;
    const x = this.canvas.width - 510;
    const y = headerHeight + 435; // Logo após STATUS (80 + 430 + 5 gap)
    const width = 510;
    const height = this.canvas.height - y; // ATÉ O FUNDO (sem Week Info)

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(10, 10, 25, 0.88)',
      borderColor: COLORS.primary.gold,
      borderWidth: 2,
    });

    // Se tem ação em progresso, verificar se já completou
    if (beast.currentAction) {
      // Se a ação já completou (100%), disparar callback de completude
      if (serverTime >= beast.currentAction.completesAt) {
        // Disparar completude automaticamente
        if (this.onCompleteAction) {
          this.onCompleteAction();
        }
        // Não mostrar mais o progresso, voltar ao menu
      } else {
        // Ação ainda em andamento, mostrar progresso
        this.drawActionProgress(beast, serverTime, x, y, width, height);
        return;
      }
    }

    // Se não tem ação, mostrar menu de ações
    drawText(this.ctx, 'AÇÕES DISPONÍVEIS', x + 10, y + 8, {
      font: 'bold 16px monospace',
      color: COLORS.primary.gold,
    });

    // Category buttons (2x2 grid MENOR)
    const buttonWidth = 220;
    const buttonHeight = 36; // Reduzido de 45 → 36px
    const buttonStartX = x + 10;
    const buttonStartY = y + 32; // Ajustado de 38 → 32px
    const buttonSpacingX = 230;
    const buttonSpacingY = 42; // Reduzido de 52 → 42px

    // Grid 2x2 de botões de categoria (sem Torneio)
    const categories = [
      { id: 'train', label: '🏋️ Treinar', row: 0, col: 0 },
      { id: 'work', label: '💼 Trabalhar', row: 0, col: 1 },
      { id: 'rest', label: '😴 Descansar', row: 1, col: 0 },
    ];

    categories.forEach((cat) => {
      const btnX = buttonStartX + (cat.col * buttonSpacingX);
      const btnY = buttonStartY + (cat.row * buttonSpacingY);
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, buttonWidth, buttonHeight);
      const isSelected = this.actionCategory === cat.id;

      drawButton(this.ctx, btnX, btnY, buttonWidth, buttonHeight, cat.label, {
        bgColor: isSelected ? COLORS.primary.purpleDark : COLORS.primary.purple,
        isHovered,
      });

      this.buttons.set(`category_${cat.id}`, {
        x: btnX,
        y: btnY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          this.actionCategory = cat.id as any;
          this.selectedAction = null;
        },
      });
    });
    
    // Mensagem "Em Desenvolvimento" onde ficava o botão de Torneio
    const devMsgX = buttonStartX + buttonSpacingX; // Coluna da direita
    const devMsgY = buttonStartY + buttonSpacingY; // Linha de baixo
    
    drawText(this.ctx, '🏆 Torneio', devMsgX + buttonWidth / 2, devMsgY + 8, {
      font: 'bold 14px monospace',
      color: COLORS.ui.textDim,
      align: 'center',
    });
    
    drawText(this.ctx, 'Em Desenvolvimento', devMsgX + buttonWidth / 2, devMsgY + 26, {
      font: '12px monospace',
      color: COLORS.ui.warning,
      align: 'center',
    });

    // Show actions for selected category
    if (this.actionCategory) {
      this.drawActionList(x + 10, y + 120, beast, serverTime); // Ajustado de 150 → 120px
    }
  }
  
  private drawActionProgress(beast: Beast, serverTime: number, x: number, y: number, width: number, height: number) {
    // Se tem mensagem de completude, mostrar ela no lugar do progresso
    if (this.completionMessage) {
      drawText(this.ctx, '✅ AÇÃO COMPLETA', x + 10, y + 10, {
        font: 'bold 20px monospace',
        color: COLORS.primary.green,
      });
      
      // Mensagem com quebra de linha automática
      const messageLines = this.completionMessage.split('\n');
      messageLines.forEach((line, index) => {
        drawText(this.ctx, line, x + 10, y + 50 + (index * 25), {
          font: 'bold 16px monospace',
          color: COLORS.ui.text,
        });
      });
      
      return;
    }
    
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
    
    // Layout 2 colunas (botões MAIORES para melhor leitura)
    const buttonWidth = 238; // Aumentado de 235 → 238px (quase preenche)
    const buttonHeight = 42; // Aumentado de 38 → 42px (mais alto)
    const spacingX = 8; // Reduzido de 10 → 8px
    const spacingY = 6; // Reduzido de 8 → 6px (mais compacto verticalmente)
    const columns = 2; // 2 colunas

    actions.forEach((action, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const buttonX = x + col * (buttonWidth + spacingX);
      const buttonY = y + row * (buttonHeight + spacingY);
      const isHovered = isMouseOver(this.mouseX, this.mouseY, buttonX, buttonY, buttonWidth, buttonHeight);
      const isSelected = this.selectedAction === action.id;
      
      // Verificar se pode iniciar esta ação
      const canStart = canStartAction(beast, action.id, serverTime);

      drawButton(this.ctx, buttonX, buttonY, buttonWidth, buttonHeight, action.label, {
        bgColor: isSelected ? COLORS.ui.success : COLORS.bg.light,
        isHovered,
        isDisabled: !canStart.can,
        fontSize: 13, // ✅ Aumentado de 12 → 13px (mais legível)
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
        { id: 'work_warehouse', label: 'Armazém (1.5min, 400💰)' },
        { id: 'work_farm', label: 'Fazenda (1.5min, 350💰)' },
        { id: 'work_guard', label: 'Guarda (1.5min, 500💰)' },
        { id: 'work_library', label: 'Biblioteca (1.5min, 350💰)' },
      ];
    } else if (this.actionCategory === 'rest') {
      return [
        { id: 'rest_sleep', label: 'Dormir (2min)' },
        { id: 'rest_freetime', label: 'Tempo Livre (1min)' },
        { id: 'rest_walk', label: 'Passeio (1min)' },
        { id: 'rest_eat', label: 'Comer Bem (1min)' },
      ];
    }
    // Tournament removido - em desenvolvimento
    return [];
  }

  // REMOVIDO: Week Info agora está no header como "Explorações"
  private drawWeekInfo_DEPRECATED() {
    if (!this.gameState.activeBeast) return;
    
    const beast = this.gameState.activeBeast;
    const serverTime = this.gameState.serverTime || Date.now();
    
    // Week Info - embaixo de AÇÕES
    const headerHeight = 80;
    const x = this.canvas.width - 510;
    const y = headerHeight + 435 + 215; // Logo após AÇÕES (80 + 430 + 5 + 210 + 5)
    const width = 510;
    const height = 60;

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(10, 10, 25, 0.88)',
      borderColor: COLORS.primary.gold,
      borderWidth: 2,
    });

    // Info em 2 linhas (mais legível)
    const ageInfo = calculateBeastAge(beast, serverTime);
    const explorationCount = beast.explorationCount || 0;
    
    drawText(this.ctx, `${beast.name} - ${ageInfo.ageInDays} dias`, x + 10, y + 10, {
      font: 'bold 14px monospace',
      color: COLORS.primary.gold,
    });
    
    drawText(this.ctx, `Explorações: ${explorationCount}/10`, x + 10, y + 35, {
      font: '13px monospace',
      color: explorationCount >= 10 ? COLORS.ui.error : COLORS.ui.success,
    });
    
    // Torneio removido - feature em desenvolvimento
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
  
  /**
   * Mostra mensagem de ação completa inline no painel por 3 segundos
   */
  public showCompletionMessage(message: string) {
    // Limpar timeout anterior se existir
    if (this.completionMessageTimeout) {
      clearTimeout(this.completionMessageTimeout);
    }
    
    this.completionMessage = message;
    
    // Remover mensagem após 3 segundos
    this.completionMessageTimeout = window.setTimeout(() => {
      this.completionMessage = null;
      this.completionMessageTimeout = null;
    }, 3000);
  }

  // Callbacks
  public onAdvanceWeek: (action: WeeklyAction) => void = () => {};
  public onStartAction: (action: BeastAction['type']) => void = () => {};
  public onCancelAction: () => void = () => {};
  public onCompleteAction?: () => void; // Callback quando ação completa
  public onOpenTemple: () => void = () => {};
  public onOpenVillage: () => void = () => {};
  public onOpenInventory: () => void = () => {};
  public onOpenCraft: () => void = () => {};
  public onOpenArenaPvp: () => void = () => {};
  public onOpenDungeons: () => void = () => {};
  public onOpenQuests: () => void = () => {};
  public onOpenAchievements: () => void = () => {};
  public onOpenExploration: () => void = () => {};
  public onNavigate: (screen: string) => void = () => {};
  public onOpenSettings: () => void = () => {};
  public onLogout: () => void = () => {};

  public updateGameState(gameState: GameState) {
    this.gameState = gameState;
  }
}

