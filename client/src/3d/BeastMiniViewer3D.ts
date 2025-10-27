/**
 * Beast Mini Viewer 3D - Compact 3D viewer for ranch UI
 * Small embedded 3D view of the beast in the ranch screen
 */

import * as THREE from 'three';
import type { Beast } from '../types';
import { generateBeastModel, type BeastLine } from './models/BeastModels';

export class BeastMiniViewer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private beastModel: THREE.Group | null = null;
  private animationFrameId: number | null = null;
  private container: HTMLElement;
  
  // Animation state
  private time = 0;
  private baseYPosition = -2.0; // Store the base Y position (centered)
  
  constructor(container: HTMLElement, beast: Beast, width: number = 120, height: number = 120) {
    this.container = container;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6a3d7a); // Bright purple for visibility
    console.log('[MiniViewer3D] Scene created with purple background');
    
    // Setup camera (closer to see the model better)
    this.camera = new THREE.PerspectiveCamera(
      50, // FOV (wider for small viewport)
      width / height,
      0.1,
      100
    );
    this.camera.position.set(2.5, 0.6, 3);
    this.camera.lookAt(0, -0.4, 0);
    console.log('[MiniViewer3D] Camera positioned at (2.5, 0.6, 3) looking at (0, -0.4, 0)');
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Style the canvas for visibility
    this.renderer.domElement.style.display = 'block';
    
    container.appendChild(this.renderer.domElement);
    
    console.log(`[MiniViewer3D] ✓ Renderer created: ${width}x${height}`);
    console.log('[MiniViewer3D] Canvas appended to container:', container.id);
    console.log('[MiniViewer3D] Canvas element:', this.renderer.domElement);
    
    this.setupScene();
    this.loadBeastModel(beast);
    this.animate();
  }
  
  private setupScene() {
    console.log('[MiniViewer3D] Setting up lights...');
    
    // Add VERY strong ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);
    console.log('[MiniViewer3D] ✓ Ambient light added (120%)');
    
    // Add directional light (key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(3, 5, 3);
    this.scene.add(directionalLight);
    console.log('[MiniViewer3D] ✓ Directional light added');
    
    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 2, -2);
    this.scene.add(fillLight);
    console.log('[MiniViewer3D] ✓ Fill light added');
  }
  
  private loadBeastModel(beast: Beast) {
    console.log('[MiniViewer3D] ========== START MODEL LOADING ==========');
    console.log('[MiniViewer3D] Beast:', beast.name, '/', beast.line);
    
    try {
      // Generate 3D model for beast line
      const beastLine = beast.line.toLowerCase() as BeastLine;
      console.log('[MiniViewer3D] Generating model for line:', beastLine);
      
      this.beastModel = generateBeastModel(beastLine);
      console.log('[MiniViewer3D] ✓ Model generated, children:', this.beastModel.children.length);
      
      // Center and scale the model to fit the viewport
      const box = new THREE.Box3().setFromObject(this.beastModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      console.log('[MiniViewer3D] Model size:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
      console.log('[MiniViewer3D] Model center:', center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));
      
      // Calculate scale to fit in view (slightly larger for better visibility)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.8 / maxDim;
      
      this.beastModel.scale.setScalar(scale);
      
      // Center the model at origin
      const offset = center.clone().multiplyScalar(scale);
      this.beastModel.position.sub(offset);
      
      // Adjust Y position to center vertically in viewport (centered position)
      this.baseYPosition = -2.0;
      this.beastModel.position.y = this.baseYPosition;
      
      this.scene.add(this.beastModel);
      
      console.log('[MiniViewer3D] ✓ Model added to scene (scale:', scale.toFixed(2), ')');
      console.log('[MiniViewer3D] Scene children count:', this.scene.children.length);
      
    } catch (error) {
      console.error('[MiniViewer3D] ❌ ERRO ao carregar modelo:', error);
      console.error('[MiniViewer3D] Stack:', (error as Error).stack);
      
      // Fallback: bright colored cube for debugging
      const fallbackCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ 
          color: 0xff00ff, // Magenta
          wireframe: false
        })
      );
      fallbackCube.position.set(0, 0.5, 0);
      this.scene.add(fallbackCube);
      
      console.log('[MiniViewer3D] ✓ Fallback cube added (magenta)');
    }
    
    console.log('[MiniViewer3D] ========== END MODEL LOADING ==========');
  }
  
  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    this.time += 0.016; // ~60 FPS
    
    // Gentle idle animation
    if (this.beastModel) {
      // Subtle breathing - ADD to base position, don't overwrite!
      const breathingOffset = Math.sin(this.time * 2) * 0.05;
      this.beastModel.position.y = this.baseYPosition + breathingOffset;
      
      // Slow auto-rotation
      this.beastModel.rotation.y = this.time * 0.3;
    }
    
    // Render the scene
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('[MiniViewer3D] Render error:', error);
    }
  }
  
  // Update to new beast
  public updateBeast(beast: Beast) {
    // Remove old model
    if (this.beastModel) {
      this.scene.remove(this.beastModel);
      this.beastModel = null;
    }
    
    // Load new model
    this.loadBeastModel(beast);
  }
  
  // Cleanup
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.renderer.dispose();
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Dispose of all geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        }
      }
    });
  }
  
  // Handle resize
  public onResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

