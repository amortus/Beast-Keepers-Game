/**
 * Beast 3D Model Generator
 * Creates low-poly PS1-style beast models
 */

import * as THREE from 'three';

export class BeastModel {
  private group: THREE.Group;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();

  constructor(beastLine: string) {
    this.group = new THREE.Group();
    this.createModel(beastLine);
  }

  private createModel(beastLine: string) {
    // Create low-poly model based on beast line
    switch (beastLine) {
      case 'olgrim':
        this.createOlgrim();
        break;
      case 'terravox':
        this.createTerravox();
        break;
      case 'feralis':
        this.createFeralis();
        break;
      case 'brontis':
        this.createBrontis();
        break;
      case 'zephyra':
        this.createZephyra();
        break;
      case 'ignar':
        this.createIgnar();
        break;
      case 'mirella':
        this.createMirella();
        break;
      case 'umbrix':
        this.createUmbrix();
        break;
      case 'sylphid':
        this.createSylphid();
        break;
      case 'raukor':
        this.createRaukor();
        break;
      default:
        this.createDefaultBeast();
    }
  }

  // Olgrim - Olho flutuante com tentáculos
  private createOlgrim() {
    // Main eye body (sphere)
    const eyeGeometry = new THREE.SphereGeometry(0.8, 8, 6);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x9f7aea,
      flatShading: true 
    });
    const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeMesh.position.y = 1.5;
    this.group.add(eyeMesh);

    // Pupil
    const pupilGeometry = new THREE.SphereGeometry(0.3, 6, 4);
    const pupilMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x000000,
      flatShading: true 
    });
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.position.set(0, 1.5, 0.6);
    this.group.add(pupil);

    // Tentacles (4)
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4;
      const tentacle = this.createTentacle();
      tentacle.position.set(
        Math.cos(angle) * 0.6,
        1,
        Math.sin(angle) * 0.6
      );
      tentacle.rotation.z = angle;
      this.group.add(tentacle);
    }
  }

  private createTentacle(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.1, 0.05, 1.2, 4);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x7c5fd3,
      flatShading: true 
    });
    return new THREE.Mesh(geometry, material);
  }

  // Terravox - Golem de pedra
  private createTerravox() {
    // Body (cube with rough texture)
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b7355,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    this.group.add(body);

    // Head (smaller cube)
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 2;
    this.group.add(head);

    // Arms (cylinders)
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 6);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.8, 1, 0);
    this.group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.8, 1, 0);
    this.group.add(rightArm);

    // Eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 2.1, 0.4);
    this.group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 2.1, 0.4);
    this.group.add(rightEye);
  }

  // Feralis - Felino ágil
  private createFeralis() {
    // Body (elongated box)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.5, 1.2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x48bb78,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    this.group.add(body);

    // Head (smaller box)
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.8, 0.8);
    this.group.add(head);

    // Ears (pyramids)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
    
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 1.1, 0.8);
    this.group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 1.1, 0.8);
    this.group.add(rightEar);

    // Tail
    const tailGeometry = new THREE.CylinderGeometry(0.08, 0.04, 1, 4);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.6, -0.8);
    tail.rotation.x = Math.PI / 4;
    this.group.add(tail);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 4);
    const positions = [
      [-0.3, 0.25, 0.4],
      [0.3, 0.25, 0.4],
      [-0.3, 0.25, -0.4],
      [0.3, 0.25, -0.4]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });
  }

  // Brontis - Réptil bípede robusto
  private createBrontis() {
    // Body (large box)
    const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 1.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x38a169,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    this.group.add(body);

    // Head (box)
    const headGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.8, 1);
    this.group.add(head);

    // Legs (2 large ones - bípede)
    const legGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 6);
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.4, 0.5, 0);
    this.group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.4, 0.5, 0);
    this.group.add(rightLeg);

    // Tail (cone)
    const tailGeometry = new THREE.ConeGeometry(0.3, 1.5, 6);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.8, -1.2);
    tail.rotation.x = Math.PI / 2;
    this.group.add(tail);

    // Small arms
    const armGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 5);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.6, 1.4, 0.5);
    this.group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.6, 1.4, 0.5);
    this.group.add(rightArm);
  }

  // Zephyra - Ave veloz
  private createZephyra() {
    // Body (small)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 6, 5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x63b3ed,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    this.group.add(body);

    // Head (smaller sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 5, 4);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.8, 0.4);
    this.group.add(head);

    // Beak (cone)
    const beakGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
    const beakMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffa500,
      flatShading: true 
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 1.8, 0.7);
    beak.rotation.x = Math.PI / 2;
    this.group.add(beak);

    // Wings (triangular planes)
    const wingGeometry = new THREE.ConeGeometry(0.6, 1.2, 3);
    
    const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial);
    leftWing.position.set(-0.6, 1.5, 0);
    leftWing.rotation.z = Math.PI / 2;
    this.group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, bodyMaterial);
    rightWing.position.set(0.6, 1.5, 0);
    rightWing.rotation.z = -Math.PI / 2;
    this.group.add(rightWing);

    // Tail feathers
    const tailGeometry = new THREE.ConeGeometry(0.2, 0.8, 3);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 1.3, -0.6);
    tail.rotation.x = -Math.PI / 4;
    this.group.add(tail);
  }

  // Ignar - Fera elemental de fogo
  private createIgnar() {
    // Body (aggressive shape)
    const bodyGeometry = new THREE.BoxGeometry(1.1, 0.9, 1.4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xfc8181,
      flatShading: true,
      emissive: 0xff4444,
      emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    this.group.add(body);

    // Head (box with horns)
    const headGeometry = new THREE.BoxGeometry(0.8, 0.7, 0.7);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.2, 0.9);
    this.group.add(head);

    // Horns (cones)
    const hornGeometry = new THREE.ConeGeometry(0.15, 0.5, 4);
    const hornMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b0000,
      flatShading: true 
    });
    
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(-0.3, 1.7, 0.9);
    this.group.add(leftHorn);
    
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(0.3, 1.7, 0.9);
    this.group.add(rightHorn);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.7, 5);
    const positions = [
      [-0.4, 0.35, 0.5],
      [0.4, 0.35, 0.5],
      [-0.4, 0.35, -0.5],
      [0.4, 0.35, -0.5]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });

    // Flame particles (simple)
    const flameGeometry = new THREE.ConeGeometry(0.2, 0.5, 4);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.7
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(0, 0.5, -0.9);
    flame.rotation.x = Math.PI;
    this.group.add(flame);
  }

  // Raukor - Fera lupina (lobo)
  private createRaukor() {
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.7, 0.6, 1.3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xa0aec0,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    this.group.add(body);

    // Head (elongated)
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.9, 1);
    this.group.add(head);

    // Snout (cone)
    const snoutGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
    const snout = new THREE.Mesh(snoutGeometry, bodyMaterial);
    snout.position.set(0, 0.9, 1.5);
    snout.rotation.x = Math.PI / 2;
    this.group.add(snout);

    // Ears (cones)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
    
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 1.3, 0.9);
    this.group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 1.3, 0.9);
    this.group.add(rightEar);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 5);
    const positions = [
      [-0.3, 0.3, 0.5],
      [0.3, 0.3, 0.5],
      [-0.3, 0.3, -0.4],
      [0.3, 0.3, -0.4]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.7, -0.9);
    tail.rotation.x = -Math.PI / 4;
    this.group.add(tail);
  }

  // Default beast (placeholder para linhas não implementadas ainda)
  private createDefaultBeast() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x666666,
      flatShading: true 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.5;
    this.group.add(mesh);
  }

  // Placeholder methods para outras bestas (implementar depois)
  private createMirella() { this.createDefaultBeast(); }
  private createUmbrix() { this.createDefaultBeast(); }
  private createSylphid() { this.createDefaultBeast(); }

  // Simple idle animation
  public playIdleAnimation() {
    // Breathing/bobbing animation
    const startY = this.group.position.y;
    let time = 0;

    const animate = () => {
      time += 0.02;
      this.group.position.y = startY + Math.sin(time) * 0.1;
      this.group.rotation.y += 0.005;
    };

    return animate;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public dispose() {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}

