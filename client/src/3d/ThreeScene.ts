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
    const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.8) : 1;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add basic lighting
    this.setupLighting();
  }

  private setupLighting() {
    // Lighting estilo Pokémon (clara, vibrante e alegre)
    
    const ambient = new THREE.HemisphereLight(0xf0f6ff, 0x2c1e13, 0.7);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(8, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfff4d2, 0.35);
    rimLight.position.set(-6, 5, -4);
    this.scene.add(rimLight);
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

