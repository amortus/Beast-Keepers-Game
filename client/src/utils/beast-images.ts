/**
 * Sistema simples de imagens das criaturas
 * Carregamento direto e síncrono
 */

// Cache de imagens carregadas
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Obtém o sprite de uma criatura (síncrono)
 */
export function getBeastSprite(beastName: string): HTMLImageElement | null {
  const src = `/assets/beasts/sprites/${beastName}.png`;
  
  // Verificar cache primeiro
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  
  // Tentar carregar a imagem
  try {
    const img = new Image();
    img.src = src;
    
    // Se já está carregada, adicionar ao cache
    if (img.complete && img.naturalWidth > 0) {
      imageCache.set(src, img);
      return img;
    }
    
    // Se não está carregada, retornar null
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtém o retrato de uma criatura (síncrono)
 */
export function getBeastPortrait(beastName: string): HTMLImageElement | null {
  const src = `/assets/beasts/portraits/${beastName}.png`;
  
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  
  try {
    const img = new Image();
    img.src = src;
    
    if (img.complete && img.naturalWidth > 0) {
      imageCache.set(src, img);
      return img;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtém a pose de batalha de uma criatura (síncrono)
 */
export function getBeastBattlePose(beastName: string): HTMLImageElement | null {
  const src = `/assets/beasts/battle-poses/${beastName}.png`;
  
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  
  try {
    const img = new Image();
    img.src = src;
    
    if (img.complete && img.naturalWidth > 0) {
      imageCache.set(src, img);
      return img;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Carrega todas as imagens das criaturas em background
 */
export function preloadBeastImages(): void {
  const BEAST_NAMES = [
    'Brontis', 'Feralis', 'Ignar', 'Mirella', 'Olgrim',
    'Raukor', 'Sylphid', 'Terravox', 'Umbrix', 'Zephyra'
  ];

  BEAST_NAMES.forEach(beastName => {
    // Carregar sprites
    const sprite = new Image();
    sprite.src = `/assets/beasts/sprites/${beastName}.png`;
    sprite.onload = () => imageCache.set(sprite.src, sprite);
    
    // Carregar retratos
    const portrait = new Image();
    portrait.src = `/assets/beasts/portraits/${beastName}.png`;
    portrait.onload = () => imageCache.set(portrait.src, portrait);
    
    // Carregar poses de batalha
    const battlePose = new Image();
    battlePose.src = `/assets/beasts/battle-poses/${beastName}.png`;
    battlePose.onload = () => imageCache.set(battlePose.src, battlePose);
  });
}
