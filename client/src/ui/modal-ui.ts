/**
 * Sistema de Modal/Diálogo customizado
 * Substitui alert() e prompt() do navegador
 */

import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';

export type ModalType = 'message' | 'input' | 'choice' | 'npc-selection';

export interface ModalOptions {
  type: ModalType;
  title: string;
  message: string;
  choices?: string[];
  placeholder?: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

export class ModalUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private isVisible = false;
  private currentModal: ModalOptions | null = null;
  private inputValue = '';
  private inputFocused = false;

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

    // Captura de teclado para input
    document.addEventListener('keydown', (e) => {
      if (!this.isVisible || !this.inputFocused) return;

      if (e.key === 'Enter') {
        this.confirmInput();
      } else if (e.key === 'Escape') {
        this.cancel();
      } else if (e.key === 'Backspace') {
        this.inputValue = this.inputValue.slice(0, -1);
      } else if (e.key.length === 1) {
        this.inputValue += e.key;
      }
    });
  }

  private handleClick() {
    if (!this.isVisible) return;

    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        if (button.action) {
          button.action();
        }
      }
    });
  }

  public show(options: ModalOptions) {
    this.currentModal = options;
    this.isVisible = true;
    this.inputValue = options.defaultValue || '';
    this.inputFocused = options.type === 'input';
  }

  public hide() {
    this.isVisible = false;
    this.currentModal = null;
    this.inputValue = '';
    this.inputFocused = false;
  }

  public draw() {
    if (!this.isVisible || !this.currentModal) return;

    this.buttons.clear();

    // Fundo escuro semi-transparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Desenha modal baseado no tipo
    switch (this.currentModal.type) {
      case 'message':
        this.drawMessageModal();
        break;
      case 'input':
        this.drawInputModal();
        break;
      case 'choice':
        this.drawChoiceModal();
        break;
      case 'npc-selection':
        this.drawNPCSelectionModal();
        break;
    }
  }

  private drawMessageModal() {
    if (!this.currentModal) return;

    const width = 500;
    const height = 250;
    const x = (this.canvas.width - width) / 2;
    const y = (this.canvas.height - height) / 2;

    // Painel
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.gold,
    });

    // Título
    drawText(this.ctx, this.currentModal.title, x + width / 2, y + 30, {
      align: 'center',
      font: 'bold 24px monospace',
      color: COLORS.primary.gold,
    });

    // Mensagem
    this.drawWrappedText(this.currentModal.message, x + 20, y + 80, width - 40, 22, '16px monospace', COLORS.ui.text);

    // Botão OK
    const btnWidth = 150;
    const btnHeight = 40;
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + height - 60;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, 'OK', {
      bgColor: COLORS.primary.green,
      isHovered,
    });

    this.buttons.set('ok', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        if (this.currentModal?.onConfirm) {
          this.currentModal.onConfirm();
        }
        this.hide();
      },
    });
  }

  private drawInputModal() {
    if (!this.currentModal) return;

    const width = 550;
    const height = 300;
    const x = (this.canvas.width - width) / 2;
    const y = (this.canvas.height - height) / 2;

    // Painel
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.purple,
    });

    // Título
    drawText(this.ctx, this.currentModal.title, x + width / 2, y + 30, {
      align: 'center',
      font: 'bold 24px monospace',
      color: COLORS.primary.purple,
    });

    // Mensagem
    drawText(this.ctx, this.currentModal.message, x + 20, y + 70, {
      font: '16px monospace',
      color: COLORS.ui.text,
    });

    // Campo de input
    const inputX = x + 20;
    const inputY = y + 110;
    const inputWidth = width - 40;
    const inputHeight = 50;

    // Fundo do input
    this.ctx.fillStyle = COLORS.bg.dark;
    this.ctx.fillRect(inputX, inputY, inputWidth, inputHeight);

    // Borda (destacada se focado)
    this.ctx.strokeStyle = this.inputFocused ? COLORS.primary.purple : COLORS.ui.text;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(inputX, inputY, inputWidth, inputHeight);

    // Texto digitado
    const displayText = this.inputValue || this.currentModal.placeholder || '';
    const textColor = this.inputValue ? COLORS.ui.text : COLORS.ui.textDim;
    
    drawText(this.ctx, displayText, inputX + 15, inputY + 32, {
      font: '18px monospace',
      color: textColor,
    });

    // Cursor piscando
    if (this.inputFocused && Math.floor(Date.now() / 500) % 2 === 0) {
      const cursorX = inputX + 15 + this.ctx.measureText(this.inputValue).width;
      this.ctx.fillStyle = COLORS.ui.text;
      this.ctx.fillRect(cursorX, inputY + 15, 2, 20);
    }

    // Botões
    const btnWidth = 120;
    const btnHeight = 40;
    const btnSpacing = 20;
    const totalBtnWidth = (btnWidth * 2) + btnSpacing;
    const btnStartX = x + (width - totalBtnWidth) / 2;
    const btnY = y + height - 60;

    // Botão Cancelar
    const cancelIsHovered = isMouseOver(this.mouseX, this.mouseY, btnStartX, btnY, btnWidth, btnHeight);
    drawButton(this.ctx, btnStartX, btnY, btnWidth, btnHeight, 'Cancelar', {
      bgColor: COLORS.ui.error,
      isHovered: cancelIsHovered,
    });

    this.buttons.set('cancel', {
      x: btnStartX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => this.cancel(),
    });

    // Botão Confirmar
    const confirmX = btnStartX + btnWidth + btnSpacing;
    const confirmIsHovered = isMouseOver(this.mouseX, this.mouseY, confirmX, btnY, btnWidth, btnHeight);
    drawButton(this.ctx, confirmX, btnY, btnWidth, btnHeight, 'Confirmar', {
      bgColor: COLORS.primary.green,
      isHovered: confirmIsHovered,
    });

    this.buttons.set('confirm', {
      x: confirmX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => this.confirmInput(),
    });
  }

  private drawChoiceModal() {
    if (!this.currentModal || !this.currentModal.choices) return;

    const width = 600;
    const choiceCount = this.currentModal.choices.length;
    const height = 200 + (choiceCount * 60) + 70; // +70 para o botão Voltar
    const x = (this.canvas.width - width) / 2;
    const y = (this.canvas.height - height) / 2;

    // Painel
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.blue,
    });

    // Título
    drawText(this.ctx, this.currentModal.title, x + width / 2, y + 30, {
      align: 'center',
      font: 'bold 24px monospace',
      color: COLORS.primary.blue,
    });

    // Mensagem
    if (this.currentModal.message) {
      this.drawWrappedText(this.currentModal.message, x + 20, y + 70, width - 40, 20, '14px monospace', COLORS.ui.textDim);
    }

    // Opções
    const btnWidth = width - 60;
    const btnHeight = 45;
    let btnY = y + 120;

    this.currentModal.choices.forEach((choice, index) => {
      const isHovered = isMouseOver(this.mouseX, this.mouseY, x + 30, btnY, btnWidth, btnHeight);
      
      // Define cor do botão (vermelho para cancelar, azul para ações)
      const isCancel = choice.toLowerCase().includes('cancelar');
      const btnColor = isCancel ? COLORS.ui.error : COLORS.primary.purple;

      drawButton(this.ctx, x + 30, btnY, btnWidth, btnHeight, `${index + 1}. ${choice}`, {
        bgColor: btnColor,
        isHovered,
      });

      this.buttons.set(`choice_${index}`, {
        x: x + 30,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        action: () => {
          if (this.currentModal?.onConfirm) {
            // Passa o texto da escolha, não o índice
            this.currentModal.onConfirm(choice);
          }
          this.hide();
        },
      });

      btnY += btnHeight + 10;
    });

    // Botão Voltar (abaixo das escolhas)
    btnY += 10; // Espaço extra
    const backBtnWidth = 200;
    const backBtnHeight = 45;
    const backBtnX = x + (width - backBtnWidth) / 2;
    const backIsHovered = isMouseOver(this.mouseX, this.mouseY, backBtnX, btnY, backBtnWidth, backBtnHeight);

    drawButton(this.ctx, backBtnX, btnY, backBtnWidth, backBtnHeight, '← Voltar', {
      bgColor: COLORS.ui.error,
      hoverColor: '#c53030',
      isHovered: backIsHovered,
    });

    this.buttons.set('back', {
      x: backBtnX,
      y: btnY,
      width: backBtnWidth,
      height: backBtnHeight,
      action: () => {
        if (this.currentModal?.onCancel) {
          this.currentModal.onCancel();
        }
        this.hide();
      },
    });
  }

  private drawNPCSelectionModal() {
    // Similar ao choice modal, mas com estilo específico para NPCs
    this.drawChoiceModal();
  }

  private confirmInput() {
    if (this.currentModal?.onConfirm) {
      this.currentModal.onConfirm(this.inputValue);
    }
    this.hide();
  }

  private cancel() {
    if (this.currentModal?.onCancel) {
      this.currentModal.onCancel();
    }
    this.hide();
  }

  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string, color: string) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Shadow for better readability
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    if (line.trim()) {
      this.ctx.fillText(line, x, currentY);
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  public isShowing(): boolean {
    return this.isVisible;
  }
}

