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
    this.scene.background = new THREE.Color(0x0f0f1e);
    this.scene.fog = new THREE.Fog(0x0f0f1e, 10, 50);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: false, // PS1 style - no antialiasing
      alpha: false
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(1); // Low-poly style - keep it pixelated

    // Add basic lighting
    this.setupLighting();

    // Add grid for reference
    this.setupGrid();
  }

  private setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Directional light (main light)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 5);
    directional.castShadow = true;
    this.scene.add(directional);

    // Rim light (para destacar silhuetas)
    const rim = new THREE.DirectionalLight(0x4444ff, 0.3);
    rim.position.set(-5, 5, -5);
    this.scene.add(rim);
  }

  private setupGrid() {
    // Grid helper (pode ser removido depois)
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    this.scene.add(gridHelper);
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

