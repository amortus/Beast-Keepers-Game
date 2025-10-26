/**
 * Game Initialization UI
 * Beast Keepers - First time setup after registration
 */

import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { gameApi } from '../api/gameApi';

export class GameInitUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action: () => void }> = new Map();
  
  private playerName: string = '';
  private activeField: boolean = false;
  private errorMessage: string = '';
  private isLoading: boolean = false;

  public onInitComplete: (gameSave: any, initialBeast: any) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check buttons
    this.buttons.forEach((btn) => {
      if (isMouseOver(x, y, btn.x, btn.y, btn.width, btn.height)) {
        btn.action();
      }
    });

    // Check input field
    const panelWidth = 700;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const fieldY = 300;
    const fieldWidth = 600;
    const fieldHeight = 50;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    if (isMouseOver(x, y, fieldX, fieldY, fieldWidth, fieldHeight)) {
      this.activeField = true;
    } else {
      this.activeField = false;
    }
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (!this.activeField) return;

    if (e.key === 'Escape') {
      this.activeField = false;
      return;
    }

    if (e.key === 'Enter') {
      this.handleInitialize();
      return;
    }

    if (e.key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
      return;
    }

    if (e.key.length === 1 && this.playerName.length < 20) {
      this.playerName += e.key;
    }
  }

  private async handleInitialize() {
    if (this.isLoading) return;

    this.errorMessage = '';

    if (!this.playerName || this.playerName.trim().length === 0) {
      this.errorMessage = 'Por favor, digite um nome para seu Guardião';
      return;
    }

    if (this.playerName.trim().length < 3) {
      this.errorMessage = 'Nome deve ter no mínimo 3 caracteres';
      return;
    }

    this.isLoading = true;

    try {
      const response = await gameApi.initializeGame(this.playerName.trim());
      
      if (response.success && response.data) {
        console.log('[GameInit] Game initialized successfully');
        this.onInitComplete(response.data.gameSave, response.data.initialBeast);
      } else {
        this.errorMessage = response.error || 'Erro ao inicializar jogo';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao conectar com servidor';
    } finally {
      this.isLoading = false;
    }
  }

  draw() {
    this.buttons.clear();

    const panelWidth = 700;
    const panelHeight = 500;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.gold
    });

    // Title
    drawText(this.ctx, '🎮 BEM-VINDO, GUARDIÃO!', panelX + panelWidth / 2, panelY + 80, {
      font: 'bold 32px monospace',
      color: COLORS.primary.gold,
      align: 'center'
    });

    // Description
    const lines = [
      'Você está prestes a embarcar em uma jornada épica',
      'em Aurath, o mundo das Bestas místicas.',
      '',
      'Uma Besta será atribuída a você aleatoriamente.',
      'Cuide dela, treine-a e prove seu valor como Guardião!'
    ];

    lines.forEach((line, i) => {
      drawText(this.ctx, line, panelX + panelWidth / 2, panelY + 140 + i * 25, {
        font: '14px monospace',
        color: COLORS.ui.text,
        align: 'center'
      });
    });

    // Input field label
    drawText(this.ctx, 'Digite o nome do seu Guardião:', panelX + panelWidth / 2, panelY + 270, {
      font: '16px monospace',
      color: COLORS.primary.gold,
      align: 'center'
    });

    // Input field
    const fieldWidth = 600;
    const fieldHeight = 50;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;
    const fieldY = 300;

    this.ctx.fillStyle = this.activeField ? '#2a2a3e' : '#1a1a2e';
    this.ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight);

    this.ctx.strokeStyle = this.activeField ? COLORS.primary.gold : COLORS.ui.textDim;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Input text
    drawText(this.ctx, this.playerName || 'Clique para digitar...', fieldX + 15, fieldY + 30, {
      font: 'bold 18px monospace',
      color: this.playerName ? COLORS.ui.text : COLORS.ui.textDim
    });

    // Cursor
    if (this.activeField && Math.floor(Date.now() / 500) % 2 === 0) {
      const textWidth = this.ctx.measureText(this.playerName).width;
      this.ctx.fillStyle = COLORS.primary.gold;
      this.ctx.fillRect(fieldX + 15 + textWidth, fieldY + 15, 3, 25);
    }

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 370, {
        font: '14px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Initialize button
    const initBtnY = panelY + 400;
    const btnText = this.isLoading ? 'Iniciando jogo...' : 'Começar Jornada!';
    drawButton(this.ctx, panelX + 150, initBtnY, 400, 50, btnText, {
      bgColor: COLORS.primary.gold,
      hoverColor: '#d4af37',
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('init', {
        x: panelX + 150,
        y: initBtnY,
        width: 400,
        height: 50,
        action: () => this.handleInitialize()
      });
    }
  }
}

