/**
 * UI de Arena PVP
 * Tela principal para todas as funcionalidades PVP
 */

import type { GameState, Beast } from '../types';
import { COLORS } from './colors';
import { GLASS_THEME } from './theme';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { PvpMatchmakingUI } from './pvp-matchmaking-ui';
import { PvpRankingUI } from './pvp-ranking-ui';
import { PvpChallengeUI } from './pvp-challenge-ui';

export class PvpArenaUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  // Sub-UIs
  private matchmakingUI: PvpMatchmakingUI | null = null;
  private rankingUI: PvpRankingUI | null = null;
  private challengeUI: PvpChallengeUI | null = null;

  // State
  public currentView: 'main' | 'matchmaking' | 'ranking' | 'challenges' = 'main';

  public onClose: (() => void) | null = null;
  public onMatchFound: ((matchId: number, opponent: { userId: number; beastId: number }, matchType: 'ranked' | 'casual') => Promise<void>) | null = null;
  public onChallengeAccepted: ((matchId: number) => Promise<void>) | null = null;

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

  public show(gameState: GameState) {
    this.currentView = 'main';
    
    // Inicializar sub-UIs se necessário
    if (!this.matchmakingUI) {
      this.matchmakingUI = new PvpMatchmakingUI();
      this.matchmakingUI.onMatchFound = async (matchId, opponent, matchType) => {
        if (this.onMatchFound) {
          await this.onMatchFound(matchId, opponent, matchType);
        }
      };
    }
    
    if (!this.rankingUI) {
      this.rankingUI = new PvpRankingUI();
    }
    
    if (!this.challengeUI && gameState.activeBeast) {
      this.challengeUI = new PvpChallengeUI();
      this.challengeUI.onChallengeAccepted = async (matchId) => {
        if (this.onChallengeAccepted) {
          await this.onChallengeAccepted(matchId);
        }
      };
    }
  }

  public hide() {
    this.currentView = 'main';
    // Ocultar todas as sub-UIs
    if (this.matchmakingUI) {
      this.matchmakingUI.hide();
      // Garantir que o elemento HTML também seja ocultado
      const container = document.getElementById('pvp-matchmaking-container');
      if (container) {
        container.style.display = 'none';
      }
    }
    if (this.rankingUI) {
      this.rankingUI.hide();
      // Garantir que o elemento HTML também seja ocultado
      const container = document.getElementById('pvp-ranking-container');
      if (container) {
        container.style.display = 'none';
      }
    }
    if (this.challengeUI) {
      this.challengeUI.hide();
      // Garantir que o elemento HTML também seja ocultado
      const container = document.getElementById('pvp-challenge-container');
      if (container) {
        container.style.display = 'none';
      }
    }
  }

  public draw(gameState: GameState) {
    this.buttons.clear();

    // Fundo semi-transparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentView === 'matchmaking' && this.matchmakingUI) {
      // Ocultar outras UIs
      if (this.rankingUI) this.rankingUI.hide();
      if (this.challengeUI) this.challengeUI.hide();
      
      this.matchmakingUI.show(gameState.activeBeast!);
      return;
    }

    if (this.currentView === 'ranking' && this.rankingUI) {
      // Ocultar outras UIs
      if (this.matchmakingUI) this.matchmakingUI.hide();
      if (this.challengeUI) this.challengeUI.hide();
      
      this.rankingUI.show();
      return;
    }

    if (this.currentView === 'challenges' && this.challengeUI && gameState.activeBeast) {
      // Ocultar outras UIs
      if (this.matchmakingUI) this.matchmakingUI.hide();
      if (this.rankingUI) this.rankingUI.hide();
      
      this.challengeUI.show(gameState.activeBeast);
      return;
    }

    // Tela principal - ocultar todas as sub-UIs
    if (this.matchmakingUI) this.matchmakingUI.hide();
    if (this.rankingUI) this.rankingUI.hide();
    if (this.challengeUI) this.challengeUI.hide();

    // Tela principal
    this.drawMainMenu(gameState);
  }

  private drawMainMenu(gameState: GameState) {
    // Painel principal
    const panelWidth = Math.min(1000, this.canvas.width - 60);
    const panelHeight = Math.min(650, this.canvas.height - 60);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.purple,
    });

    // Header
    drawText(this.ctx, '⚔️ Arena PVP', panelX + 20, panelY + 30, {
      font: 'bold 36px monospace',
      color: COLORS.primary.purple,
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
        this.hide();
        if (this.onClose) this.onClose();
      },
    });

    // Cards de opções
    const cardWidth = 280;
    const cardHeight = 180;
    const startX = panelX + 40;
    const startY = panelY + 100;
    const spacing = 30;
    const perRow = 3;

    const options = [
      {
        id: 'matchmaking',
        title: '⚔️ Matchmaking',
        description: 'Buscar partidas rankeadas ou casuais',
        color: COLORS.primary.purple,
        icon: '⚔️',
      },
      {
        id: 'ranking',
        title: '🏆 Ranking',
        description: 'Ver leaderboard e seu ranking',
        color: COLORS.primary.gold,
        icon: '🏆',
      },
      {
        id: 'challenges',
        title: '🎯 Desafios',
        description: 'Desafiar amigos ou jogadores',
        color: COLORS.primary.green,
        icon: '🎯',
      },
    ];

    options.forEach((option, index) => {
      const col = index % perRow;
      const row = Math.floor(index / perRow);
      const x = startX + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);

      const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, cardWidth, cardHeight);

      // Card background
      this.ctx.fillStyle = isHovered 
        ? `rgba(${option.color.r}, ${option.color.g}, ${option.color.b}, 0.3)`
        : `rgba(${option.color.r}, ${option.color.g}, ${option.color.b}, 0.15)`;
      this.ctx.fillRect(x, y, cardWidth, cardHeight);

      // Border
      this.ctx.strokeStyle = option.color.hex;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, cardWidth, cardHeight);

      // Icon and title
      drawText(this.ctx, option.icon, x + cardWidth / 2, y + 40, {
        align: 'center',
        font: 'bold 48px monospace',
        color: option.color.hex,
      });

      drawText(this.ctx, option.title, x + cardWidth / 2, y + 90, {
        align: 'center',
        font: 'bold 20px monospace',
        color: COLORS.ui.text,
      });

      // Description
      drawText(this.ctx, option.description, x + cardWidth / 2, y + 120, {
        align: 'center',
        font: '14px monospace',
        color: COLORS.ui.textDim,
      });

      this.buttons.set(option.id, {
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        action: () => {
          this.currentView = option.id as any;
        },
      });
    });

    // Informações da beast ativa
    if (gameState.activeBeast) {
      const beast = gameState.activeBeast;
      const infoY = panelY + panelHeight - 80;
      
      drawText(this.ctx, `Beast Ativa: ${beast.name}`, panelX + 20, infoY, {
        font: '16px monospace',
        color: COLORS.ui.text,
      });

      drawText(this.ctx, `Nível ${beast.level || 1} | HP ${beast.currentHp}/${beast.maxHp}`, panelX + 20, infoY + 25, {
        font: '14px monospace',
        color: COLORS.ui.textDim,
      });
    } else {
      const infoY = panelY + panelHeight - 80;
      drawText(this.ctx, '⚠️ Selecione um beast para participar de partidas PVP', panelX + 20, infoY, {
        font: '16px monospace',
        color: COLORS.ui.error,
      });
    }
  }
}

