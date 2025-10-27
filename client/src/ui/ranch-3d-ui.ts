/**
 * Ranch 3D UI - Beast Viewer Integration
 * Displays beast in 3D Monster Rancher style
 */

import { BeastViewer3D } from '../3d/BeastViewer3D';
import type { Beast } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';

export class Ranch3DUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private beast: Beast;
  
  // 3D viewer
  private viewer3D: BeastViewer3D | null = null;
  private viewer3DContainer: HTMLDivElement | null = null;
  private is3DMode = false;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // Buttons
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  // Public callbacks
  public onExit3D: () => void = () => {};
  
  constructor(canvas: HTMLCanvasElement, beast: Beast) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.beast = beast;
    
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
  
  public render() {
    this.buttons.clear();
    
    if (this.is3DMode) {
      this.render3DView();
    } else {
      this.render2DView();
    }
  }
  
  private render2DView() {
    // Draw 2D ranch view (existing UI)
    const panelX = 20;
    const panelY = 100;
    const panelWidth = 400;
    const panelHeight = 500;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.purple
    });
    
    drawText(this.ctx, '🏠 Rancho - Vista 2D', panelX + 200, panelY + 30, {
      align: 'center',
      font: 'bold 20px monospace',
      color: COLORS.primary.gold
    });
    
    // Beast info
    drawText(this.ctx, `${this.beast.name}`, panelX + 20, panelY + 70, {
      font: 'bold 18px monospace',
      color: COLORS.ui.text
    });
    
    drawText(this.ctx, `Linha: ${this.beast.line}`, panelX + 20, panelY + 100, {
      font: '16px monospace',
      color: COLORS.ui.textDim
    });
    
    // Toggle 3D button
    const toggle3DBtnX = panelX + 100;
    const toggle3DBtnY = panelY + panelHeight - 60;
    const toggle3DBtnWidth = 200;
    const toggle3DBtnHeight = 45;
    
    const isToggleHovered = isMouseOver(
      this.mouseX, this.mouseY, 
      toggle3DBtnX, toggle3DBtnY, 
      toggle3DBtnWidth, toggle3DBtnHeight
    );
    
    drawButton(this.ctx, toggle3DBtnX, toggle3DBtnY, toggle3DBtnWidth, toggle3DBtnHeight, '🎮 Ver em 3D (PS1)', {
      bgColor: COLORS.primary.purple,
      hoverColor: COLORS.primary.purpleDark,
      isHovered: isToggleHovered
    });
    
    this.buttons.set('toggle3d', {
      x: toggle3DBtnX,
      y: toggle3DBtnY,
      width: toggle3DBtnWidth,
      height: toggle3DBtnHeight,
      action: () => this.enter3DMode()
    });
  }
  
  private render3DView() {
    // Draw minimal 2D overlay with controls
    const panelX = this.canvas.width - 250;
    const panelY = 20;
    const panelWidth = 230;
    const panelHeight = 300;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 26, 46, 0.9)',
      borderColor: COLORS.primary.purple
    });
    
    drawText(this.ctx, '🎮 Controles 3D', panelX + 115, panelY + 25, {
      align: 'center',
      font: 'bold 16px monospace',
      color: COLORS.primary.gold
    });
    
    // Camera controls
    const btnWidth = 100;
    const btnHeight = 35;
    const btnX = panelX + 15;
    let btnY = panelY + 50;
    
    // Rotate Left button
    this.drawControlButton('← Girar', btnX, btnY, btnWidth, btnHeight, () => {
      this.viewer3D?.rotateCameraLeft();
    });
    
    // Rotate Right button
    this.drawControlButton('Girar →', btnX + 110, btnY, btnWidth, btnHeight, () => {
      this.viewer3D?.rotateCameraRight();
    });
    
    btnY += 45;
    
    // Zoom In button
    this.drawControlButton('🔍 + Zoom', btnX, btnY, btnWidth, btnHeight, () => {
      this.viewer3D?.zoomIn();
    });
    
    // Zoom Out button
    this.drawControlButton('🔍 - Zoom', btnX + 110, btnY, btnWidth, btnHeight, () => {
      this.viewer3D?.zoomOut();
    });
    
    btnY += 45;
    
    // Auto-rotate toggle
    const orbitLabel = this.viewer3D ? '⏸ Parar' : '▶ Girar Auto';
    this.drawControlButton(orbitLabel, btnX + 25, btnY, 160, btnHeight, () => {
      if (this.viewer3D) {
        // Toggle auto-rotate
        this.viewer3D.stopOrbit();
        this.viewer3D.startOrbit();
      }
    });
    
    btnY += 45;
    
    // Reset camera button
    this.drawControlButton('🔄 Resetar', btnX + 25, btnY, 160, btnHeight, () => {
      this.viewer3D?.resetCamera();
    });
    
    btnY += 60;
    
    // Back to 2D button
    const backBtnHeight = 45;
    this.drawControlButton('← Voltar para 2D', btnX, btnY, 200, backBtnHeight, () => {
      this.exit3DMode();
      this.onExit3D(); // Trigger callback to main.ts
    }, COLORS.ui.error);
    
    // Draw beast name overlay
    drawText(this.ctx, this.beast.name, this.canvas.width / 2, 40, {
      align: 'center',
      font: 'bold 32px monospace',
      color: COLORS.primary.gold
    });
    
    drawText(this.ctx, `${this.beast.line} - ${this.beast.blood}`, this.canvas.width / 2, 75, {
      align: 'center',
      font: '18px monospace',
      color: COLORS.ui.textDim
    });
  }
  
  private drawControlButton(
    label: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    action: () => void,
    color: string = COLORS.primary.blue
  ) {
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    
    drawButton(this.ctx, x, y, width, height, label, {
      bgColor: color,
      isHovered
    });
    
    const buttonId = `btn_${label.replace(/[^a-z0-9]/gi, '_')}`;
    this.buttons.set(buttonId, {
      x, y, width, height, action
    });
  }
  
  private enter3DMode() {
    console.log('[Ranch3D] Entering 3D mode...');
    
    // Create 3D viewer container
    this.viewer3DContainer = document.createElement('div');
    this.viewer3DContainer.id = 'beast-viewer-3d';
    this.viewer3DContainer.style.position = 'fixed';
    this.viewer3DContainer.style.left = '0';
    this.viewer3DContainer.style.top = '0';
    this.viewer3DContainer.style.width = '100%';
    this.viewer3DContainer.style.height = '100%';
    this.viewer3DContainer.style.zIndex = '5'; // Below canvas (z-index: 10)
    this.viewer3DContainer.style.pointerEvents = 'none'; // Canvas handles clicks
    
    document.body.appendChild(this.viewer3DContainer);
    
    // Create 3D viewer
    this.viewer3D = new BeastViewer3D(this.viewer3DContainer, this.beast);
    this.viewer3D.startOrbit(); // Auto-rotate on enter
    
    this.is3DMode = true;
    console.log('[Ranch3D] 3D mode active');
  }
  
  private exit3DMode() {
    console.log('[Ranch3D] Exiting 3D mode...');
    
    // Cleanup 3D viewer
    if (this.viewer3D) {
      this.viewer3D.dispose();
      this.viewer3D = null;
    }
    
    // Remove container
    if (this.viewer3DContainer && this.viewer3DContainer.parentNode) {
      this.viewer3DContainer.parentNode.removeChild(this.viewer3DContainer);
      this.viewer3DContainer = null;
    }
    
    this.is3DMode = false;
    console.log('[Ranch3D] Back to 2D mode');
  }
  
  public dispose() {
    this.exit3DMode();
  }
  
  public updateBeast(beast: Beast) {
    this.beast = beast;
    
    // If in 3D mode, reload viewer with new beast
    if (this.is3DMode) {
      this.exit3DMode();
      this.enter3DMode();
    }
  }
}

