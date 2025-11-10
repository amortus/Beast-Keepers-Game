/**
 * 3D Ranch Scene - PS1 Style
 * Beast Keepers - Three.js ranch visualization with Monster Rancher aesthetic
 */

import * as THREE from 'three';
import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { PS1Grass } from '../vegetation/PS1Grass';
import { PS1Water } from '../water/PS1Water';
import { RanchCritters } from '../events/RanchCritters';

// Obstáculos no rancho (para pathfinding)
interface Obstacle {
  x: number;
  z: number;
  radius: number;
}

export class RanchScene3D {
  private threeScene: ThreeScene;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;
  private needsFit = false;
  private baseYPosition = 0;
  private activeRigAnimation: string | null = null;
  private grass: PS1Grass | null = null; // Grama procedural
  private water: PS1Water | null = null; // Água animada
  private mountains: THREE.Group | null = null; // Colinas distantes
  private clouds: THREE.Group | null = null; // Nuvens
  private critters: RanchCritters | null = null; // Bichinhos aleatórios
  
  // Sistema de movimento
  private obstacles: Obstacle[] = [];
  private currentTarget: THREE.Vector3 | null = null;
  private isMoving: boolean = false;
  private moveSpeed: number = 1.5; // Unidades por segundo
  private nextMoveTime: number = 0; // Tempo até próximo movimento

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupRanchEnvironment();
  }

  private setupRanchEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    
    // Câmera estilo Pokémon (ângulo isométrico levemente alto)
    camera.fov = 47;
    camera.position.set(0, 5.6, 9.2);
    camera.lookAt(0, 1.2, 0);
    camera.updateProjectionMatrix();
    
    // Céu azul profundo com leve névoa cinematográfica
    scene.background = new THREE.Color(0x0f1b2e);
    scene.fog = new THREE.Fog(0x0f1b2e, 22, 60);
    
    // Colinas VISÍVEIS no horizonte (mais próximas)
    this.createVisibleHills();
    
    // Nuvens VISÍVEIS no céu (mais próximas e maiores)
    this.createVisibleClouds();
    
    // Chão estilizado com relevo suave e materiais PBR
    this.createPokemonGround();
    this.createStonePath();
    
    // Lago/bebedouro ANIMADO com ondas
    this.createAnimatedLake();
    
    // Grama blade real (PS1Grass)
    this.createRealGrass();
    
    // Flores elaboradas com pétalas
    this.createElaborateFlowers();
    
    // Árvores cartoon arredondadas (longe do lago)
    this.createPokemonTree(-4, 0, -3); // Árvore esquerda-trás
    this.createPokemonTree(4, 0, 1); // Árvore direita - MOVIDA MAIS PARA BAIXO (Z: -3 → 1)
    
    // Pedras decorativas
    this.createRocks();
    
    // Casa 3D melhorada
    this.createImprovedHouse();
    
    // Cerca de fundo separando rancho das terras selvagens
    this.createBackgroundFence();
    this.createLanterns();
    
    // Food bowl colorido
    const bowlGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.26, 24);
    const foodBowl = new THREE.Mesh(
      bowlGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        roughness: 0.45,
        metalness: 0.15,
      }),
    );
    foodBowl.castShadow = true;
    foodBowl.receiveShadow = true;
    foodBowl.position.set(-3, 0.14, 3);
    scene.add(foodBowl);
    
    // Definir obstáculos para pathfinding
    this.setupObstacles();
    
    // Iniciar sistema de bichinhos aleatórios
    this.critters = new RanchCritters(scene);
  }
  
  /**
   * Definir todos os obstáculos do rancho
   */
  private setupObstacles() {
    this.obstacles = [
      // Lago
      { x: 1.5, z: 3.5, radius: 1.8 },
      
      // Casa
      { x: 0, z: -7, radius: 2.5 },
      
      // Árvores (atualizadas)
      { x: -4, z: -3, radius: 0.8 }, // Esquerda-trás
      { x: 4, z: 1, radius: 0.8 },   // Direita (movida mais para baixo)
      
      // Food bowl
      { x: -3, z: 3, radius: 0.5 },
      
      // Pedras (principais)
      { x: -2, z: -4, radius: 0.4 },
      { x: 3, z: -3.5, radius: 0.4 },
      { x: -4, z: 2, radius: 0.4 },
      { x: 4.5, z: 1, radius: 0.4 },
      // Lanternas decorativas
      { x: -2.2, z: -2.2, radius: 0.35 },
      { x: 2.3, z: -2.0, radius: 0.35 },
      { x: -2.6, z: 2.6, radius: 0.35 },
      
      // Cerca de fundo (evitar área externa)
      // Múltiplos pontos ao redor da cerca
    ];
    
    // Adicionar pontos de colisão ao redor da cerca (raio 9)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.obstacles.push({
        x: Math.cos(angle) * 9,
        z: Math.sin(angle) * 9,
        radius: 0.5
      });
    }
  }
  
  /**
   * Verificar se uma posição é válida (não colide com obstáculos)
   */
  private isPositionValid(x: number, z: number, minClearance: number = 0.5): boolean {
    // Verificar limites do rancho (dentro da cerca de fundo)
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 7.5) { // Manter dentro de raio seguro
      return false;
    }
    
    // Verificar colisão com cada obstáculo
    for (const obstacle of this.obstacles) {
      const dist = Math.sqrt(
        (x - obstacle.x) ** 2 + 
        (z - obstacle.z) ** 2
      );
      
      if (dist < obstacle.radius + minClearance) {
        return false; // Colidiu!
      }
    }
    
    return true; // Posição válida!
  }
  
  /**
   * Escolher próximo ponto de movimento aleatório (válido, preferindo centro)
   */
  private chooseNextMovePoint(): THREE.Vector3 | null {
    const maxAttempts = 30;
    
    if (!this.beastGroup) return null;
    
    const currentPos = this.beastGroup.position;
    const distFromCenter = Math.sqrt(currentPos.x ** 2 + currentPos.z ** 2);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Se longe do centro (>5), preferir pontos mais centrais
      let x, z;
      
      if (distFromCenter > 5) {
        // 80% chance de escolher ponto mais perto do centro
        if (Math.random() < 0.8) {
          x = (Math.random() - 0.5) * 6; // -3 a 3 (área central)
          z = (Math.random() - 0.5) * 6;
        } else {
          x = (Math.random() - 0.5) * 12; // -6 a 6
          z = (Math.random() - 0.5) * 12;
        }
      } else {
        // Perto do centro, pode explorar mais
        x = (Math.random() - 0.5) * 12; // -6 a 6
        z = (Math.random() - 0.5) * 12;
      }
      
      if (this.isPositionValid(x, z, 0.8)) {
        return new THREE.Vector3(x, 0, z);
      }
    }
    
    return null; // Não encontrou posição válida
  }
  
  /**
   * Iniciar movimento para próximo ponto
   */
  private startNextMove() {
    const target = this.chooseNextMovePoint();
    
    if (target) {
      this.currentTarget = target;
      this.isMoving = true;
      if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('walk');
      }
    } else {
      // Não encontrou ponto válido, tentar novamente em breve
      this.nextMoveTime = 2;
    }
  }
  
  /**
   * Chão estilizado com leve relevo e materiais PBR
   */
  private createPokemonGround() {
    const scene = this.threeScene.getScene();

    const groundGeometry = new THREE.PlaneGeometry(26, 26, 80, 80);
    const positions = groundGeometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const radialFalloff = 1 - Math.min(1, Math.sqrt(x * x + z * z) / 13);
      const noise =
        Math.sin(x * 0.28) * 0.12 +
        Math.cos(z * 0.24) * 0.08 +
        Math.sin((x + z) * 0.18) * 0.05;

      positions.setY(i, noise * radialFalloff);
    }
    positions.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f7652,
      roughness: 0.82,
      metalness: 0.05,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const borderGeometry = new THREE.RingGeometry(13.4, 14.6, 64);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x3c291d,
      roughness: 0.92,
      metalness: 0.03,
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = -0.03;
    border.receiveShadow = true;
    scene.add(border);

    const centerGeometry = new THREE.CircleGeometry(4.2, 48);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: 0x5e8f64,
      roughness: 0.78,
      metalness: 0.04,
    });
    const centerPatch = new THREE.Mesh(centerGeometry, centerMaterial);
    centerPatch.rotation.x = -Math.PI / 2;
    centerPatch.position.y = 0.015;
    centerPatch.receiveShadow = true;
    scene.add(centerPatch);
  }

  /**
   * Passarela de pedras entre a casa e o centro do rancho
   */
  private createStonePath() {
    const scene = this.threeScene.getScene();
    const pathGroup = new THREE.Group();

    const stoneGeometry = new THREE.CylinderGeometry(0.45, 0.5, 0.08, 12);
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xb9a98c,
      roughness: 0.68,
      metalness: 0.04,
    });

    const steps = 9;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const z = THREE.MathUtils.lerp(-5.5, 1.2, t) + Math.sin(t * Math.PI) * 0.3;
      const x = Math.sin(t * Math.PI * 0.5) * 0.4;

      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.castShadow = true;
      stone.receiveShadow = true;
      stone.position.set(x + (Math.random() - 0.5) * 0.2, 0.04, z + (Math.random() - 0.5) * 0.2);
      stone.rotation.y = Math.random() * Math.PI;
      stone.scale.setScalar(0.9 + Math.random() * 0.15);
      pathGroup.add(stone);
    }

    scene.add(pathGroup);
  }
  
  /**
   * Grama blade real usando PS1Grass (evitando lago)
   */
  private createRealGrass() {
    const scene = this.threeScene.getScene();
    
    this.grass = new PS1Grass({
      count: 650,
      area: 16,
      color: 0x3f6d3f,
      height: 0.28,
      windSpeed: 0.32,
      windStrength: 0.014,
      lakePosition: { x: 1.5, z: 3.5 },
      lakeRadius: 1.8,
    });
    scene.add(this.grass.getMesh());
  }
  
  /**
   * Flores elaboradas com pétalas
   */
  private createElaborateFlowers() {
    const scene = this.threeScene.getScene();
    const flowerColors = [
      0xffa0c0, // Rosa
      0xffd65c, // Amarelo
      0xff9159, // Laranja
      0xb074ff, // Roxo
      0xff6d7a, // Vermelho
    ];
    
    // Espalhar flores LONGE DO LAGO (evitar área do lago: x=1.5, z=3.5, raio=1.7)
    for (let i = 0; i < 40; i++) {
      let x, z;
      let attempts = 0;
      
      // Tentar encontrar posição longe do lago
      do {
        x = (Math.random() - 0.5) * 16;
        z = (Math.random() - 0.5) * 16;
        
        // Calcular distância do lago
        const distToLake = Math.sqrt((x - 1.5) ** 2 + (z - 3.5) ** 2);
        
        // Se longe o suficiente, usar essa posição
        if (distToLake > 2.5) break;
        
        attempts++;
      } while (attempts < 10);
      
      // Se não encontrou posição boa, pular
      if (attempts >= 10) continue;
      
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const flowerGroup = new THREE.Group();
      
      // Caule (haste verde)
      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6);
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4a21, roughness: 0.8 });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.castShadow = true;
      stem.position.y = 0.11;
      flowerGroup.add(stem);
      
      // Centro da flor (amarelo)
      const centerGeometry = new THREE.SphereGeometry(0.05, 12, 12);
      const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffe27a, roughness: 0.4, metalness: 0.1, emissive: 0x70531a });
      const center = new THREE.Mesh(centerGeometry, centerMaterial);
      center.castShadow = true;
      center.position.y = 0.23;
      flowerGroup.add(center);
      
      // Pétalas (5 pétalas ao redor)
      const petalMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.0,
        emissive: 0x111111,
        emissiveIntensity: 0.15,
      });
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const petalGeometry = new THREE.SphereGeometry(0.06, 12, 12);
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.position.set(
          Math.cos(angle) * 0.08,
          0.2,
          Math.sin(angle) * 0.08
        );
        petal.scale.set(1.2, 0.45, 0.8);
        petal.castShadow = true;
        flowerGroup.add(petal);
      }
      
      flowerGroup.position.set(x, 0, z);
      flowerGroup.rotation.y = Math.random() * Math.PI;
      scene.add(flowerGroup);
    }
  }
  
  /**
   * Árvore cartoon estilo Pokémon
   */
  private createPokemonTree(x: number, y: number, z: number) {
    const scene = this.threeScene.getScene();
    const treeGroup = new THREE.Group();

    // Tronco - marrom cartoon
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.38, 2.0, 12, 1, false);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x76532d,
      roughness: 0.78,
      metalness: 0.08,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.position.y = 1.0;
    treeGroup.add(trunk);

    // Folhagem - esferas sobrepostas (estilo Pokémon)
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x56b072,
      roughness: 0.55,
      metalness: 0.05,
    });
    
    // 3 esferas para folhagem volumosa
    const foliage1 = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 16), foliageMaterial);
    foliage1.castShadow = true;
    foliage1.position.y = 2.6;
    treeGroup.add(foliage1);
    
    const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 14), foliageMaterial);
    foliage2.castShadow = true;
    foliage2.position.set(-0.45, 3.0, 0.15);
    treeGroup.add(foliage2);
    
    const foliage3 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 14), foliageMaterial);
    foliage3.castShadow = true;
    foliage3.position.set(0.55, 2.85, -0.25);
    treeGroup.add(foliage3);

    const topBud = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), foliageMaterial);
    topBud.castShadow = true;
    topBud.position.set(0.1, 3.45, -0.1);
    treeGroup.add(topBud);
    
    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = Math.random() * Math.PI;
    scene.add(treeGroup);
  }
  
  /**
   * Pedras decorativas
   */
  private createRocks() {
    const scene = this.threeScene.getScene();
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c8f95,
      roughness: 0.85,
      metalness: 0.1,
    });
    
    // Pedras espalhadas
    const rockPositions = [
      [-2, 0, -4],
      [3, 0, -3.5],
      [-4, 0, 2],
      [4.5, 0, 1],
    ];
    
    rockPositions.forEach(([x, y, z]) => {
      const rockGeometry = new THREE.DodecahedronGeometry(0.32 + Math.random() * 0.25, 1);
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.position.set(x, 0.23, z);
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(rock);
    });
  }
  
  /**
   * Lago ANIMADO com ondas (usando PS1Water)
   */
  private createAnimatedLake() {
    const scene = this.threeScene.getScene();
    
    const stoneRimGeometry = new THREE.CylinderGeometry(1.85, 1.95, 0.18, 28);
    const stoneRimMaterial = new THREE.MeshStandardMaterial({
      color: 0x6d6053,
      roughness: 0.75,
      metalness: 0.05,
    });
    const stoneRim = new THREE.Mesh(stoneRimGeometry, stoneRimMaterial);
    stoneRim.position.set(1.5, 0.08, 3.5);
    stoneRim.castShadow = true;
    stoneRim.receiveShadow = true;
    scene.add(stoneRim);

    const innerBorderGeometry = new THREE.CylinderGeometry(1.65, 1.7, 0.08, 28);
    const innerBorderMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f5c8f,
      roughness: 0.6,
      metalness: 0.1,
    });
    const innerBorder = new THREE.Mesh(innerBorderGeometry, innerBorderMaterial);
    innerBorder.position.set(1.5, 0.04, 3.5);
    innerBorder.receiveShadow = true;
    scene.add(innerBorder);

    // Água ANIMADA com shader de ondas
    this.water = new PS1Water({
      size: 1.5,
      segments: 28,
      color: 0x3cc4ff,
      waveSpeed: 0.6,
      waveHeight: 0.06,
    });
    this.water.getMesh().position.set(1.5, 0.05, 3.5);
    scene.add(this.water.getMesh());
  }
  
  /**
   * Casa 3D melhorada (não parece 2D)
   */
  private createImprovedHouse() {
    const scene = this.threeScene.getScene();
    const houseGroup = new THREE.Group();
    
    // BASE/FUNDAÇÃO - cinza escuro
    const foundationGeometry = new THREE.BoxGeometry(4.4, 0.35, 3.8);
    const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x4c4f62, roughness: 0.5, metalness: 0.1 });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    foundation.position.y = 0.18;
    houseGroup.add(foundation);
    
    // CORPO PRINCIPAL - vermelho com PROFUNDIDADE
    const bodyGeometry = new THREE.BoxGeometry(3.8, 2.4, 3.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xc23b3b, roughness: 0.55, metalness: 0.12 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 1.6;
    houseGroup.add(body);

    // Molduras verticais de madeira
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x6d3f20, roughness: 0.65, metalness: 0.05 });
    const beamGeometry = new THREE.BoxGeometry(0.18, 2.4, 0.2);
    const beamLeft = new THREE.Mesh(beamGeometry, beamMaterial);
    beamLeft.castShadow = true;
    beamLeft.receiveShadow = true;
    beamLeft.position.set(-1.9, 1.6, 1.55);
    houseGroup.add(beamLeft);
    const beamRight = beamLeft.clone();
    beamRight.castShadow = true;
    beamRight.receiveShadow = true;
    beamRight.position.x = 1.9;
    houseGroup.add(beamRight);
    
    // TELHADO - formato mais 3D (não cone achatado)
    const roofGroup = new THREE.Group();
    
    // Parte frontal do telhado
    const roofFrontGeometry = new THREE.BoxGeometry(4.6, 0.18, 2.2);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4a27, roughness: 0.48, metalness: 0.08 });
    const roofFront = new THREE.Mesh(roofFrontGeometry, roofMaterial);
    roofFront.position.set(0, 0, 0.7);
    roofFront.rotation.x = -Math.PI / 6;
    roofFront.castShadow = true;
    roofGroup.add(roofFront);
    
    // Parte traseira do telhado
    const roofBack = new THREE.Mesh(roofFrontGeometry, roofMaterial);
    roofBack.position.set(0, 0, -0.7);
    roofBack.rotation.x = Math.PI / 6;
    roofBack.castShadow = true;
    roofGroup.add(roofBack);
    
    // Cumeeira (topo)
    const ridgeGeometry = new THREE.BoxGeometry(4.7, 0.24, 0.35);
    const ridge = new THREE.Mesh(ridgeGeometry, new THREE.MeshStandardMaterial({ color: 0x6e3418, roughness: 0.45 }));
    ridge.position.y = 0.28;
    ridge.castShadow = true;
    roofGroup.add(ridge);
    
    roofGroup.position.y = 3.0;
    houseGroup.add(roofGroup);
    
    // PORTA - com profundidade
    const doorFrameGeometry = new THREE.BoxGeometry(1.0, 1.5, 0.16);
    const doorFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x6e3a1a, roughness: 0.6, metalness: 0.1 });
    const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.castShadow = true;
    doorFrame.position.set(0, 0.85, 1.63);
    houseGroup.add(doorFrame);
    
    const doorGeometry = new THREE.BoxGeometry(0.82, 1.32, 0.12);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0xd7882f, roughness: 0.5, metalness: 0.2 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.castShadow = true;
    door.position.set(0, 0.8, 1.69);
    houseGroup.add(door);
    
    // Maçaneta
    const knobGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const knob = new THREE.Mesh(knobGeometry, new THREE.MeshStandardMaterial({ color: 0xf9cc4e, roughness: 0.25, metalness: 0.8 }));
    knob.position.set(0.34, 0.82, 1.76);
    knob.castShadow = true;
    houseGroup.add(knob);
    
    // JANELAS - com moldura 3D
    const createWindow = (x: number, y: number, z: number) => {
      // Moldura
      const frameGeometry = new THREE.BoxGeometry(0.58, 0.55, 0.14);
      const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xf3f5ff, roughness: 0.35, metalness: 0.05 });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(x, y, z);
      frame.castShadow = true;
      houseGroup.add(frame);
      
      // Vidro
      const glassGeometry = new THREE.BoxGeometry(0.44, 0.42, 0.09);
      const glassMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xb9e4ff,
        roughness: 0.1,
        metalness: 0.0,
        transparent: true,
        opacity: 0.75,
        emissive: 0x26405f,
        emissiveIntensity: 0.12,
      });
      const glass = new THREE.Mesh(glassGeometry, glassMaterial);
      glass.position.set(x, y, z + 0.03);
      houseGroup.add(glass);
    };
    
    createWindow(-1.15, 1.45, 1.58);
    createWindow(1.15, 1.45, 1.58);
    
    // CHAMINÉ - para dar mais volume 3D
    const chimneyGeometry = new THREE.BoxGeometry(0.45, 1.3, 0.45);
    const chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x7b4526, roughness: 0.55, metalness: 0.08 });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.castShadow = true;
    chimney.position.set(-1.35, 3.6, -0.85);
    houseGroup.add(chimney);
    
    // Topo da chaminé
    const chimneyTopGeometry = new THREE.BoxGeometry(0.55, 0.24, 0.55);
    const chimneyTop = new THREE.Mesh(chimneyTopGeometry, new THREE.MeshStandardMaterial({ color: 0x5d2f18, roughness: 0.5 }));
    chimneyTop.position.set(-1.35, 4.26, -0.85);
    chimneyTop.castShadow = true;
    houseGroup.add(chimneyTop);

    const porchStep = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x6d5240, roughness: 0.62, metalness: 0.1 }),
    );
    porchStep.position.set(0, 0.1, 2.05);
    porchStep.castShadow = true;
    porchStep.receiveShadow = true;
    houseGroup.add(porchStep);
    
    houseGroup.position.set(0, 0, -7);
    scene.add(houseGroup);
  }
  
  /**
   * Cercas cartoon
   */
  private createPokemonFences() {
    const scene = this.threeScene.getScene();
    const fenceMaterial = new THREE.MeshToonMaterial({ 
      color: 0xd4a574, // Marrom claro madeira
    });
    
    // Cerca frontal
    for (let i = -5; i <= 5; i += 2) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.8, 0.15),
        fenceMaterial
      );
      post.position.set(i, 0.4, -5);
      scene.add(post);
      
      if (i < 5) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.1, 0.1),
          fenceMaterial
        );
        rail.position.set(i + 1, 0.6, -5);
        scene.add(rail);
      }
    }
  }
  
  /**
   * Montanhas GRANDES que cobrem o azul do céu ao fundo
   */
  private createVisibleHills() {
    const scene = this.threeScene.getScene();
    this.mountains = new THREE.Group();
    
    // Cores MARROM/TERRA variadas
    const hillColors = [
      0x8b7355, // Marrom terra médio
      0xa08060, // Marrom claro
      0x7a6348, // Marrom escuro
      0x9a8570, // Bege terra
    ];
    
    // Criar MUITAS montanhas/colinas para cobrir TODO o horizonte
    const hillCount = 12; // DOBRO para cobrir mais
    
    for (let i = 0; i < hillCount; i++) {
      const angle = (i / hillCount) * Math.PI * 2;
      
      // Montanhas GRANDES (cobrindo o céu)
      const height = 6 + Math.random() * 4; // MUITO MAIS ALTAS (6-10)
      const width = 4 + Math.random() * 3; // MUITO MAIS LARGAS (4-7)
      
      const geometry = new THREE.ConeGeometry(width, height, 16, 1, true);
      const material = new THREE.MeshStandardMaterial({ 
        color: hillColors[i % hillColors.length],
        roughness: 0.9,
        metalness: 0.02,
      });
      
      const hill = new THREE.Mesh(geometry, material);
      
      // Posicionar longe (10-13 unidades)
      const distance = 10 + Math.random() * 3;
      hill.position.set(
        Math.cos(angle) * distance,
        height / 2 - 0.5, // Enterrado para parecer montanha natural
        Math.sin(angle) * distance
      );
      
      this.mountains.add(hill);
    }
    
    scene.add(this.mountains);
  }
  
  /**
   * Nuvens VISÍVEIS no céu (cartoon) - Posicionadas corretamente
   */
  private createVisibleClouds() {
    const scene = this.threeScene.getScene();
    this.clouds = new THREE.Group();
    
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f7ff,
      roughness: 0.6,
      metalness: 0.0,
      transparent: true,
      opacity: 0.82,
      emissive: 0xe0e4ff,
      emissiveIntensity: 0.05,
    });
    
    // Criar 4 nuvens ao FUNDO (não nos lados)
    const cloudPositions = [
      { x: -6, y: 6.5, z: -5 },  // Esquerda-trás
      { x: 6, y: 6.5, z: -5 },   // Direita-trás
      { x: -3, y: 7, z: -7 },    // Centro-esquerda-fundo
      { x: 3, y: 7, z: -7 },     // Centro-direita-fundo
    ];
    
    cloudPositions.forEach(pos => {
      const cloudGroup = new THREE.Group();
      
      // 3 esferas para fazer nuvem fofa
      for (let j = 0; j < 3; j++) {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 8, 6),
          cloudMaterial
        );
        sphere.position.set(
          (j - 1) * 0.6,
          Math.random() * 0.2,
          Math.random() * 0.2
        );
        sphere.scale.set(1.3, 0.7, 1.1); // Achatar
        cloudGroup.add(sphere);
      }
      
      cloudGroup.position.set(pos.x, pos.y, pos.z);
      cloudGroup.scale.set(1.2, 1.2, 1.2);
      
      this.clouds.add(cloudGroup);
    });
    
    scene.add(this.clouds);
  }
  
  /**
   * Cerca de fundo separando rancho das terras selvagens
   */
  private createBackgroundFence() {
    const scene = this.threeScene.getScene();
    const fenceMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8c6239,
      roughness: 0.65,
      metalness: 0.05,
    });
    
    // Cerca circular ao redor (mais longe que a cerca frontal)
    const fenceRadius = 9;
    const postCount = 24; // Mais postes para cobrir o círculo
    
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      
      // Poste vertical
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 1.25, 0.18),
        fenceMaterial
      );
      post.position.set(
        Math.cos(angle) * fenceRadius,
        0.6,
        Math.sin(angle) * fenceRadius
      );
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      
      // Travessa horizontal conectando postes
      if (i < postCount - 1) {
        const nextAngle = ((i + 1) / postCount) * Math.PI * 2;
        const midX = (Math.cos(angle) + Math.cos(nextAngle)) * fenceRadius / 2;
        const midZ = (Math.sin(angle) + Math.sin(nextAngle)) * fenceRadius / 2;
        
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.14, 1.55),
          fenceMaterial
        );
        rail.position.set(midX, 0.8, midZ);
        rail.lookAt(
          Math.cos(nextAngle) * fenceRadius,
          0.8,
          Math.sin(nextAngle) * fenceRadius
        );
        rail.castShadow = true;
        rail.receiveShadow = true;
        scene.add(rail);
      }
    }
    
    // Última conexão (fechar o círculo)
    const lastAngle = ((postCount - 1) / postCount) * Math.PI * 2;
    const firstAngle = 0;
    const midX = (Math.cos(lastAngle) + Math.cos(firstAngle)) * fenceRadius / 2;
    const midZ = (Math.sin(lastAngle) + Math.sin(firstAngle)) * fenceRadius / 2;
    
    const lastRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 1.55), fenceMaterial);
    lastRail.position.set(midX, 0.8, midZ);
    lastRail.lookAt(
      Math.cos(firstAngle) * fenceRadius,
      0.8,
      Math.sin(firstAngle) * fenceRadius
    );
    lastRail.castShadow = true;
    lastRail.receiveShadow = true;
    scene.add(lastRail);
  }

  private createLanterns() {
    const scene = this.threeScene.getScene();
    const lanternPositions = [
      new THREE.Vector3(-2.2, 0, -2.2),
      new THREE.Vector3(2.3, 0, -2.0),
      new THREE.Vector3(-2.6, 0, 2.6),
    ];

    lanternPositions.forEach((pos, index) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x53423a, roughness: 0.7, metalness: 0.15 }),
      );
      pole.position.set(pos.x, 0.9, pos.z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);

      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x2c1f18, roughness: 0.6, metalness: 0.2 }),
      );
      cap.position.set(pos.x, 1.85, pos.z);
      cap.castShadow = true;
      scene.add(cap);

      const lanternGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 12),
        new THREE.MeshStandardMaterial({
          color: 0xfff3c4,
          emissive: 0xffe49a,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
        }),
      );
      lanternGlass.position.set(pos.x, 1.62, pos.z);
      scene.add(lanternGlass);

      const light = new THREE.PointLight(0xffcfa8, 0.7, 6, 2);
      light.position.set(pos.x, 1.62, pos.z);
      light.castShadow = false;
      light.name = `lantern-light-${index}`;
      scene.add(light);
    });
  }
  
  public setBeast(beastLine: string) {
    // Remove previous model
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }
    this.idleAnimation = null;
    this.activeRigAnimation = null;

    // Create new model
    this.beastModel = new BeastModel(beastLine);
    this.beastGroup = this.beastModel.getGroup();
    this.needsFit = true;
    this.baseYPosition = 0;
    
    // Position in center
    this.beastGroup.position.set(0, 0, 0);
    
    this.threeScene.addObject(this.beastGroup);

    // Setup idle animation
    if (this.beastModel.hasRiggedAnimations()) {
      this.idleAnimation = null;
      this.playRigAnimation('idle');
    } else {
      this.idleAnimation = this.beastModel.playIdleAnimation();
    }
    
    // Iniciar sistema de movimento
    this.nextMoveTime = 2 + Math.random() * 3; // Primeiro movimento em 2-5 segundos
  }

  public update(delta: number) {
    // Update beast animation
    if (this.beastModel) {
      this.beastModel.update(delta);
      if (this.beastModel.hasRiggedAnimations() && this.idleAnimation) {
        this.idleAnimation = null;
      }
    }

    if (this.needsFit && this.beastGroup) {
      const fitted = this.fitBeastToRanch(this.beastGroup);
      if (fitted) {
        this.needsFit = false;
      }
    }

    if (!this.beastModel?.hasRiggedAnimations() && this.idleAnimation) {
      this.idleAnimation();
    } else if (this.beastGroup && this.beastModel?.hasRiggedAnimations()) {
      this.beastGroup.position.y = this.baseYPosition;
    }
    
    // Update grass animation (wind)
    if (this.grass) {
      this.grass.update(delta);
    }
    
    // Update water animation (waves)
    if (this.water) {
      this.water.update(delta);
    }
    
    // Update critters (bichinhos aleatórios)
    if (this.critters) {
      this.critters.update(delta);
    }
    
    // Sistema de movimento da criatura
    if (this.beastGroup) {
      this.updateBeastMovement(delta);
    }
    
    // Câmera fixa estilo Pokémon (sem rotação automática)
  }
  
  /**
   * Atualizar movimento da criatura pelo rancho
   */
  private updateBeastMovement(delta: number) {
    if (!this.beastGroup) return;
    
    // Se não está se movendo, aguardar um tempo e escolher novo destino
    if (!this.isMoving) {
      if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('idle');
      }
      this.nextMoveTime -= delta;
      
      if (this.nextMoveTime <= 0) {
        // Tempo para se mover!
        this.startNextMove();
        this.nextMoveTime = 3 + Math.random() * 4; // Próximo movimento em 3-7 segundos
      }
      return;
    }
    
    // Está se movendo! Mover em direção ao alvo
    if (this.currentTarget) {
      const currentPos = this.beastGroup.position;
      const target = this.currentTarget;
      
      // Calcular direção
      const direction = new THREE.Vector3(
        target.x - currentPos.x,
        0,
        target.z - currentPos.z
      );
      const distance = direction.length();
      
      // Se chegou perto o suficiente, parar
      if (distance < 0.2) {
        this.isMoving = false;
        this.currentTarget = null;
        this.nextMoveTime = 2 + Math.random() * 3; // Ficar parado 2-5 segundos
        if (this.beastModel?.hasRiggedAnimations()) {
          this.playRigAnimation('idle');
        }
        return;
      }
      
      // Normalizar direção e mover
      direction.normalize();
      const moveDistance = this.moveSpeed * delta;
      const actualMove = Math.min(moveDistance, distance);
      
      // Calcular NOVA posição
      const newX = currentPos.x + direction.x * actualMove;
      const newZ = currentPos.z + direction.z * actualMove;
      
      // VERIFICAR COLISÃO na nova posição!
      if (!this.isPositionValid(newX, newZ, 0.6)) {
        // COLIDIU! Virar e escolher nova direção
        
        // Calcular direção OPOSTA (bounce)
        const bounceDirection = this.getBounceDirection(currentPos.x, currentPos.z, newX, newZ);
        
        // Escolher novo alvo na direção de bounce (preferindo o centro)
        const bounceTarget = this.getTargetTowardsCenter(currentPos.x, currentPos.z, bounceDirection);
        
        if (bounceTarget) {
          this.currentTarget = bounceTarget;
        } else {
          // Se não encontrou, parar
          this.isMoving = false;
          this.currentTarget = null;
          this.nextMoveTime = 1;
          if (this.beastModel?.hasRiggedAnimations()) {
            this.playRigAnimation('idle');
          }
        }
        
        return;
      }
      
      // Posição válida! Mover
      currentPos.x = newX;
      currentPos.z = newZ;
      if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('walk');
      }
      
      // Rotacionar criatura na direção do movimento
      const targetAngle = Math.atan2(direction.x, direction.z);
      this.beastGroup.rotation.y = targetAngle;
    }
  }
  
  /**
   * Calcular direção de bounce quando colidir
   */
  private getBounceDirection(currentX: number, currentZ: number, blockedX: number, blockedZ: number): THREE.Vector3 {
    // Encontrar obstáculo mais próximo
    let closestObstacle: Obstacle | null = null;
    let minDist = Infinity;
    
    for (const obstacle of this.obstacles) {
      const dist = Math.sqrt(
        (blockedX - obstacle.x) ** 2 + 
        (blockedZ - obstacle.z) ** 2
      );
      
      if (dist < minDist) {
        minDist = dist;
        closestObstacle = obstacle;
      }
    }
    
    if (!closestObstacle) {
      // Fallback: direção oposta
      return new THREE.Vector3(
        -(blockedX - currentX),
        0,
        -(blockedZ - currentZ)
      ).normalize();
    }
    
    // Calcular vetor do obstáculo para a criatura (afastar)
    const awayVector = new THREE.Vector3(
      currentX - closestObstacle.x,
      0,
      currentZ - closestObstacle.z
    ).normalize();
    
    return awayVector;
  }
  
  /**
   * Escolher alvo em direção ao centro (evitar afastamento)
   */
  private getTargetTowardsCenter(currentX: number, currentZ: number, direction: THREE.Vector3): THREE.Vector3 | null {
    // Preferir direção que leva para o centro (0, 0)
    const toCenter = new THREE.Vector3(-currentX, 0, -currentZ).normalize();
    
    // Blend: 70% bounce direction + 30% to center
    const blendedDirection = new THREE.Vector3(
      direction.x * 0.7 + toCenter.x * 0.3,
      0,
      direction.z * 0.7 + toCenter.z * 0.3
    ).normalize();
    
    // Escolher ponto a 2-4 unidades na direção blended
    const targetDistance = 2 + Math.random() * 2;
    const targetX = currentX + blendedDirection.x * targetDistance;
    const targetZ = currentZ + blendedDirection.z * targetDistance;
    
    // Verificar se é válido
    if (this.isPositionValid(targetX, targetZ, 0.6)) {
      return new THREE.Vector3(targetX, 0, targetZ);
    }
    
    // Se não for válido, tentar apenas em direção ao centro
    const centerDistance = 2;
    const centerTargetX = currentX + toCenter.x * centerDistance;
    const centerTargetZ = currentZ + toCenter.z * centerDistance;
    
    if (this.isPositionValid(centerTargetX, centerTargetZ, 0.6)) {
      return new THREE.Vector3(centerTargetX, 0, centerTargetZ);
    }
    
    return null;
  }

  public render() {
    this.threeScene.render();
  }

  private playRigAnimation(name: 'idle' | 'walk') {
    if (!this.beastModel || !this.beastModel.hasRiggedAnimations()) {
      return;
    }

    let clip = name;
    if (!this.beastModel.hasAnimation(clip)) {
      if (clip !== 'idle' && this.beastModel.hasAnimation('idle')) {
        clip = 'idle';
      } else {
        return;
      }
    }

    const shouldRestart = this.activeRigAnimation !== clip;
    const played = this.beastModel.playAnimation(clip, {
      loop: clip === 'walk' ? THREE.LoopRepeat : THREE.LoopRepeat,
      clampWhenFinished: false,
      fadeIn: 0.2,
      fadeOut: 0.2,
      forceRestart: shouldRestart,
    });

    if (played) {
      this.activeRigAnimation = clip;
    }
  }

  private fitBeastToRanch(group: THREE.Group): boolean {
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) {
      return false;
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 1.6 / maxDim : 1;

    group.scale.setScalar(scale);

    const offset = center.multiplyScalar(scale);
    group.position.set(-offset.x, this.baseYPosition - offset.y, -offset.z);

    console.log('[RanchScene3D] ✓ Beast fitted to ranch (scale:', scale.toFixed(2), ')');
    return true;
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
    
    // Dispose grass
    this.grass?.dispose();
    
    // Dispose water
    this.water?.dispose();
    
    // Dispose critters
    this.critters?.dispose();
    
    // Dispose mountains
    if (this.mountains) {
      this.mountains.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    
    // Dispose clouds
    if (this.clouds) {
      this.clouds.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
    
    // Dispose Three.js scene (limpa todos os elementos automaticamente)
    this.threeScene.dispose();
  }
}

