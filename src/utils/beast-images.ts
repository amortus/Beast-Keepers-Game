/**
 * Sistema simples de imagens das criaturas
 * Carregamento seguro e compatível
 */

// Cache de imagens carregadas
const imageCache = new Map<string, HTMLImageElement>();

// Lista das criaturas disponíveis
const BEAST_NAMES = [
  'Brontis', 'Feralis', 'Ignar', 'Mirella', 'Olgrim',
  'Raukor', 'Sylphid', 'Terravox', 'Umbrix', 'Zephyra'
];

/**
 * Carrega uma imagem de forma segura
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Verificar se já está no cache
    if (imageCache.has(src)) {
      resolve(imageCache.get(src)!);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Obtém o sprite de uma criatura
 */
export async function getBeastSprite(beastName: string): Promise<HTMLImageElement | null> {
  try {
    const src = `/assets/beasts/sprites/${beastName}.png`;
    return await loadImage(src);
  } catch {
    return null;
  }
}

/**
 * Obtém o retrato de uma criatura
 */
export async function getBeastPortrait(beastName: string): Promise<HTMLImageElement | null> {
  try {
    const src = `/assets/beasts/portraits/${beastName}.png`;
    return await loadImage(src);
  } catch {
    return null;
  }
}

/**
 * Obtém a pose de batalha de uma criatura
 */
export async function getBeastBattlePose(beastName: string): Promise<HTMLImageElement | null> {
  try {
    const src = `/assets/beasts/battle-poses/${beastName}.png`;
    return await loadImage(src);
  } catch {
    return null;
  }
}

/**
 * Carrega todas as imagens das criaturas em background
 */
export function preloadBeastImages(): void {
  BEAST_NAMES.forEach(beastName => {
    // Carregar sprites
    getBeastSprite(beastName).catch(() => {});
    // Carregar retratos
    getBeastPortrait(beastName).catch(() => {});
    // Carregar poses de batalha
    getBeastBattlePose(beastName).catch(() => {});
  });
}
