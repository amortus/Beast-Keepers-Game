/**
 * PVP Matchmaking UI
 * Interface Canvas para matchmaking (ranked e casual)
 */

import { joinMatchmaking, leaveMatchmaking, getMatchmakingStatus, MatchType } from '../api/pvpApi';
import { pvpSocketClient } from '../services/pvpSocketClient';
import type { Beast } from '../types';
import { GLASS_THEME } from './theme';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';

export class PvpMatchmakingUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedMatchType: MatchType = 'casual';
  private isInQueue: boolean = false;
  private queueStartTime: number = 0;
  private queueElapsedSeconds: number = 0;
  private queueInterval: number | null = null;
  private currentBeast: Beast | null = null;
  private loadingAnimation: number = 0;

  // Callbacks
  public onMatchFound: (matchId: number, opponent: { userId: number; beastId: number }, matchType: MatchType) => void = () => {};
  public onBack: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.setupEventListeners();
    this.setupSocketListeners();
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

  private setupSocketListeners() {
    pvpSocketClient.onMatchFound((data) => {
      this.handleMatchFound(data);
    });

    pvpSocketClient.onMatchmakingJoined(() => {
      this.isInQueue = true;
      this.queueStartTime = Date.now();
      this.startQueueTimer();
    });

    pvpSocketClient.onMatchmakingLeft(() => {
      this.isInQueue = false;
      this.stopQueueTimer();
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

  private async handleJoinQueue() {
    if (!this.currentBeast) {
      return;
    }

    if (this.isInQueue) {
      return;
    }

    try {
      await joinMatchmaking(this.currentBeast.id, this.selectedMatchType);
      pvpSocketClient.joinMatchmaking(this.currentBeast.id, this.selectedMatchType);
      
      this.isInQueue = true;
      this.queueStartTime = Date.now();
      this.queueElapsedSeconds = 0;
      this.startQueueTimer();
    } catch (error: any) {
      console.error('[PVP Matchmaking] Error joining queue:', error);
    }
  }

  private async handleLeaveQueue() {
    if (!this.isInQueue) {
      return;
    }

    try {
      await leaveMatchmaking();
      pvpSocketClient.leaveMatchmaking();
      
      this.isInQueue = false;
      this.stopQueueTimer();
    } catch (error: any) {
      console.error('[PVP Matchmaking] Error leaving queue:', error);
    }
  }

  private handleMatchFound(data: { matchId: number; opponent: { userId: number; beastId: number }; matchType: MatchType }) {
    this.isInQueue = false;
    this.stopQueueTimer();
    this.onMatchFound(data.matchId, data.opponent, data.matchType);
  }

  private startQueueTimer() {
    this.stopQueueTimer();

    this.queueInterval = window.setInterval(() => {
      if (!this.isInQueue) {
        this.stopQueueTimer();
        return;
      }

      this.queueElapsedSeconds = Math.floor((Date.now() - this.queueStartTime) / 1000);
    }, 1000);
  }

  private stopQueueTimer() {
    if (this.queueInterval !== null) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
    }
  }

  public show(beast: Beast) {
    this.currentBeast = beast;
    this.checkQueueStatus();
  }

  public hide() {
    this.isInQueue = false;
    this.stopQueueTimer();
  }

  private async checkQueueStatus() {
    try {
      const status = await getMatchmakingStatus();
      if (status && status.inQueue) {
        this.isInQueue = true;
        // Se já estava na fila, calcular tempo decorrido desde que entrou
        if (status.status?.queuedAt) {
          const queuedAt = new Date(status.status.queuedAt).getTime();
          this.queueStartTime = queuedAt;
          this.queueElapsedSeconds = Math.floor((Date.now() - queuedAt) / 1000);
        } else {
          this.queueStartTime = Date.now();
          this.queueElapsedSeconds = 0;
        }
        this.selectedMatchType = status.status?.matchType || 'casual';
        this.startQueueTimer();
      } else {
        this.isInQueue = false;
        this.stopQueueTimer();
      }
    } catch (error) {
      console.error('[PVP Matchmaking] Error checking queue status:', error);
      // Em caso de erro, assumir que não está na fila
      this.isInQueue = false;
      this.stopQueueTimer();
    }
  }

  public draw() {
    this.buttons.clear();

    // Atualizar animação de loading
    if (this.isInQueue) {
      this.loadingAnimation = (this.loadingAnimation + 0.15) % (Math.PI * 2);
    }

    // Fundo semi-transparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Painel principal
    const panelWidth = Math.min(900, this.canvas.width - 60);
    const panelHeight = Math.min(600, this.canvas.height - 60);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      variant: 'popup',
      borderWidth: 1.5,
    });

    // Header
    drawText(this.ctx, '⚔️ PVP Matchmaking', panelX + 20, panelY + 30, {
      font: 'bold 32px monospace',
      color: GLASS_THEME.palette.accent.lilac,
    });

    // Botão Voltar
    const backBtnWidth = 100;
    const backBtnHeight = 35;
    const backBtnX = panelX + panelWidth - backBtnWidth - 10;
    const backBtnY = panelY + 10;
    const backIsHovered = isMouseOver(this.mouseX, this.mouseY, backBtnX, backBtnY, backBtnWidth, backBtnHeight);

    drawButton(this.ctx, backBtnX, backBtnY, backBtnWidth, backBtnHeight, '← Voltar', {
      variant: 'ghost',
      isHovered: backIsHovered,
      fontSize: 14,
    });

    this.buttons.set('back', {
      x: backBtnX,
      y: backBtnY,
      width: backBtnWidth,
      height: backBtnHeight,
      action: () => {
        if (this.onBack) this.onBack();
      },
    });

    const contentY = panelY + 80;
    const contentX = panelX + 30;

    // Seleção de tipo de partida
    drawText(this.ctx, 'Tipo de Partida', contentX, contentY, {
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.text.primary,
    });

    const matchTypeY = contentY + 40;
    const matchTypeBtnWidth = 200;
    const matchTypeBtnHeight = 50;
    const matchTypeSpacing = 20;

    // Botão Casual
    const casualX = contentX;
    const casualIsHovered = isMouseOver(this.mouseX, this.mouseY, casualX, matchTypeY, matchTypeBtnWidth, matchTypeBtnHeight);
    const casualIsSelected = this.selectedMatchType === 'casual';

    drawButton(this.ctx, casualX, matchTypeY, matchTypeBtnWidth, matchTypeBtnHeight, '🎮 Casual', {
      variant: casualIsSelected ? 'primary' : 'ghost',
      isHovered: casualIsHovered && !casualIsSelected,
      fontSize: 16,
    });

    if (casualIsSelected) {
      drawText(this.ctx, '✓', casualX + matchTypeBtnWidth - 20, matchTypeY + 30, {
        align: 'center',
        font: 'bold 20px monospace',
        color: GLASS_THEME.palette.accent.emerald,
      });
    }

    drawText(this.ctx, 'Sem afetar ranking', casualX + matchTypeBtnWidth / 2, matchTypeY + matchTypeBtnHeight + 15, {
      align: 'center',
      font: '12px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });

    this.buttons.set('casual', {
      x: casualX,
      y: matchTypeY,
      width: matchTypeBtnWidth,
      height: matchTypeBtnHeight,
      action: () => {
        if (!this.isInQueue) {
          this.selectedMatchType = 'casual';
        }
      },
    });

    // Botão Ranked
    const rankedX = contentX + matchTypeBtnWidth + matchTypeSpacing;
    const rankedIsHovered = isMouseOver(this.mouseX, this.mouseY, rankedX, matchTypeY, matchTypeBtnWidth, matchTypeBtnHeight);
    const rankedIsSelected = this.selectedMatchType === 'ranked';

    drawButton(this.ctx, rankedX, matchTypeY, matchTypeBtnWidth, matchTypeBtnHeight, '🏆 Ranked', {
      variant: rankedIsSelected ? 'primary' : 'ghost',
      isHovered: rankedIsHovered && !rankedIsSelected,
      fontSize: 16,
    });

    if (rankedIsSelected) {
      drawText(this.ctx, '✓', rankedX + matchTypeBtnWidth - 20, matchTypeY + 30, {
        align: 'center',
        font: 'bold 20px monospace',
        color: GLASS_THEME.palette.accent.amber,
      });
    }

    drawText(this.ctx, 'Afeta ELO/ranking', rankedX + matchTypeBtnWidth / 2, matchTypeY + matchTypeBtnHeight + 15, {
      align: 'center',
      font: '12px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });

    this.buttons.set('ranked', {
      x: rankedX,
      y: matchTypeY,
      width: matchTypeBtnWidth,
      height: matchTypeBtnHeight,
      action: () => {
        if (!this.isInQueue) {
          this.selectedMatchType = 'ranked';
        }
      },
    });

    // Status da fila
    const statusY = matchTypeY + matchTypeBtnHeight + 80;
    drawText(this.ctx, 'Status', contentX, statusY, {
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.text.primary,
    });

    const statusBoxY = statusY + 40;
    const statusBoxWidth = panelWidth - 60;
    const statusBoxHeight = 100;

    // Box de status
    const statusGradient = this.ctx.createLinearGradient(contentX, statusBoxY, contentX, statusBoxY + statusBoxHeight);
    statusGradient.addColorStop(0, 'rgba(16, 52, 90, 0.6)');
    statusGradient.addColorStop(1, 'rgba(8, 26, 48, 0.7)');
    this.ctx.fillStyle = statusGradient;
    this.ctx.fillRect(contentX, statusBoxY, statusBoxWidth, statusBoxHeight);

    this.ctx.strokeStyle = GLASS_THEME.palette.panel.border;
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(contentX, statusBoxY, statusBoxWidth, statusBoxHeight);

    if (this.isInQueue) {
      // Animação de loading
      const centerX = contentX + statusBoxWidth / 2;
      const centerY = statusBoxY + statusBoxHeight / 2;
      const radius = 20;

      this.ctx.save();
      this.ctx.strokeStyle = GLASS_THEME.palette.accent.cyan;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY - 10, radius, this.loadingAnimation, this.loadingAnimation + Math.PI * 1.5);
      this.ctx.stroke();
      this.ctx.restore();

      drawText(this.ctx, 'Buscando oponente...', centerX, centerY + 10, {
        align: 'center',
        font: 'bold 18px monospace',
        color: GLASS_THEME.palette.accent.cyan,
      });

      // Formatar tempo como MM:SS (estilo Dota/LoL)
      const minutes = Math.floor(this.queueElapsedSeconds / 60);
      const seconds = this.queueElapsedSeconds % 60;
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      drawText(this.ctx, timeString, centerX, centerY + 35, {
        align: 'center',
        font: 'bold 20px monospace',
        color: GLASS_THEME.palette.accent.amber,
      });
      
      drawText(this.ctx, 'Tempo na fila', centerX, centerY + 55, {
        align: 'center',
        font: '12px monospace',
        color: GLASS_THEME.palette.text.secondary,
      });
    } else {
      drawText(this.ctx, this.currentBeast 
        ? 'Pronto para buscar partida' 
        : 'Selecione um beast primeiro', 
        contentX + statusBoxWidth / 2, statusBoxY + statusBoxHeight / 2, {
        align: 'center',
        font: '16px monospace',
        color: GLASS_THEME.palette.text.secondary,
      });
    }

    // Botões de ação
    const actionY = statusBoxY + statusBoxHeight + 30;
    const actionBtnWidth = 220;
    const actionBtnHeight = 45;

    if (this.isInQueue) {
      // Botão Cancelar
      const cancelX = contentX + (statusBoxWidth - actionBtnWidth) / 2;
      const cancelIsHovered = isMouseOver(this.mouseX, this.mouseY, cancelX, actionY, actionBtnWidth, actionBtnHeight);

      drawButton(this.ctx, cancelX, actionY, actionBtnWidth, actionBtnHeight, 'Cancelar Busca', {
        variant: 'danger',
        isHovered: cancelIsHovered,
        fontSize: 16,
      });

      this.buttons.set('cancel', {
        x: cancelX,
        y: actionY,
        width: actionBtnWidth,
        height: actionBtnHeight,
        action: () => this.handleLeaveQueue(),
      });
    } else {
      // Botão Buscar Partida
      const searchX = contentX + (statusBoxWidth - actionBtnWidth) / 2;
      const searchIsHovered = isMouseOver(this.mouseX, this.mouseY, searchX, actionY, actionBtnWidth, actionBtnHeight);

      drawButton(this.ctx, searchX, actionY, actionBtnWidth, actionBtnHeight, 'Buscar Partida', {
        variant: 'primary',
        isHovered: searchIsHovered,
        isDisabled: !this.currentBeast,
        fontSize: 16,
      });

      this.buttons.set('search', {
        x: searchX,
        y: actionY,
        width: actionBtnWidth,
        height: actionBtnHeight,
        action: () => this.handleJoinQueue(),
      });
    }

    // Informações da beast ativa
    if (this.currentBeast) {
      const beast = this.currentBeast;
      const infoY = panelY + panelHeight - 60;
      
      drawText(this.ctx, `Beast: ${beast.name} | Nível ${beast.level || 1} | HP ${beast.currentHp}/${beast.maxHp}`, 
        contentX, infoY, {
        font: '14px monospace',
        color: GLASS_THEME.palette.text.secondary,
      });
    } else {
      const infoY = panelY + panelHeight - 60;
      drawText(this.ctx, '⚠️ Selecione um beast para participar de partidas PVP', contentX, infoY, {
        font: '14px monospace',
        color: GLASS_THEME.palette.accent.danger,
      });
    }
  }
}
