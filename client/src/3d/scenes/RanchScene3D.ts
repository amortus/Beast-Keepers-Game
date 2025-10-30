/**
 * 3D Ranch Scene - PS1 Style
 * Beast Keepers - Three.js ranch visualization with Monster Rancher aesthetic
 */

import * as THREE from 'three';
import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { PS1Terrain } from '../terrain/PS1Terrain';
import { PS1Water } from '../water/PS1Water';
import { PS1Grass } from '../vegetation/PS1Grass';
import { createPS1Skybox, createDistantMountains, setupPS1Fog, createPS1Clouds } from '../environments/PS1Background';

export class RanchScene3D {
  private threeScene: ThreeScene;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;
  
  // New PS1 elements
  private terrain: PS1Terrain | null = null;
  private water: PS1Water | null = null;
  private grass: PS1Grass | null = null;
  private skybox: THREE.Mesh | null = null;
  private mountains: THREE.Group | null = null;
  private clouds: THREE.Group | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupRanchEnvironment();
  }

  private setupRanchEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    
    // Setup PS1-style camera (fixed position, Monster Rancher style)
    // Ajustado para melhor enquadramento do rancho
    camera.fov = 60;
    camera.position.set(0, 3, 6.5); // Mais alto e mais longe
    camera.lookAt(0, 0.5, 0); // Olhando levemente para baixo
    camera.updateProjectionMatrix();
    
    // PS1 Background elements (cores naturais do concept art)
    this.skybox = createPS1Skybox(scene);
    this.mountains = createDistantMountains(scene);
    this.clouds = createPS1Clouds(scene, 6); // Adicionar nuvens para profundidade
    setupPS1Fog(scene, 0x9fb8d9, 20, 50); // Fog azul claro
    
    // Procedural terrain (replaces flat ground) - cores vibrantes e saturadas
    this.terrain = new PS1Terrain({
      size: 20,
      segments: 40, // Mais segmentos para suavizar
      heightVariation: 0.5, // Mais variação de altura
      seed: 12345,
      colors: {
        base: 0x5db84f,  // Verde grama vibrante
        high: 0x7dd86e, // Verde amarelado (colinas iluminadas)
        low: 0x3d8f31,  // Verde escuro (vales com sombra)
      }
    });
    scene.add(this.terrain.getMesh());
    
    // Water feature (bebedouro/lago) - azul vibrante, movido para esquerda
    this.water = new PS1Water({
      size: 1.5,
      segments: 8,
      color: 0x3ab5f5, // Azul mais vibrante e claro
      waveSpeed: 0.9,
      waveHeight: 0.06,
    });
    this.water.getMesh().position.set(1.5, 0.05, 3.5); // Movido mais para esquerda (3.5 → 1.5)
    scene.add(this.water.getMesh());
    
    // Grass around the ranch - mais densa e vibrante
    this.grass = new PS1Grass({
      count: 400, // Mais grama para densidade
      area: 12,
      color: 0x3d7a25, // Verde mais saturado
      height: 0.3,
      windSpeed: 0.4,
      windStrength: 0.02,
    });
    scene.add(this.grass.getMesh());
    
    // Barn (celeiro) in background
    this.createBarn();
    
    // Tents
    this.createTent(4.5, 0, -3.5);
    this.createTent(5.5, 0, -4);
    
    // Fences (keep existing but adjust for terrain)
    this.createFences();
    
    // Trees (removida árvore que estava bloqueando o laguinho)
    this.createTree(-4, 0, -4);
    this.createTree(4.5, 0, -2);
    this.createTree(-3.5, 0, 4);

    // Food bowl (bebedouro) - amarelo mais vibrante
    const bowlGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.25, 6);
    const foodBowl = new THREE.Mesh(bowlGeometry, new THREE.MeshLambertMaterial({ 
      color: 0xe8b856, // Amarelo dourado mais vibrante
      flatShading: true 
    }));
    foodBowl.position.set(-3.5, 0.12, 3.5);
    scene.add(foodBowl);
  }
  
  /**
   * Create barn (celeiro) in background
   */
  private createBarn() {
    const scene = this.threeScene.getScene();
    const barnGroup = new THREE.Group();
    
    // Main body - vermelho vibrante
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 2.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xc85a42, // Vermelho barn mais vibrante
      flatShading: false // Smooth
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    barnGroup.add(body);
    
    // Roof (pyramid) - marrom mais escuro
    const roofGeometry = new THREE.ConeGeometry(2.3, 1.5, 6);
    const roofMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x7a3e1f, // Marrom mais escuro
      flatShading: false // Smooth
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.75;
    roof.rotation.y = Math.PI / 4;
    barnGroup.add(roof);
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
    const doorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4d3317,
      flatShading: false // Smooth
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.6, 1.26);
    barnGroup.add(door);
    
    barnGroup.position.set(0, 0, -8);
    scene.add(barnGroup);
  }
  
  /**
   * Create tent (conica branca)
   */
  private createTent(x: number, y: number, z: number) {
    const scene = this.threeScene.getScene();
    
    const tentGeometry = new THREE.ConeGeometry(0.6, 1.2, 6);
    const tentMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xf5f5f5,
      flatShading: true 
    });
    const tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(x, 0.6, z);
    scene.add(tent);
  }
  
  /**
   * Create fences around ranch
   */
  private createFences() {
    const scene = this.threeScene.getScene();
    const fenceHeight = 0.8;
    const fenceThickness = 0.1;
    const fenceMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xa0612d,
      flatShading: false // Smooth
    });

    // Front fence
    const frontFenceGeometry = new THREE.BoxGeometry(12, fenceHeight, fenceThickness);
    const frontFence = new THREE.Mesh(frontFenceGeometry, fenceMaterial);
    frontFence.position.set(0, fenceHeight / 2, -6);
    scene.add(frontFence);

    // Back fence (lower, partial)
    const backFence = new THREE.Mesh(new THREE.BoxGeometry(8, fenceHeight, fenceThickness), fenceMaterial);
    backFence.position.set(0, fenceHeight / 2, 6);
    scene.add(backFence);

    // Side fences
    const sideFenceGeometry = new THREE.BoxGeometry(fenceThickness, fenceHeight, 10);
    
    const leftFence = new THREE.Mesh(sideFenceGeometry, fenceMaterial);
    leftFence.position.set(-6, fenceHeight / 2, 0);
    scene.add(leftFence);
    
    const rightFence = new THREE.Mesh(sideFenceGeometry, fenceMaterial);
    rightFence.position.set(6, fenceHeight / 2, 0);
    scene.add(rightFence);
  }

  private createTree(x: number, y: number, z: number) {
    const scene = this.threeScene.getScene();

    // Trunk (low-poly mas smooth) - marrom mais rico
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8b5a3c, // Marrom mais quente
      flatShading: false // Smooth para não ficar muito blocky
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 0.75, z);
    scene.add(trunk);

    // Foliage (pyramid/cone - PS1 style) - verde vibrante
    const foliageGeometry = new THREE.ConeGeometry(0.9, 1.6, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4db85f, // Verde mais vibrante
      flatShading: false // Smooth para não ficar muito blocky
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 2.3, z);
    scene.add(foliage);
  }

  public setBeast(beastLine: string) {
    // Remove previous model
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }

    // Create new model
    this.beastModel = new BeastModel(beastLine);
    this.beastGroup = this.beastModel.getGroup();
    
    // Position in center
    this.beastGroup.position.set(0, 0, 0);
    
    this.threeScene.addObject(this.beastGroup);

    // Setup idle animation
    this.idleAnimation = this.beastModel.playIdleAnimation();
  }

  public update(delta: number) {
    // Update beast animation
    if (this.idleAnimation) {
      this.idleAnimation();
    }
    
    // Update water animation
    if (this.water) {
      this.water.update(delta);
    }
    
    // Update grass animation (wind)
    if (this.grass) {
      this.grass.update(delta);
    }
    
    // Camera stays fixed (Monster Rancher style - no auto-rotation)
    // User can add manual camera controls later if needed
  }

  public render() {
    this.threeScene.render();
  }

  public startLoop() {
    this.threeScene.startAnimationLoop((delta) => {
      this.update(delta);
    });
  }

  public stopLoop() {
    this.threeScene.stopAnimationLoop();
  }

  public resize(width: number, height: number) {
    this.threeScene.resize(width, height);
  }

  public dispose() {
    // Dispose beast model
    this.beastModel?.dispose();
    
    // Dispose PS1 elements
    this.terrain?.dispose();
    this.water?.dispose();
    this.grass?.dispose();
    
    // Dispose skybox and mountains (geometry/materials)
    if (this.skybox) {
      this.skybox.geometry.dispose();
      (this.skybox.material as THREE.Material).dispose();
    }
    
    if (this.mountains) {
      this.mountains.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    
    if (this.clouds) {
      this.clouds.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    
    // Dispose Three.js scene
    this.threeScene.dispose();
  }
}

