/**
 * Vila 3D UI - Beast Keepers
 * Wrapper para a cena 3D da vila interativa
 */

import { VillageScene3D, type BuildingType } from '../3d/scenes/VillageScene3D';
import { COLORS } from './colors';

export class Village3DUI {
  private container: HTMLDivElement;
  private villageScene: VillageScene3D | null = null;
  private labelElement: HTMLDivElement;
  
  // Callbacks para abrir diferentes funcionalidades
  public onOpenShop?: () => void;
  public onOpenTemple?: () => void;
  public onOpenCraft?: () => void;
  public onOpenInventory?: () => void;
  public onOpenQuests?: () => void;
  public onOpenAchievements?: () => void;
  public onOpenExploration?: () => void;
  public onOpenDungeons?: () => void;
  public onOpenRanch?: () => void;

  constructor() {
    // Container principal
    this.container = document.createElement('div');
    this.container.id = 'village-3d-container';
    this.container.style.cssText = `
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      bottom: 40px;
      background: #87CEEB;
      z-index: 5;
      display: none;
    `;
    document.body.appendChild(this.container);
    
    // Label para nome da edificação
    this.labelElement = document.createElement('div');
    this.labelElement.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: ${COLORS.primary.gold};
      padding: 10px 20px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    `;
    this.labelElement.textContent = 'Clique em uma edificação para interagir';
    this.container.appendChild(this.labelElement);
    
    // Botão de fechar
    const closeButton = document.createElement('button');
    closeButton.textContent = '← Voltar';
    closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: ${COLORS.primary.red};
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      z-index: 10;
    `;
    closeButton.addEventListener('click', () => this.hide());
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = COLORS.primary.redDark;
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = COLORS.primary.red;
    });
    this.container.appendChild(closeButton);
    
    // Instruções
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 14px;
      text-align: center;
      z-index: 10;
    `;
    instructions.innerHTML = `
      <div>🖱️ Passe o mouse sobre as casas para ver o nome</div>
      <div>🖱️ Clique em uma casa para entrar</div>
    `;
    this.container.appendChild(instructions);
    
    console.log('[Village3DUI] Initialized');
  }

  /**
   * Mostra a vila 3D
   */
  public show(): void {
    this.container.style.display = 'block';
    
    if (!this.villageScene) {
      this.createVillageScene();
    }
    
    console.log('[Village3DUI] Showing village');
  }

  /**
   * Esconde a vila 3D
   */
  public hide(): void {
    this.container.style.display = 'none';
    console.log('[Village3DUI] Hidden');
  }

  /**
   * Cria a cena 3D da vila
   */
  private createVillageScene(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.villageScene = new VillageScene3D(this.container, width, height);
    
    // Callback para cliques em edificações
    this.villageScene.onBuildingClick = (type: BuildingType) => {
      this.handleBuildingClick(type);
    };
    
    // Callback para hover
    this.villageScene.onBuildingHover = (type: BuildingType | null, name: string) => {
      if (type) {
        this.labelElement.textContent = name;
        this.labelElement.style.opacity = '1';
      } else {
        this.labelElement.style.opacity = '0';
      }
    };
    
    // Resize handler
    window.addEventListener('resize', this.handleResize);
    
    console.log('[Village3DUI] Village scene created');
  }

  /**
   * Handle building click
   */
  private handleBuildingClick(type: BuildingType): void {
    console.log(`[Village3DUI] Opening: ${type}`);
    
    // Esconder vila
    this.hide();
    
    // Abrir funcionalidade correspondente
    switch (type) {
      case 'shop':
        if (this.onOpenShop) this.onOpenShop();
        break;
      case 'temple':
        if (this.onOpenTemple) this.onOpenTemple();
        break;
      case 'craft':
        if (this.onOpenCraft) this.onOpenCraft();
        break;
      case 'inventory':
        if (this.onOpenInventory) this.onOpenInventory();
        break;
      case 'quests':
        if (this.onOpenQuests) this.onOpenQuests();
        break;
      case 'achievements':
        if (this.onOpenAchievements) this.onOpenAchievements();
        break;
      case 'exploration':
        if (this.onOpenExploration) this.onOpenExploration();
        break;
      case 'dungeons':
        if (this.onOpenDungeons) this.onOpenDungeons();
        break;
      case 'ranch':
        if (this.onOpenRanch) this.onOpenRanch();
        break;
    }
  }

  /**
   * Handle resize
   */
  private handleResize = (): void => {
    if (this.villageScene && this.container.style.display !== 'none') {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.villageScene.resize(width, height);
    }
  }

  /**
   * Dispose
   */
  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    
    if (this.villageScene) {
      this.villageScene.dispose();
      this.villageScene = null;
    }
    
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    
    console.log('[Village3DUI] Disposed');
  }
}

