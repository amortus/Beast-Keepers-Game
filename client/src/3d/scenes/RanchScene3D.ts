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
import { createPS1Skybox, createDistantMountains, setupPS1Fog } from '../environments/PS1Background';

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

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupRanchEnvironment();
  }

  private setupRanchEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    
    // Setup PS1-style camera (fixed position, Monster Rancher style)
    camera.fov = 65;
    camera.position.set(0, 2.5, 5);
    camera.lookAt(0, 0.8, 0);
    camera.updateProjectionMatrix();
    
    // PS1 Background elements (cores naturais do concept art)
    this.skybox = createPS1Skybox(scene);
    this.mountains = createDistantMountains(scene);
    setupPS1Fog(scene, 0x9fb8d9, 20, 50); // Fog azul claro
    
    // Procedural terrain (replaces flat ground) - cores verdes do concept art
    this.terrain = new PS1Terrain({
      size: 20,
      segments: 24,
      heightVariation: 0.3,
      seed: 12345,
      colors: {
        base: 0x3a7c2a,  // Verde grama médio
        high: 0x5a9c4a, // Verde claro (colinas)
        low: 0x2a5c1a,  // Verde escuro (vales)
      }
    });
    scene.add(this.terrain.getMesh());
    
    // Water feature (bebedouro/lago)
    this.water = new PS1Water({
      size: 1.5,
      segments: 8,
      color: 0x4299e1,
      waveSpeed: 0.8,
      waveHeight: 0.04,
    });
    this.water.getMesh().position.set(3.5, 0.05, 3.5);
    scene.add(this.water.getMesh());
    
    // Grass around the ranch
    this.grass = new PS1Grass({
      count: 300,
      area: 12,
      color: 0x2a5518,
      height: 0.25,
      windSpeed: 0.3,
      windStrength: 0.015,
    });
    scene.add(this.grass.getMesh());
    
    // Barn (celeiro) in background
    this.createBarn();
    
    // Tents
    this.createTent(4.5, 0, -3.5);
    this.createTent(5.5, 0, -4);
    
    // Fences (keep existing but adjust for terrain)
    this.createFences();
    
    // Trees
    this.createTree(-4, 0, -4);
    this.createTree(4.5, 0, -2);
    this.createTree(-3.5, 0, 4);
    this.createTree(2, 0, 4.5);

    // Food bowl (bebedouro)
    const bowlGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.25, 6);
    const foodBowl = new THREE.Mesh(bowlGeometry, new THREE.MeshLambertMaterial({ 
      color: 0xd4a56a,
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
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 2.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8b4513,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    barnGroup.add(body);
    
    // Roof (pyramid)
    const roofGeometry = new THREE.ConeGeometry(2.3, 1.5, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x654321,
      flatShading: true 
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.75;
    roof.rotation.y = Math.PI / 4;
    barnGroup.add(roof);
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
    const doorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x3d2817,
      flatShading: true 
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
      color: 0x8b4513,
      flatShading: true
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

    // Trunk (low-poly)
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 5);
    const trunkMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x654321,
      flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 0.75, z);
    scene.add(trunk);

    // Foliage (pyramid/cone - PS1 style)
    const foliageGeometry = new THREE.ConeGeometry(0.9, 1.6, 5);
    const foliageMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2a7c3a,
      flatShading: true
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
    
    // Dispose Three.js scene
    this.threeScene.dispose();
  }
}

