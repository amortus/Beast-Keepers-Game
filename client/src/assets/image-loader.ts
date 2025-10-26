/**
 * Image Loader - Beast Keepers
 * Sistema de carregamento e gerenciamento de imagens
 */

export interface BeastImages {
  sprite: HTMLImageElement;
  portrait: HTMLImageElement;
  battlePose: HTMLImageElement;
}

export class ImageLoader {
  private static instance: ImageLoader;
  private images: Map<string, BeastImages> = new Map();
  private loadedCount = 0;
  private totalImages = 0;
  private onLoadComplete?: () => void;

  private constructor() {}

  static getInstance(): ImageLoader {
    if (!ImageLoader.instance) {
      ImageLoader.instance = new ImageLoader();
    }
    return ImageLoader.instance;
  }

  /**
   * Carrega todas as imagens das criaturas
   */
  async loadBeastImages(onComplete?: () => void): Promise<void> {
    this.onLoadComplete = onComplete;
    
    const beastNames = [
      'Brontis', 'Feralis', 'Ignar', 'Mirella', 'Olgrim',
      'Raukor', 'Sylphid', 'Terravox', 'Umbrix', 'Zephyra'
    ];

    this.totalImages = beastNames.length * 3; // 3 imagens por criatura
    this.loadedCount = 0;

    const loadPromises = beastNames.map(name => this.loadBeastImage(name));
    
    await Promise.all(loadPromises);
    
    if (this.onLoadComplete) {
      this.onLoadComplete();
    }
  }

  /**
   * Carrega as imagens de uma criatura específica
   */
  private async loadBeastImage(beastName: string): Promise<void> {
    const sprite = new Image();
    const portrait = new Image();
    const battlePose = new Image();

    const loadPromises = [
      new Promise<void>((resolve) => {
        sprite.onload = () => {
          this.loadedCount++;
          resolve();
        };
        sprite.onerror = () => {
          console.warn(`Failed to load sprite for ${beastName}`);
          this.loadedCount++;
          resolve();
        };
        sprite.src = `/assets/beasts/sprites/${beastName}.png`;
      }),
      
      new Promise<void>((resolve) => {
        portrait.onload = () => {
          this.loadedCount++;
          resolve();
        };
        portrait.onerror = () => {
          console.warn(`Failed to load portrait for ${beastName}`);
          this.loadedCount++;
          resolve();
        };
        portrait.src = `/assets/beasts/portraits/${beastName}.png`;
      }),
      
      new Promise<void>((resolve) => {
        battlePose.onload = () => {
          this.loadedCount++;
          resolve();
        };
        battlePose.onerror = () => {
          console.warn(`Failed to load battle pose for ${beastName}`);
          this.loadedCount++;
          resolve();
        };
        battlePose.src = `/assets/beasts/battle-poses/${beastName}.png`;
      })
    ];

    await Promise.all(loadPromises);

    this.images.set(beastName, {
      sprite,
      portrait,
      battlePose
    });
  }

  /**
   * Obtém as imagens de uma criatura
   */
  getBeastImages(beastName: string): BeastImages | null {
    return this.images.get(beastName) || null;
  }

  /**
   * Obtém apenas o sprite de uma criatura
   */
  getBeastSprite(beastName: string): HTMLImageElement | null {
    const images = this.images.get(beastName);
    return images?.sprite || null;
  }

  /**
   * Obtém apenas o retrato de uma criatura
   */
  getBeastPortrait(beastName: string): HTMLImageElement | null {
    const images = this.images.get(beastName);
    return images?.portrait || null;
  }

  /**
   * Obtém apenas a pose de batalha de uma criatura
   */
  getBeastBattlePose(beastName: string): HTMLImageElement | null {
    const images = this.images.get(beastName);
    return images?.battlePose || null;
  }

  /**
   * Verifica se todas as imagens foram carregadas
   */
  isLoaded(): boolean {
    return this.loadedCount >= this.totalImages;
  }

  /**
   * Obtém o progresso de carregamento (0-1)
   */
  getLoadProgress(): number {
    return this.totalImages > 0 ? this.loadedCount / this.totalImages : 0;
  }
}
