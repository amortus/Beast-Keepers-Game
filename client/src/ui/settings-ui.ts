/**
 * SettingsUI - Interface de configurações de áudio
 */

import { AudioManager, AudioConfig } from '../audio/AudioManager';

export class SettingsUI {
  private canvas: HTMLCanvasElement;
  private isOpen: boolean = false;
  private config: AudioConfig;
  
  // Callbacks
  public onClose: (() => void) | null = null;
  
  // Slider states
  private draggingSlider: 'master' | 'sfx' | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.config = AudioManager.getConfig();
  }

  open(): void {
    this.isOpen = true;
    this.config = AudioManager.getConfig();
  }

  close(): void {
    this.isOpen = false;
    if (this.onClose) {
      this.onClose();
    }
  }

  handleClick(x: number, y: number): boolean {
    if (!this.isOpen) return false;

    const panelX = this.canvas.width / 2 - 350;
    const panelY = this.canvas.height / 2 - 250;
    const panelWidth = 700;
    const panelHeight = 500;

    // Close button
    const closeX = panelX + panelWidth - 40;
    const closeY = panelY + 10;
    if (x >= closeX && x <= closeX + 30 && y >= closeY && y <= closeY + 30) {
      AudioManager.playSFX('click');
      this.close();
      return true;
    }

    // Mute button
    const muteX = panelX + 40;
    const muteY = panelY + 60;
    if (x >= muteX && x <= muteX + 150 && y >= muteY && y <= muteY + 40) {
      const newMuted = AudioManager.toggleMute();
      this.config.muted = newMuted;
      AudioManager.playSFX('click');
      return true;
    }

    // Test SFX button
    const testX = panelX + 220;
    const testY = panelY + 60;
    if (x >= testX && x <= testX + 150 && y >= testY && y <= testY + 40) {
      AudioManager.playSFX('achievement', 0.8);
      return true;
    }

    // Sliders - Área clicável maior para melhor UX
    const sliderX = panelX + 240;
    const sliderWidth = 380;
    
    // Master slider
    const masterY = panelY + 150;
    if (x >= sliderX && x <= sliderX + sliderWidth && y >= masterY - 15 && y <= masterY + 15) {
      const volume = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
      AudioManager.setMasterVolume(volume);
      this.config = AudioManager.getConfig();
      return true;
    }

    // SFX slider
    const sfxY = panelY + 230;
    if (x >= sliderX && x <= sliderX + sliderWidth && y >= sfxY - 15 && y <= sfxY + 15) {
      const volume = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
      AudioManager.setSFXVolume(volume);
      this.config = AudioManager.getConfig();
      AudioManager.playSFX('click', volume);
      return true;
    }

    // Click inside panel but not on any control
    if (x >= panelX && x <= panelX + panelWidth &&
        y >= panelY && y <= panelY + panelHeight) {
      return true; // Consume event
    }

    return false;
  }

  handleMouseMove(x: number, _y: number): void {
    if (!this.isOpen) return;
    if (!this.draggingSlider) return;

    const panelX = this.canvas.width / 2 - 350;
    const sliderX = panelX + 240;
    const sliderWidth = 380;

    const volume = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));

    if (this.draggingSlider === 'master') {
      AudioManager.setMasterVolume(volume);
    } else if (this.draggingSlider === 'sfx') {
      AudioManager.setSFXVolume(volume);
    }

    this.config = AudioManager.getConfig();
  }

  handleMouseDown(x: number, y: number): boolean {
    if (!this.isOpen) return false;

    const panelX = this.canvas.width / 2 - 350;
    const panelY = this.canvas.height / 2 - 250;
    const sliderX = panelX + 240;
    const sliderWidth = 380;

    // Check master slider - área maior para facilitar drag
    const masterY = panelY + 150;
    if (x >= sliderX && x <= sliderX + sliderWidth && y >= masterY - 15 && y <= masterY + 15) {
      this.draggingSlider = 'master';
      // Aplicar volume imediatamente no mousedown
      const volume = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
      AudioManager.setMasterVolume(volume);
      this.config = AudioManager.getConfig();
      return true;
    }

    // Check SFX slider
    const sfxY = panelY + 230;
    if (x >= sliderX && x <= sliderX + sliderWidth && y >= sfxY - 15 && y <= sfxY + 15) {
      this.draggingSlider = 'sfx';
      // Aplicar volume imediatamente no mousedown
      const volume = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
      AudioManager.setSFXVolume(volume);
      this.config = AudioManager.getConfig();
      return true;
    }

    return false;
  }

  handleMouseUp(): void {
    this.draggingSlider = null;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isOpen) return;

    const panelX = this.canvas.width / 2 - 350;
    const panelY = this.canvas.height / 2 - 250;
    const panelWidth = 700;
    const panelHeight = 500;

    // Background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Panel
    ctx.fillStyle = '#2a2a3e';
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 Configurações de Áudio', panelX + panelWidth / 2, panelY + 40);

    // Close button
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(panelX + panelWidth - 40, panelY + 10, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✕', panelX + panelWidth - 25, panelY + 32);

    // Mute button
    const muteX = panelX + 40;
    const muteY = panelY + 60;
    ctx.fillStyle = this.config.muted ? '#e74c3c' : '#27ae60';
    ctx.fillRect(muteX, muteY, 150, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.config.muted ? '🔇 Mudo' : '🔊 Som Ativo', muteX + 75, muteY + 26);

    // Test SFX button
    const testX = panelX + 220;
    const testY = panelY + 60;
    ctx.fillStyle = '#3498db';
    ctx.fillRect(testX, testY, 150, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🎺 Testar SFX', testX + 75, testY + 26);

    // Sliders
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px Arial';

    // Master Volume
    this.drawSlider(ctx, panelX + 40, panelY + 150, 'Volume Master', this.config.masterVolume);
    
    // SFX Volume
    this.drawSlider(ctx, panelX + 40, panelY + 230, 'Efeitos Sonoros', this.config.sfxVolume);

    // Info text
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('As configurações são salvas automaticamente', panelX + panelWidth / 2, panelY + 420);
    
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('✅ Som efeitos ativos! Ajuste os volumes acima', panelX + panelWidth / 2, panelY + 450);
    
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText('Use o botão ⚙️ no jogo para abrir estas configurações', panelX + panelWidth / 2, panelY + 475);
  }

  private drawSlider(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: number): void {
    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${label}:`, x, y);

    // Value percentage - AJUSTADO para aparecer dentro do painel
    ctx.fillStyle = '#4a90e2';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(value * 100)}%`, x + 620, y);

    // Slider track - AJUSTADO para dar espaço para a porcentagem
    const sliderX = x + 200;
    const sliderY = y - 5;
    const sliderWidth = 380;
    const sliderHeight = 10;

    ctx.fillStyle = '#444466';
    ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);

    // Slider fill
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(sliderX, sliderY, sliderWidth * value, sliderHeight);

    // Slider thumb
    const thumbX = sliderX + (sliderWidth * value);
    const thumbY = sliderY + sliderHeight / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(thumbX, thumbY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  isShowing(): boolean {
    return this.isOpen;
  }
}

