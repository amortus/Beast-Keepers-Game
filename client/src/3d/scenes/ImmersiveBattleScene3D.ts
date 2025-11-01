/**
 * Immersive 3D Battle Scene - Pokémon Arceus Style
 * Beast Keepers - Cinematic 3D battle visualization
 */

import * as THREE from 'three';
import { generateBeastModel, type BeastLine } from '../models/BeastModels';

export type CameraAngle = 'wide' | 'player' | 'enemy' | 'overhead' | 'cinematic';
export type BattleAnimation = 'idle' | 'attack' | 'hit' | 'defend' | 'victory' | 'defeat';

interface BeastActor {
  model: THREE.Group;
  basePosition: THREE.Vector3;
  currentAnimation: BattleAnimation;
  animationTime: number;
  health: number;
  maxHealth: number;
}

export class ImmersiveBattleScene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  // Battle actors
  private playerBeast: BeastActor | null = null;
  private enemyBeast: BeastActor | null = null;
  
  // Environment
  private arena: THREE.Group;
  private lighting: THREE.Group;
  private particles: THREE.Points[] = [];
  
  // Camera system
  private currentCameraAngle: CameraAngle = 'wide';
  private cameraTargetPosition: THREE.Vector3;
  private cameraTargetLookAt: THREE.Vector3;
  private cameraTransitionSpeed: number = 0.05;
  
  // Animation
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private time: number = 0;
  
  // Effects
  private attackEffects: THREE.Group[] = [];

  constructor(container: HTMLElement, width: number, height: number) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a1a, 15, 40);
    
    // Camera setup (cinematic perspective)
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.cameraTargetPosition = new THREE.Vector3(0, 5, 12);
    this.cameraTargetLookAt = new THREE.Vector3(0, 1, 0);
    this.camera.position.copy(this.cameraTargetPosition);
    this.camera.lookAt(this.cameraTargetLookAt);
    
    // Renderer setup (high quality)
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    container.appendChild(this.renderer.domElement);
    
    this.clock = new THREE.Clock();
    this.arena = new THREE.Group();
    this.lighting = new THREE.Group();
    
    this.setupEnvironment();
    this.startAnimationLoop();
  }

  private setupEnvironment() {
    // Sky gradient background
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    // Setup arena
    this.createBattleArena();
    
    // Setup lighting (dramatic, cinematic)
    this.setupCinematicLighting();
    
    // Add atmospheric effects
    this.createAtmosphericParticles();
  }

  private createBattleArena() {
    // Main platform (hexagonal)
    const hexRadius = 10;
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * hexRadius;
      const y = Math.sin(angle) * hexRadius;
      if (i === 0) hexShape.moveTo(x, y);
      else hexShape.lineTo(x, y);
    }
    hexShape.closePath();
    
    const hexGeometry = new THREE.ExtrudeGeometry(hexShape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    });
    
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d44,
      roughness: 0.7,
      metalness: 0.3,
    });
    
    const platform = new THREE.Mesh(hexGeometry, platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.receiveShadow = true;
    this.arena.add(platform);
    
    // Glowing edge lines
    const edgeGeometry = new THREE.TorusGeometry(hexRadius, 0.15, 8, 6);
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0x9f7aea,
      emissive: 0x9f7aea,
      emissiveIntensity: 1.5,
    });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.2;
    this.arena.add(edge);
    
    // Center symbol (circle with inner glow)
    const centerGeometry = new THREE.CircleGeometry(2, 32);
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: 0x6b46c1,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const centerSymbol = new THREE.Mesh(centerGeometry, centerMaterial);
    centerSymbol.rotation.x = -Math.PI / 2;
    centerSymbol.position.y = 0.31;
    this.arena.add(centerSymbol);
    
    // Energy pillars (6 corners)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * (hexRadius - 1);
      const z = Math.sin(angle) * (hexRadius - 1);
      
      this.createEnergyPillar(x, z);
    }
    
    // Player zone marker (left)
    this.createZoneMarker(-4, 0, 0x48bb78, 'left');
    
    // Enemy zone marker (right)
    this.createZoneMarker(4, 0, 0xfc8181, 'right');
    
    this.scene.add(this.arena);
  }

  private createEnergyPillar(x: number, z: number) {
    const pillarGroup = new THREE.Group();
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 6);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.8,
      metalness: 0.4,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.15;
    base.castShadow = true;
    pillarGroup.add(base);
    
    // Energy beam (glowing)
    const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x9f7aea,
      transparent: true,
      opacity: 0.6,
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 2.3;
    pillarGroup.add(beam);
    
    // Crystal on top
    const crystalGeometry = new THREE.OctahedronGeometry(0.4, 0);
    const crystalMaterial = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      emissive: 0xfbbf24,
      emissiveIntensity: 2,
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.position.y = 4.5;
    pillarGroup.add(crystal);
    
    pillarGroup.position.set(x, 0, z);
    this.arena.add(pillarGroup);
  }

  private createZoneMarker(x: number, z: number, color: number, side: 'left' | 'right') {
    const ringGeometry = new THREE.RingGeometry(1.5, 1.8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.31, z);
    
    this.arena.add(ring);
  }

  private setupCinematicLighting() {
    // Ambient light (soft base)
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    this.lighting.add(ambient);
    
    // Main key light (from above-front)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 15, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    this.lighting.add(keyLight);
    
    // Fill light (from side)
    const fillLight = new THREE.DirectionalLight(0x9f7aea, 0.6);
    fillLight.position.set(-8, 8, 5);
    this.lighting.add(fillLight);
    
    // Rim light (from behind, creates silhouette)
    const rimLight = new THREE.DirectionalLight(0xfbbf24, 0.8);
    rimLight.position.set(0, 10, -15);
    this.lighting.add(rimLight);
    
    // Spot lights on beasts (dramatic)
    const playerSpotlight = new THREE.SpotLight(0x48bb78, 1.5, 20, Math.PI / 6, 0.5);
    playerSpotlight.position.set(-4, 10, 5);
    playerSpotlight.target.position.set(-4, 0, 0);
    this.lighting.add(playerSpotlight);
    this.lighting.add(playerSpotlight.target);
    
    const enemySpotlight = new THREE.SpotLight(0xfc8181, 1.5, 20, Math.PI / 6, 0.5);
    enemySpotlight.position.set(4, 10, 5);
    enemySpotlight.target.position.set(4, 0, 0);
    this.lighting.add(enemySpotlight);
    this.lighting.add(enemySpotlight.target);
    
    this.scene.add(this.lighting);
  }

  private createAtmosphericParticles() {
    // Floating dust particles
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = Math.random() * 15;
      positions[i + 2] = (Math.random() - 0.5) * 40;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.particles.push(particles);
    this.scene.add(particles);
  }

  /**
   * Load player beast into the scene
   */
  public setPlayerBeast(beastLine: string) {
    console.log('[ImmersiveBattle] Loading player beast:', beastLine);
    
    // Remove previous model
    if (this.playerBeast) {
      this.scene.remove(this.playerBeast.model);
    }
    
    // Create new model
    const model = generateBeastModel(beastLine.toLowerCase() as BeastLine);
    model.position.set(-4, 0, 0);
    model.rotation.y = Math.PI / 4; // Face towards enemy
    model.castShadow = true;
    model.receiveShadow = true;
    
    // Apply shadows to all children
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    this.scene.add(model);
    
    this.playerBeast = {
      model,
      basePosition: new THREE.Vector3(-4, 0, 0),
      currentAnimation: 'idle',
      animationTime: 0,
      health: 100,
      maxHealth: 100
    };
    
    console.log('[ImmersiveBattle] ✓ Player beast loaded');
  }

  /**
   * Load enemy beast into the scene
   */
  public setEnemyBeast(beastLine: string) {
    console.log('[ImmersiveBattle] Loading enemy beast:', beastLine);
    
    // Remove previous model
    if (this.enemyBeast) {
      this.scene.remove(this.enemyBeast.model);
    }
    
    // Create new model
    const model = generateBeastModel(beastLine.toLowerCase() as BeastLine);
    model.position.set(4, 0, 0);
    model.rotation.y = -Math.PI / 4; // Face towards player
    model.castShadow = true;
    model.receiveShadow = true;
    
    // Apply shadows to all children
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    this.scene.add(model);
    
    this.enemyBeast = {
      model,
      basePosition: new THREE.Vector3(4, 0, 0),
      currentAnimation: 'idle',
      animationTime: 0,
      health: 100,
      maxHealth: 100
    };
    
    console.log('[ImmersiveBattle] ✓ Enemy beast loaded');
  }

  /**
   * Change camera angle (cinematic cuts)
   */
  public setCameraAngle(angle: CameraAngle) {
    this.currentCameraAngle = angle;
    
    switch (angle) {
      case 'wide':
        // Wide shot: See both beasts
        this.cameraTargetPosition.set(0, 5, 12);
        this.cameraTargetLookAt.set(0, 1, 0);
        break;
      
      case 'player':
        // Focus on player beast
        this.cameraTargetPosition.set(-6, 3, 5);
        this.cameraTargetLookAt.set(-4, 1, 0);
        break;
      
      case 'enemy':
        // Focus on enemy beast
        this.cameraTargetPosition.set(6, 3, 5);
        this.cameraTargetLookAt.set(4, 1, 0);
        break;
      
      case 'overhead':
        // Top-down view
        this.cameraTargetPosition.set(0, 15, 5);
        this.cameraTargetLookAt.set(0, 0, 0);
        break;
      
      case 'cinematic':
        // Dynamic cinematic angle
        this.cameraTargetPosition.set(-3, 6, 10);
        this.cameraTargetLookAt.set(2, 2, 0);
        break;
    }
  }

  /**
   * Play attack animation
   */
  public playAttackAnimation(attacker: 'player' | 'enemy', target: 'player' | 'enemy') {
    console.log(`[ImmersiveBattle] Attack: ${attacker} -> ${target}`);
    
    const attackerBeast = attacker === 'player' ? this.playerBeast : this.enemyBeast;
    const targetBeast = target === 'player' ? this.playerBeast : this.enemyBeast;
    
    if (!attackerBeast || !targetBeast) return;
    
    // Change camera to focus on attacker
    this.setCameraAngle(attacker === 'player' ? 'player' : 'enemy');
    
    // Set animation state
    attackerBeast.currentAnimation = 'attack';
    attackerBeast.animationTime = 0;
    
    // Create attack effect
    this.createAttackEffect(attackerBeast.model.position, targetBeast.model.position);
    
    // After animation, set target to hit
    setTimeout(() => {
      targetBeast.currentAnimation = 'hit';
      targetBeast.animationTime = 0;
      
      // Return to wide shot
      setTimeout(() => {
        this.setCameraAngle('wide');
        attackerBeast.currentAnimation = 'idle';
        targetBeast.currentAnimation = 'idle';
      }, 500);
    }, 600);
  }

  private createAttackEffect(from: THREE.Vector3, to: THREE.Vector3) {
    const effectGroup = new THREE.Group();
    
    // Energy projectile
    const projectileGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const projectileMaterial = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      emissive: 0xfbbf24,
      emissiveIntensity: 2,
    });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    
    // Trail particles
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(50 * 3);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    
    const trailMaterial = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const trail = new THREE.Points(trailGeometry, trailMaterial);
    
    effectGroup.add(projectile);
    effectGroup.add(trail);
    effectGroup.position.copy(from);
    
    this.scene.add(effectGroup);
    this.attackEffects.push(effectGroup);
    
    // Animate projectile
    const startTime = Date.now();
    const duration = 500;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Move projectile
      projectile.position.lerpVectors(from, to, progress);
      
      // Update trail
      const positions = trail.geometry.attributes.position.array as Float32Array;
      for (let i = positions.length - 3; i >= 3; i -= 3) {
        positions[i] = positions[i - 3];
        positions[i + 1] = positions[i - 2];
        positions[i + 2] = positions[i - 1];
      }
      positions[0] = projectile.position.x;
      positions[1] = projectile.position.y + 1;
      positions[2] = projectile.position.z;
      trail.geometry.attributes.position.needsUpdate = true;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove effect
        this.scene.remove(effectGroup);
        const index = this.attackEffects.indexOf(effectGroup);
        if (index > -1) this.attackEffects.splice(index, 1);
        
        // Create impact effect
        this.createImpactEffect(to);
      }
    };
    
    animate();
  }

  private createImpactEffect(position: THREE.Vector3) {
    const impactGeometry = new THREE.SphereGeometry(1, 16, 16);
    const impactMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8,
    });
    const impact = new THREE.Mesh(impactGeometry, impactMaterial);
    impact.position.copy(position);
    impact.position.y += 1;
    
    this.scene.add(impact);
    
    // Animate expansion and fade
    const startTime = Date.now();
    const duration = 300;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        impact.scale.setScalar(1 + progress * 2);
        impactMaterial.opacity = 0.8 * (1 - progress);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(impact);
      }
    };
    
    animate();
  }

  /**
   * Update beast health
   */
  public updateHealth(beast: 'player' | 'enemy', health: number, maxHealth: number) {
    const actor = beast === 'player' ? this.playerBeast : this.enemyBeast;
    if (actor) {
      actor.health = health;
      actor.maxHealth = maxHealth;
    }
  }

  /**
   * Animation loop
   */
  private startAnimationLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      const delta = this.clock.getDelta();
      this.time += delta;
      
      this.updateAnimations(delta);
      this.updateCamera(delta);
      this.updateParticles(delta);
      
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  private updateAnimations(delta: number) {
    // Update player beast animation
    if (this.playerBeast) {
      this.updateBeastAnimation(this.playerBeast, delta);
    }
    
    // Update enemy beast animation
    if (this.enemyBeast) {
      this.updateBeastAnimation(this.enemyBeast, delta);
    }
    
    // Rotate crystals on pillars
    this.arena.children.forEach(child => {
      if (child instanceof THREE.Group) {
        child.children.forEach(grandchild => {
          if (grandchild instanceof THREE.Mesh && grandchild.geometry instanceof THREE.OctahedronGeometry) {
            grandchild.rotation.y += delta * 2;
          }
        });
      }
    });
  }

  private updateBeastAnimation(beast: BeastActor, delta: number) {
    beast.animationTime += delta;
    
    switch (beast.currentAnimation) {
      case 'idle':
        // Gentle breathing/floating
        const breathe = Math.sin(beast.animationTime * 2) * 0.1;
        beast.model.position.y = beast.basePosition.y + breathe;
        beast.model.rotation.y += delta * 0.5;
        break;
      
      case 'attack':
        // Lunge forward
        const attackProgress = Math.min(beast.animationTime / 0.3, 1);
        const lunge = Math.sin(attackProgress * Math.PI) * 0.5;
        beast.model.position.z = beast.basePosition.z + lunge;
        beast.model.scale.setScalar(1 + lunge * 0.2);
        break;
      
      case 'hit':
        // Recoil back
        const hitProgress = Math.min(beast.animationTime / 0.2, 1);
        const recoil = Math.sin(hitProgress * Math.PI) * -0.3;
        beast.model.position.z = beast.basePosition.z + recoil;
        
        // Flash red
        beast.model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (mat.emissive) {
              mat.emissive.setHex(0xff0000);
              mat.emissiveIntensity = 1 - hitProgress;
            }
          }
        });
        break;
      
      case 'defend':
        // Crouch/brace
        beast.model.scale.y = 0.9;
        break;
      
      case 'victory':
        // Jump and celebrate
        const victoryProgress = beast.animationTime % 2;
        beast.model.position.y = beast.basePosition.y + Math.abs(Math.sin(victoryProgress * Math.PI)) * 1.5;
        beast.model.rotation.y = beast.animationTime * 2;
        break;
      
      case 'defeat':
        // Fall down
        const defeatProgress = Math.min(beast.animationTime / 1.5, 1);
        beast.model.rotation.x = defeatProgress * Math.PI / 2;
        beast.model.position.y = beast.basePosition.y * (1 - defeatProgress);
        break;
    }
  }

  private updateCamera(delta: number) {
    // Smooth camera transition
    this.camera.position.lerp(this.cameraTargetPosition, this.cameraTransitionSpeed);
    
    // Look at target with smooth transition
    const currentLookAt = new THREE.Vector3();
    this.camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10).add(this.camera.position);
    currentLookAt.lerp(this.cameraTargetLookAt, this.cameraTransitionSpeed);
    this.camera.lookAt(currentLookAt);
    
    // Add subtle camera shake during attacks
    if (this.playerBeast?.currentAnimation === 'attack' || this.enemyBeast?.currentAnimation === 'attack') {
      this.camera.position.x += (Math.random() - 0.5) * 0.02;
      this.camera.position.y += (Math.random() - 0.5) * 0.02;
    }
  }

  private updateParticles(delta: number) {
    // Animate floating particles
    this.particles.forEach(particleSystem => {
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= delta * 0.5; // Fall slowly
        
        // Reset if below ground
        if (positions[i + 1] < 0) {
          positions[i + 1] = 15;
        }
      }
      
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.rotation.y += delta * 0.1;
    });
  }

  /**
   * Resize renderer
   */
  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up
   */
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        }
      }
    });
    
    this.renderer.dispose();
    
    console.log('[ImmersiveBattle] Disposed');
  }

  /**
   * Get renderer DOM element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}

