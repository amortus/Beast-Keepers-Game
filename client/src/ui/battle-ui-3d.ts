/**
 * 3D Immersive Battle UI - Beast Keepers
 * Pokémon Arceus-style 3D battle interface
 */

import type { BattleContext, CombatAction } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { canUseTechnique } from '../systems/combat';
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
  
  // Button positions (for HUD overlay)
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  // Callbacks
  public onActionSelected: ((action: CombatAction) => void) | null = null;
  public onBattleEnd: ((winner: 'player' | 'enemy') => Promise<void>) | null = null;

  constructor(canvas: HTMLCanvasElement, battle: BattleContext) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.battle = battle;
    
    this.setup EventListeners();
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
    
    // Create container for 3D scene (full screen, behind 2D HUD)
    this.scene3DContainer = document.createElement('div');
    this.scene3DContainer.id = 'battle-scene-3d-container';
    this.scene3DContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 50;
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
    console.log('[BattleUI3D] Click at:', this.mouseX, this.mouseY);
    
    this.buttons.forEach((button, key) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        console.log('[BattleUI3D] Button clicked:', key);
        if (button.action) {
          button.action();
        }
      }
    });
  }

  public draw() {
    this.animationFrame++;
    
    // Clear 2D canvas (transparent for 3D background)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Rebuild buttons
    this.buttons.clear();

    // Draw semi-transparent HUD panels over 3D
    this.drawHUD();
    
    // Update 3D scene health
    if (this.scene3D) {
      this.scene3D.updateHealth('player', this.battle.player.beast.currentHp, this.battle.player.beast.maxHp);
      this.scene3D.updateHealth('enemy', this.battle.enemy.beast.currentHp, this.battle.enemy.beast.maxHp);
    }
  }

  private drawHUD() {
    // Top HUD: Beast info
    this.drawBeastInfoHUD();
    
    // Bottom HUD: Actions/Techniques
    if (this.battle.phase === 'player_turn') {
      this.drawActionPanel();
    } else if (this.battle.phase === 'combat_log') {
      this.drawCombatLog();
    } else if (this.battle.phase === 'battle_end') {
      this.drawBattleEnd();
    }
    
    // Auto-battle toggle (top right)
    this.drawAutoBattleToggle();
  }

  private drawBeastInfoHUD() {
    const panelHeight = 120;
    const margin = 20;
    
    // Player beast info (top left)
    const playerPanelX = margin;
    const playerPanelY = margin;
    const playerPanelWidth = 350;
    
    drawPanel(this.ctx, playerPanelX, playerPanelY, playerPanelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.85)',
      borderColor: COLORS.primary.green,
      borderWidth: 3,
    });
    
    const player = this.battle.player.beast;
    
    drawText(this.ctx, player.name, playerPanelX + 15, playerPanelY + 15, {
      font: 'bold 24px monospace',
      color: COLORS.primary.green,
    });
    
    drawText(this.ctx, `Linha: ${player.line}`, playerPanelX + 15, playerPanelY + 45, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });
    
    // HP Bar
    drawText(this.ctx, 'HP:', playerPanelX + 15, playerPanelY + 70, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });
    
    drawBar(this.ctx, playerPanelX + 55, playerPanelY + 72, playerPanelWidth - 70, 20, 
      player.currentHp, player.maxHp, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.ui.success,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${player.currentHp}/${player.maxHp}`, 
      playerPanelX + playerPanelWidth / 2, playerPanelY + 87, {
      font: '12px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Enemy beast info (top right)
    const enemyPanelX = this.canvas.width - playerPanelWidth - margin;
    const enemyPanelY = margin;
    
    drawPanel(this.ctx, enemyPanelX, enemyPanelY, playerPanelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.85)',
      borderColor: COLORS.ui.error,
      borderWidth: 3,
    });
    
    const enemy = this.battle.enemy.beast;
    
    drawText(this.ctx, enemy.name, enemyPanelX + 15, enemyPanelY + 15, {
      font: 'bold 24px monospace',
      color: COLORS.ui.error,
    });
    
    drawText(this.ctx, `Linha: ${enemy.line}`, enemyPanelX + 15, enemyPanelY + 45, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });
    
    // HP Bar
    drawText(this.ctx, 'HP:', enemyPanelX + 15, enemyPanelY + 70, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });
    
    drawBar(this.ctx, enemyPanelX + 55, enemyPanelY + 72, playerPanelWidth - 70, 20, 
      enemy.currentHp, enemy.maxHp, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.ui.error,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${enemy.currentHp}/${enemy.maxHp}`, 
      enemyPanelX + playerPanelWidth / 2, enemyPanelY + 87, {
      font: '12px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
  }

  private drawActionPanel() {
    const panelWidth = this.canvas.width - 40;
    const panelHeight = 200;
    const panelX = 20;
    const panelY = this.canvas.height - panelHeight - 20;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.primary.purple,
      borderWidth: 3,
    });
    
    drawText(this.ctx, 'Escolha sua ação:', panelX + 20, panelY + 20, {
      font: 'bold 20px monospace',
      color: COLORS.primary.gold,
    });
    
    // Techniques
    const techniques = this.battle.player.beast.techniques || [];
    const techStartX = panelX + 20;
    let techCurrentX = techStartX;
    let techCurrentY = panelY + 60;
    const techBtnWidth = 180;
    const techBtnHeight = 50;
    const techSpacing = 15;
    
    techniques.forEach((techId, index) => {
      const tech = this.getTechniqueData(techId);
      if (!tech) return;
      
      const canUse = canUseTechnique(this.battle.player.beast, tech);
      const isSelected = this.selectedTechnique === techId;
      
      const btnColor = !canUse ? COLORS.ui.textDim : 
                       isSelected ? COLORS.primary.gold : 
                       COLORS.primary.purple;
      
      const isHovered = isMouseOver(this.mouseX, this.mouseY, techCurrentX, techCurrentY, techBtnWidth, techBtnHeight);
      
      drawButton(this.ctx, techCurrentX, techCurrentY, techBtnWidth, techBtnHeight, 
        `${tech.name}\n⚡${tech.essenceCost}`, {
        bgColor: btnColor,
        isHovered: canUse && isHovered,
        fontSize: 14,
      });
      
      if (canUse) {
        this.buttons.set(`tech_${techId}`, {
          x: techCurrentX,
          y: techCurrentY,
          width: techBtnWidth,
          height: techBtnHeight,
          action: () => {
            this.selectedTechnique = techId;
            if (this.onActionSelected && this.scene3D) {
              // Play attack animation
              this.scene3D.playAttackAnimation('player', 'enemy');
              
              // Execute action after animation
              setTimeout(() => {
                this.onActionSelected!({
                  type: 'technique',
                  techniqueId: techId,
                });
                this.selectedTechnique = null;
              }, 800);
            }
          },
        });
      }
      
      techCurrentX += techBtnWidth + techSpacing;
      if (techCurrentX + techBtnWidth > panelX + panelWidth - 20) {
        techCurrentX = techStartX;
        techCurrentY += techBtnHeight + 10;
      }
    });
    
    // Defend button
    const defendX = panelX + panelWidth - 180 - 20;
    const defendY = panelY + panelHeight - 60;
    const defendIsHovered = isMouseOver(this.mouseX, this.mouseY, defendX, defendY, 180, 50);
    
    drawButton(this.ctx, defendX, defendY, 180, 50, '🛡️ Defender', {
      bgColor: COLORS.primary.blue,
      isHovered: defendIsHovered,
      fontSize: 16,
    });
    
    this.buttons.set('defend', {
      x: defendX,
      y: defendY,
      width: 180,
      height: 50,
      action: () => {
        if (this.onActionSelected) {
          this.onActionSelected({ type: 'defend' });
        }
      },
    });
  }

  private drawCombatLog() {
    const panelWidth = 600;
    const panelHeight = 150;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = this.canvas.height - panelHeight - 20;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.95)',
      borderColor: COLORS.primary.purple,
    });
    
    // Show combat log messages
    const log = this.battle.combatLog || [];
    let currentY = panelY + 20;
    
    log.slice(-4).forEach(message => {
      drawText(this.ctx, message, panelX + panelWidth / 2, currentY, {
        font: '16px monospace',
        color: COLORS.ui.text,
        align: 'center',
      });
      currentY += 30;
    });
  }

  private drawBattleEnd() {
    const panelWidth = 500;
    const panelHeight = 300;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.95)',
      borderColor: this.battle.winner === 'player' ? COLORS.primary.gold : COLORS.ui.error,
      borderWidth: 4,
    });
    
    // Victory/Defeat message
    const message = this.battle.winner === 'player' ? '🏆 VITÓRIA!' : '💀 DERROTA';
    const color = this.battle.winner === 'player' ? COLORS.primary.gold : COLORS.ui.error;
    
    drawText(this.ctx, message, panelX + panelWidth / 2, panelY + 80, {
      font: 'bold 48px monospace',
      color,
      align: 'center',
    });
    
    // Continue button
    const btnWidth = 200;
    const btnHeight = 60;
    const btnX = (panelWidth - btnWidth) / 2 + panelX;
    const btnY = panelY + panelHeight - 100;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
    
    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, 'Continuar', {
      bgColor: COLORS.primary.green,
      isHovered: btnIsHovered,
      fontSize: 20,
    });
    
    this.buttons.set('continue', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: async () => {
        if (this.onBattleEnd) {
          await this.onBattleEnd(this.battle.winner!);
        }
      },
    });
  }

  private drawAutoBattleToggle() {
    const btnWidth = 180;
    const btnHeight = 45;
    const btnX = this.canvas.width - btnWidth - 20;
    const btnY = this.canvas.height - btnHeight - 20;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
    
    const btnLabel = this.isAutoBattle ? '⏸️ Pausar Auto' : '▶️ Auto Batalha';
    const btnColor = this.isAutoBattle ? COLORS.ui.warning : COLORS.primary.green;
    
    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, btnLabel, {
      bgColor: btnColor,
      isHovered: btnIsHovered,
      fontSize: 14,
    });
    
    this.buttons.set('auto_toggle', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.toggleAutoBattle();
      },
    });
  }

  private getTechniqueData(techId: string) {
    // Import technique data
    // (Implement based on your technique system)
    return null;
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

  private async executeAutoBattleAction() {
    // Simple AI: Use first available technique or defend
    const techniques = this.battle.player.beast.techniques || [];
    
    for (const techId of techniques) {
      const tech = this.getTechniqueData(techId);
      if (tech && canUseTechnique(this.battle.player.beast, tech)) {
        if (this.onActionSelected && this.scene3D) {
          this.scene3D.playAttackAnimation('player', 'enemy');
          
          setTimeout(() => {
            this.onActionSelected!({
              type: 'technique',
              techniqueId: techId,
            });
          }, 800);
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

