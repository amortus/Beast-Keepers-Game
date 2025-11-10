/**
 * Three.js Scene Manager
 * Beast Keepers - 3D Graphics Engine
 */

import * as THREE from 'three';

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Create scene
    this.scene = new THREE.Scene();
    // Background azul claro (caso skybox falhe)
    this.scene.background = new THREE.Color(0x87ceeb); // Azul céu

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // Create renderer with PS1 optimizations
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,           // Antialiasing para suavizar (não queremos Minecraft)
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    // ✅ Usa tamanho REAL do CSS, não o lógico do canvas
    const rect = canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false); // false = não atualiza style
    this.renderer.setPixelRatio(1.0);     // Resolução normal (PS1 smooth, não Minecraft)
    this.renderer.shadowMap.enabled = false; // Disable shadows for performance
    
    // Add basic lighting
    this.setupLighting();
  }

  private setupLighting() {
    // Lighting estilo Pokémon (clara, vibrante e alegre)
    
    // Ambient light (iluminação base muito clara)
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    // Main directional light (sol vibrante)
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(5, 10, 5);
    directional.castShadow = false;
    this.scene.add(directional);

    // Fill light (azul céu suave)
    const fill = new THREE.DirectionalLight(0xbbdefb, 0.4);
    fill.position.set(-5, 5, -5);
    this.scene.add(fill);
  }

  public addObject(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public startAnimationLoop(callback?: (delta: number) => void) {
    let lastTime = 0;
    
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (callback) {
        callback(delta);
      }

      this.render();
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  public stopAnimationLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public dispose() {
    this.stopAnimationLoop();
    this.renderer.dispose();
  }
}

