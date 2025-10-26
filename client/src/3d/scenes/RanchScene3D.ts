/**
 * 3D Ranch Scene
 * Beast Keepers - Three.js ranch visualization
 */

import * as THREE from 'three';
import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';

export class RanchScene3D {
  private threeScene: ThreeScene;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupRanchEnvironment();
  }

  private setupRanchEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    
    // Ajustar câmera para rancho
    camera.position.set(0, 2, 4);
    camera.lookAt(0, 0.8, 0);

    // Ground (larger platform)
    const groundGeometry = new THREE.PlaneGeometry(15, 15);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2d5016,
      flatShading: true,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Fence (simple boxes around)
    const fenceHeight = 0.8;
    const fenceThickness = 0.1;
    const fenceMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b4513,
      flatShading: true
    });

    // Front fence
    const frontFenceGeometry = new THREE.BoxGeometry(12, fenceHeight, fenceThickness);
    const frontFence = new THREE.Mesh(frontFenceGeometry, fenceMaterial);
    frontFence.position.set(0, fenceHeight / 2, -6);
    scene.add(frontFence);

    // Back fence
    const backFence = new THREE.Mesh(frontFenceGeometry, fenceMaterial);
    backFence.position.set(0, fenceHeight / 2, 6);
    scene.add(backFence);

    // Side fences
    const sideFenceGeometry = new THREE.BoxGeometry(fenceThickness, fenceHeight, 12);
    
    const leftFence = new THREE.Mesh(sideFenceGeometry, fenceMaterial);
    leftFence.position.set(-6, fenceHeight / 2, 0);
    scene.add(leftFence);
    
    const rightFence = new THREE.Mesh(sideFenceGeometry, fenceMaterial);
    rightFence.position.set(6, fenceHeight / 2, 0);
    scene.add(rightFence);

    // Trees (simple)
    this.createTree(-4, 0, -4);
    this.createTree(4, 0, -4);
    this.createTree(-4, 0, 4);

    // Water bowl
    const bowlGeometry = new THREE.CylinderGeometry(0.5, 0.4, 0.3, 8);
    const bowlMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4299e1,
      flatShading: true 
    });
    const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
    bowl.position.set(3, 0.15, 3);
    scene.add(bowl);

    // Food bowl
    const foodBowl = new THREE.Mesh(bowlGeometry, new THREE.MeshPhongMaterial({ 
      color: 0xfbbf24,
      flatShading: true 
    }));
    foodBowl.position.set(-3, 0.15, 3);
    scene.add(foodBowl);
  }

  private createTree(x: number, y: number, z: number) {
    const scene = this.threeScene.getScene();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 6);
    const trunkMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x654321,
      flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 0.75, z);
    scene.add(trunk);

    // Foliage (pyramid)
    const foliageGeometry = new THREE.ConeGeometry(0.8, 1.5, 5);
    const foliageMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x228b22,
      flatShading: true
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 2.2, z);
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
    if (this.idleAnimation) {
      this.idleAnimation();
    }

    // Slowly rotate camera around beast
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    const angle = Date.now() * 0.0001;
    camera.position.x = Math.sin(angle) * 4;
    camera.position.z = Math.cos(angle) * 4;
    camera.lookAt(0, 0.8, 0);
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
    this.beastModel?.dispose();
    this.threeScene.dispose();
  }
}

