/**
 * 3D Immersive Battle UI - Beast Keepers
 * Pokémon Arceus-style 3D battle interface
 * CORRIGIDO: HUD completo com botões e logs
 */

import type { BattleContext, CombatAction, Technique } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { canUseTechnique } from '../systems/combat';
import { TECHNIQUES } from '../data/techniques';
import { ImmersiveBattleScene3D } from '../3d/scenes/ImmersiveBattleScene3D';

export class BattleUI3D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battle: BattleContext;
  
  // 3D Scene
  private scene3D: ImmersiveBattleScene3D | null = null;
  private scene3DContainer: HTMLDivElement | null = null;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // UI state
  private selectedTechnique: string | null = null;
  private animationFrame = 0;
  private isAutoBattle = false;
  private autoBattleSpeed = 1;
  private showTechniques = false; // Toggle para mostrar técnicas
  
  // Button positions (for HUD overlay)
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  // Callbacks
  public onActionSelected: ((action: CombatAction) => void) | null = null;
  public onBattleEnd: ((winner: 'player' | 'enemy') => void) | null = null;

  constructor(canvas: HTMLCanvasElement, battle: BattleContext) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.battle = battle;
    
    this.setupEventListeners();
    this.setup3DScene();
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

  private setup3DScene() {
    console.log('[BattleUI3D] Setting up immersive 3D scene...');
    
    // Create container for 3D scene (full screen, ATRÁS do canvas 2D)
    this.scene3DContainer = document.createElement('div');
    this.scene3DContainer.id = 'battle-scene-3d-container';
    this.scene3DContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
    `;
    
    document.body.appendChild(this.scene3DContainer);
    
    // Create 3D scene
    try {
      this.scene3D = new ImmersiveBattleScene3D(
        this.scene3DContainer,
        window.innerWidth,
        window.innerHeight
      );
      
      // Load beasts
      this.scene3D.setPlayerBeast(this.battle.player.beast.line);
      this.scene3D.setEnemyBeast(this.battle.enemy.beast.line);
      
      // Set initial camera angle
      this.scene3D.setCameraAngle('wide');
      
      console.log('[BattleUI3D] ✓ 3D scene created');
    } catch (error) {
      console.error('[BattleUI3D] Failed to create 3D scene:', error);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.scene3D) {
        this.scene3D.resize(window.innerWidth, window.innerHeight);
      }
    });
  }

  private handleClick() {
    console.log('[BattleUI3D] Click at:', this.mouseX, this.mouseY, 'Phase:', this.battle.phase);
    
    let clicked = false;
    this.buttons.forEach((button, key) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        console.log('[BattleUI3D] Button clicked:', key);
        clicked = true;
        if (button.action) {
          button.action();
        }
      }
    });
    
    if (!clicked) {
      console.log('[BattleUI3D] No button clicked. Buttons:', this.buttons.size);
    }
  }

  public draw() {
    this.animationFrame++;
    
    // IMPORTANTE: Limpar canvas completamente para HUD ficar visível
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Rebuild buttons
    this.buttons.clear();

    // Draw HUD based on phase
    this.drawPlayerHUD();
    this.drawEnemyHUD();
    this.drawTurnIndicator();
    
    if (this.battle.phase === 'player_turn') {
      this.drawActionButtons();
    } else if (this.battle.phase === 'combat_log') {
      this.drawCombatLog();
    } else if (this.battle.phase === 'battle_end') {
      this.drawBattleEnd();
    }
    
    // Auto-battle toggle (SEMPRE visível)
    this.drawAutoBattleToggle();
    
    // Technique list POR CIMA de tudo (overlay)
    if (this.showTechniques && this.battle.phase === 'player_turn') {
      this.drawTechniqueList();
    }
    
    // Update 3D scene health
    if (this.scene3D) {
      this.scene3D.updateHealth('player', this.battle.player.beast.currentHp, this.battle.player.beast.maxHp);
      this.scene3D.updateHealth('enemy', this.battle.enemy.beast.currentHp, this.battle.enemy.beast.maxHp);
    }
  }

  private drawPlayerHUD() {
    const x = 50;
    const y = 400;
    const width = 280;
    const height = 140;
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.primary.green,
      borderWidth: 3,
    });
    
    const player = this.battle.player.beast;
    
    drawText(this.ctx, player.name, x + 15, y + 15, {
      font: 'bold 20px monospace',
      color: COLORS.primary.green,
    });
    
    // HP Bar
    drawText(this.ctx, 'HP:', x + 15, y + 50, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    drawBar(this.ctx, x + 55, y + 52, width - 70, 18, 
      player.currentHp, player.maxHp, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.ui.success,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${player.currentHp}/${player.maxHp}`, 
      x + width / 2, y + 66, {
      font: '11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Essence Bar
    drawText(this.ctx, 'Essência:', x + 15, y + 90, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    const essence = this.battle.player.currentEssence;
    const maxEssence = player.maxEssence || 100;
    
    drawBar(this.ctx, x + 100, y + 92, width - 115, 18, 
      essence, maxEssence, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.primary.purple,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${essence}/${maxEssence}`, 
      x + width / 2 + 20, y + 106, {
      font: '11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Status
    const status = this.battle.player.isDefending ? '🛡️ Defendendo' : '⚔️ Pronto';
    drawText(this.ctx, status, x + 15, y + 125, {
      font: '12px monospace',
      color: COLORS.primary.gold,
    });
  }

  private drawEnemyHUD() {
    const width = 280;
    const height = 140;
    const x = this.canvas.width - width - 50;
    const y = 400;
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.ui.error,
      borderWidth: 3,
    });
    
    const enemy = this.battle.enemy.beast;
    
    drawText(this.ctx, enemy.name, x + 15, y + 15, {
      font: 'bold 20px monospace',
      color: COLORS.ui.error,
    });
    
    // HP Bar
    drawText(this.ctx, 'HP:', x + 15, y + 50, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    drawBar(this.ctx, x + 55, y + 52, width - 70, 18, 
      enemy.currentHp, enemy.maxHp, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.ui.error,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${enemy.currentHp}/${enemy.maxHp}`, 
      x + width / 2, y + 66, {
      font: '11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Essence Bar
    drawText(this.ctx, 'Essência:', x + 15, y + 90, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    const essence = this.battle.enemy.currentEssence;
    const maxEssence = enemy.maxEssence || 100;
    
    drawBar(this.ctx, x + 100, y + 92, width - 115, 18, 
      essence, maxEssence, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.primary.purple,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${essence}/${maxEssence}`, 
      x + width / 2 + 20, y + 106, {
      font: '11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Status
    const status = this.battle.enemy.isDefending ? '🛡️ Defendendo' : '⚔️ Pronto';
    drawText(this.ctx, status, x + 15, y + 125, {
      font: '12px monospace',
      color: COLORS.primary.gold,
    });
  }

  private drawTurnIndicator() {
    const text = this.battle.phase === 'player_turn' ? 'SEU TURNO' : 'TURNO INIMIGO';
    const color = this.battle.phase === 'player_turn' ? COLORS.primary.green : COLORS.ui.error;
    
    const boxWidth = 250;
    const boxHeight = 60;
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = 30;
    
    drawPanel(this.ctx, boxX, boxY, boxWidth, boxHeight, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: color,
      borderWidth: 3,
    });
    
    drawText(this.ctx, text, this.canvas.width / 2, boxY + 20, {
      font: 'bold 24px monospace',
      color,
      align: 'center',
    });
    
    drawText(this.ctx, `Turno ${this.battle.turnCount}`, this.canvas.width / 2, boxY + 45, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
      align: 'center',
    });
  }

  private drawActionButtons() {
    const panelWidth = 600;
    const panelHeight = 80;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = this.canvas.height - panelHeight - 20;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.95)',
      borderColor: COLORS.primary.gold,
      borderWidth: 3,
    });
    
    drawText(this.ctx, 'AÇÕES', panelX + panelWidth / 2, panelY + 15, {
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
      align: 'center',
    });
    
    // Técnicas button
    const techBtnWidth = 200;
    const techBtnHeight = 40;
    const techBtnX = panelX + 50;
    const techBtnY = panelY + 30;
    const techIsHovered = isMouseOver(this.mouseX, this.mouseY, techBtnX, techBtnY, techBtnWidth, techBtnHeight);
    
    drawButton(this.ctx, techBtnX, techBtnY, techBtnWidth, techBtnHeight, '⚔️ Técnicas', {
      bgColor: this.showTechniques ? COLORS.primary.purple : COLORS.primary.blue,
      isHovered: techIsHovered,
      fontSize: 16,
    });
    
    this.buttons.set('btn_techniques', {
      x: techBtnX,
      y: techBtnY,
      width: techBtnWidth,
      height: techBtnHeight,
      action: () => {
        this.showTechniques = !this.showTechniques;
      },
    });
    
    // Defender button
    const defendBtnWidth = 200;
    const defendBtnHeight = 40;
    const defendBtnX = panelX + panelWidth - defendBtnWidth - 50;
    const defendBtnY = panelY + 30;
    const defendIsHovered = isMouseOver(this.mouseX, this.mouseY, defendBtnX, defendBtnY, defendBtnWidth, defendBtnHeight);
    
    drawButton(this.ctx, defendBtnX, defendBtnY, defendBtnWidth, defendBtnHeight, '🛡️ Defender', {
      bgColor: COLORS.primary.blue,
      isHovered: defendIsHovered,
      fontSize: 16,
    });
    
    this.buttons.set('btn_defend', {
      x: defendBtnX,
      y: defendBtnY,
      width: defendBtnWidth,
      height: defendBtnHeight,
      action: () => {
        if (this.onActionSelected && this.scene3D) {
          this.onActionSelected({ type: 'defend' });
          this.showTechniques = false;
        }
      },
    });
  }

  private drawTechniqueList() {
    const techniques = this.battle.player.beast.techniques || [];
    
    console.log('[BattleUI3D] Drawing technique list, count:', techniques.length);
    
    const panelWidth = 700;
    const panelHeight = Math.min(400, 150 + techniques.length * 70);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = 150; // FIXO no topo para não cobrir HUD inferior
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.95)',
      borderColor: COLORS.primary.purple,
      borderWidth: 4,
    });
    
    drawText(this.ctx, 'Escolha uma Técnica', panelX + panelWidth / 2, panelY + 25, {
      font: 'bold 24px monospace',
      color: COLORS.primary.gold,
      align: 'center',
    });
    
    // Botão de fechar (X no canto superior direito)
    const closeBtnSize = 40;
    const closeBtnX = panelX + panelWidth - closeBtnSize - 10;
    const closeBtnY = panelY + 10;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
    
    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, '✖', {
      bgColor: COLORS.ui.error,
      isHovered: closeIsHovered,
      fontSize: 18,
    });
    
    this.buttons.set('close_techniques', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnSize,
      height: closeBtnSize,
      action: () => {
        console.log('[BattleUI3D] Closing technique list');
        this.showTechniques = false;
      },
    });
    
    let currentY = panelY + 70;
    const btnWidth = panelWidth - 60;
    const btnHeight = 55;
    const spacing = 15;
    
    techniques.forEach((techId) => {
      const tech = this.getTechniqueData(techId);
      if (!tech) return;
      
      const canUse = canUseTechnique(this.battle.player.beast, tech);
      const btnX = panelX + 30;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, currentY, btnWidth, btnHeight);
      
      const btnColor = !canUse ? COLORS.ui.textDim : 
                       isHovered ? COLORS.primary.gold : 
                       COLORS.primary.purple;
      
      drawButton(this.ctx, btnX, currentY, btnWidth, btnHeight, '', {
        bgColor: btnColor,
        isHovered: canUse && isHovered,
      });
      
      // Nome da técnica
      drawText(this.ctx, tech.name, btnX + 15, currentY + 15, {
        font: 'bold 18px monospace',
        color: canUse ? COLORS.ui.text : COLORS.ui.textDim,
      });
      
      // Custo de essência
      const essenceColor = canUse ? COLORS.primary.purple : COLORS.ui.textDim;
      drawText(this.ctx, `⚡ ${tech.essenceCost}`, btnX + btnWidth - 15, currentY + 15, {
        font: 'bold 16px monospace',
        color: essenceColor,
        align: 'right',
      });
      
      // Descrição
      drawText(this.ctx, tech.description || `Dano: ${tech.damage}`, btnX + 15, currentY + 38, {
        font: '12px monospace',
        color: COLORS.ui.textDim,
      });
      
      if (canUse) {
        this.buttons.set(`tech_${techId}`, {
          x: btnX,
          y: currentY,
          width: btnWidth,
          height: btnHeight,
          action: () => {
            console.log('[BattleUI3D] Technique selected:', tech.name);
            this.showTechniques = false;
            
            if (this.onActionSelected && this.scene3D) {
              // Play attack animation
              this.scene3D.playAttackAnimation('player', 'enemy');
              
              // Execute action after animation
              setTimeout(() => {
                if (this.onActionSelected) {
                  this.onActionSelected({
                    type: 'technique',
                    techniqueId: techId,
                  });
                }
              }, 600);
            }
          },
        });
      }
      
      currentY += btnHeight + spacing;
    });
  }

  private drawCombatLog() {
    const panelWidth = 600;
    const panelHeight = 120;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = this.canvas.height / 2 + 100;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.95)',
      borderColor: COLORS.primary.blue,
      borderWidth: 3,
    });
    
    // Show combat log messages
    const log = this.battle.combatLog || [];
    let currentY = panelY + 25;
    
    log.slice(-3).forEach(message => {
      drawText(this.ctx, message, panelX + panelWidth / 2, currentY, {
        font: '14px monospace',
        color: COLORS.ui.text,
        align: 'center',
      });
      currentY += 28;
    });
  }

  private drawBattleEnd() {
    const panelWidth = 500;
    const panelHeight = 300;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.98)',
      borderColor: this.battle.winner === 'player' ? COLORS.primary.gold : COLORS.ui.error,
      borderWidth: 5,
    });
    
    // Victory/Defeat message
    const message = this.battle.winner === 'player' ? '🏆 VITÓRIA!' : '💀 DERROTA';
    const color = this.battle.winner === 'player' ? COLORS.primary.gold : COLORS.ui.error;
    
    drawText(this.ctx, message, panelX + panelWidth / 2, panelY + 100, {
      font: 'bold 52px monospace',
      color,
      align: 'center',
    });
    
    // Continue button
    const btnWidth = 250;
    const btnHeight = 60;
    const btnX = (panelWidth - btnWidth) / 2 + panelX;
    const btnY = panelY + panelHeight - 90;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
    
    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '➡️ Continuar', {
      bgColor: COLORS.primary.green,
      isHovered: btnIsHovered,
      fontSize: 20,
    });
    
    this.buttons.set('btn_continue', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        if (this.onBattleEnd && this.battle.winner) {
          this.onBattleEnd(this.battle.winner);
        }
      },
    });
  }

  private drawAutoBattleToggle() {
    const width = 180;
    const height = 40;
    const x = this.canvas.width - width - 20;
    const y = this.canvas.height - height - 120;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.primary.blue,
      borderWidth: 2,
    });
    
    drawText(this.ctx, 'COMBATE AUTO', x + width / 2, y + 8, {
      font: '10px monospace',
      color: COLORS.ui.textDim,
      align: 'center',
    });
    
    const btnLabel = this.isAutoBattle ? '⏸️ Pausar' : '▶️ Iniciar';
    const btnColor = this.isAutoBattle ? COLORS.ui.warning : COLORS.primary.green;
    
    drawButton(this.ctx, x + 10, y + 22, width - 20, 28, btnLabel, {
      bgColor: btnColor,
      isHovered: isHovered,
      fontSize: 13,
    });
    
    this.buttons.set('auto_toggle', {
      x: x + 10,
      y: y + 22,
      width: width - 20,
      height: 28,
      action: () => {
        this.toggleAutoBattle();
      },
    });
    
    // Speed indicator
    if (this.isAutoBattle) {
      const speedText = this.autoBattleSpeed === 1 ? 'Normal' : 
                       this.autoBattleSpeed === 2 ? 'Rápido' : 'Ultra';
      drawText(this.ctx, speedText, x + width / 2, y + height - 6, {
        font: '10px monospace',
        color: COLORS.ui.textDim,
        align: 'center',
      });
    }
  }

  private getTechniqueData(techId: string): Technique | null {
    return TECHNIQUES.find(t => t.id === techId) || null;
  }

  private toggleAutoBattle() {
    this.isAutoBattle = !this.isAutoBattle;
    console.log('[BattleUI3D] Auto-battle:', this.isAutoBattle);
  }

  public checkAutoBattle() {
    if (this.isAutoBattle && this.battle.phase === 'player_turn') {
      this.executeAutoBattleAction();
    }
  }

  private executeAutoBattleAction() {
    // Simple AI: Use first available technique or defend
    const techniques = this.battle.player.beast.techniques || [];
    
    for (const techId of techniques) {
      const tech = this.getTechniqueData(techId);
      if (tech && canUseTechnique(this.battle.player.beast, tech)) {
        if (this.onActionSelected && this.scene3D) {
          this.scene3D.playAttackAnimation('player', 'enemy');
          
          setTimeout(() => {
            if (this.onActionSelected) {
              this.onActionSelected({
                type: 'technique',
                techniqueId: techId,
              });
            }
          }, 600);
        }
        return;
      }
    }
    
    // Fallback: Defend
    if (this.onActionSelected) {
      this.onActionSelected({ type: 'defend' });
    }
  }

  public isAutoBattleActive(): boolean {
    return this.isAutoBattle;
  }

  public stopAutoBattle() {
    this.isAutoBattle = false;
  }

  public updateBattle(battle: BattleContext) {
    this.battle = battle;
  }

  public update3DViewersPosition() {
    // Not needed for fullscreen 3D
  }

  public dispose() {
    console.log('[BattleUI3D] Disposing...');
    
    // Dispose 3D scene
    if (this.scene3D) {
      this.scene3D.dispose();
      this.scene3D = null;
    }
    
    // Remove container
    if (this.scene3DContainer && this.scene3DContainer.parentElement) {
      this.scene3DContainer.parentElement.removeChild(this.scene3DContainer);
      this.scene3DContainer = null;
    }
    
    console.log('[BattleUI3D] ✓ Disposed');
  }
}
