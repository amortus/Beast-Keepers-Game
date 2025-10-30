/**
 * 3D Ranch Scene - PS1 Style
 * Beast Keepers - Three.js ranch visualization with Monster Rancher aesthetic
 */

import * as THREE from 'three';
import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { PS1Grass } from '../vegetation/PS1Grass';

export class RanchScene3D {
  private threeScene: ThreeScene;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;
  private grass: PS1Grass | null = null; // Grama procedural
  private mountains: THREE.Group | null = null; // Colinas distantes
  private clouds: THREE.Group | null = null; // Nuvens

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupRanchEnvironment();
  }

  private setupRanchEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    
    // Câmera estilo Pokémon (ângulo isométrico levemente alto)
    camera.fov = 50;
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    
    // Skybox simples - céu azul claro vibrante
    scene.background = new THREE.Color(0x87ceeb); // Azul céu brilhante
    scene.fog = new THREE.Fog(0xa0d8ef, 15, 35); // Fog leve e claro
    
    // Colinas VISÍVEIS no horizonte (mais próximas)
    this.createVisibleHills();
    
    // Nuvens VISÍVEIS no céu (mais próximas e maiores)
    this.createVisibleClouds();
    
    // Chão plano - verde natural (menos saturado)
    this.createPokemonGround();
    
    // Lago/bebedouro PRIMEIRO (para não ficar em cima)
    this.createPokemonLake();
    
    // Grama blade real (PS1Grass)
    this.createRealGrass();
    
    // Flores elaboradas com pétalas
    this.createElaborateFlowers();
    
    // Árvores cartoon arredondadas (longe do lago)
    this.createPokemonTree(-4, 0, -3);
    this.createPokemonTree(4, 0, -3);
    this.createPokemonTree(-4, 0, 3.5); // Mudado para longe do lago
    
    // Pedras decorativas
    this.createRocks();
    
    // Casa 3D melhorada
    this.createImprovedHouse();
    
    // Cerca de fundo separando rancho das terras selvagens
    this.createBackgroundFence();
    
    // Floresta densa ao fundo (longe, entre colinas e cerca)
    this.createBackgroundForest();
    
    // Food bowl colorido
    const bowlGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.3, 8);
    const foodBowl = new THREE.Mesh(bowlGeometry, new THREE.MeshToonMaterial({ 
      color: 0xff6b6b, // Vermelho vibrante
    }));
    foodBowl.position.set(-3, 0.15, 3);
    scene.add(foodBowl);
  }
  
  /**
   * Chão plano - verde natural
   */
  private createPokemonGround() {
    const scene = this.threeScene.getScene();
    
    // Chão verde NATURAL (menos saturado)
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshToonMaterial({ 
      color: 0x6b9b6b, // Verde grama NATURAL (menos saturado)
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);
    
    // Borda do chão (marrom terra)
    const borderGeometry = new THREE.PlaneGeometry(22, 22);
    const borderMaterial = new THREE.MeshToonMaterial({ 
      color: 0x8b7355, // Marrom terra
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = -0.05;
    scene.add(border);
  }
  
  /**
   * Grama blade real usando PS1Grass (evitando lago)
   */
  private createRealGrass() {
    const scene = this.threeScene.getScene();
    
    this.grass = new PS1Grass({
      count: 500, // Muita grama
      area: 15,
      color: 0x4a7c4a, // Verde grama natural
      height: 0.25,
      windSpeed: 0.3,
      windStrength: 0.015,
      lakePosition: { x: 1.5, z: 3.5 }, // Posição do lago
      lakeRadius: 1.7, // Raio do lago
    });
    scene.add(this.grass.getMesh());
  }
  
  /**
   * Flores elaboradas com pétalas
   */
  private createElaborateFlowers() {
    const scene = this.threeScene.getScene();
    const flowerColors = [
      0xff6b9d, // Rosa
      0xffd93d, // Amarelo
      0xff8c42, // Laranja
      0xc44569, // Roxo
      0xff4757, // Vermelho
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
      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4);
      const stemMaterial = new THREE.MeshToonMaterial({ color: 0x2d5016 });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = 0.1;
      flowerGroup.add(stem);
      
      // Centro da flor (amarelo)
      const centerGeometry = new THREE.SphereGeometry(0.05, 6, 6);
      const centerMaterial = new THREE.MeshToonMaterial({ color: 0xffd700 });
      const center = new THREE.Mesh(centerGeometry, centerMaterial);
      center.position.y = 0.2;
      flowerGroup.add(center);
      
      // Pétalas (5 pétalas ao redor)
      const petalMaterial = new THREE.MeshToonMaterial({ color });
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const petalGeometry = new THREE.SphereGeometry(0.06, 6, 6);
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.position.set(
          Math.cos(angle) * 0.08,
          0.2,
          Math.sin(angle) * 0.08
        );
        petal.scale.set(1, 0.5, 0.8); // Achatar para parecer pétala
        flowerGroup.add(petal);
      }
      
      flowerGroup.position.set(x, 0, z);
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
    const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1.8, 8);
    const trunkMaterial = new THREE.MeshToonMaterial({ 
      color: 0x8b6f47, // Marrom médio
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.9;
    treeGroup.add(trunk);

    // Folhagem - esferas sobrepostas (estilo Pokémon)
    const foliageMaterial = new THREE.MeshToonMaterial({ 
      color: 0x4db85f, // Verde vibrante
    });
    
    // 3 esferas para folhagem volumosa
    const foliage1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), foliageMaterial);
    foliage1.position.y = 2.2;
    treeGroup.add(foliage1);
    
    const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), foliageMaterial);
    foliage2.position.set(-0.4, 2.5, 0);
    treeGroup.add(foliage2);
    
    const foliage3 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), foliageMaterial);
    foliage3.position.set(0.4, 2.5, 0);
    treeGroup.add(foliage3);
    
    treeGroup.position.set(x, y, z);
    scene.add(treeGroup);
  }
  
  /**
   * Pedras decorativas
   */
  private createRocks() {
    const scene = this.threeScene.getScene();
    const rockMaterial = new THREE.MeshToonMaterial({ color: 0x9e9e9e });
    
    // Pedras espalhadas
    const rockPositions = [
      [-2, 0, -4],
      [3, 0, -3.5],
      [-4, 0, 2],
      [4.5, 0, 1],
    ];
    
    rockPositions.forEach(([x, y, z]) => {
      const rockGeometry = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2, 0);
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, 0.2, z);
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(rock);
    });
  }
  
  /**
   * Lago estilo Pokémon
   */
  private createPokemonLake() {
    const scene = this.threeScene.getScene();
    
    // Lago circular azul vibrante
    const lakeGeometry = new THREE.CircleGeometry(1.5, 16);
    const lakeMaterial = new THREE.MeshToonMaterial({ 
      color: 0x4fc3f7, // Azul água Pokémon
    });
    const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(1.5, 0.02, 3.5);
    scene.add(lake);
    
    // Borda do lago (azul mais escuro)
    const borderGeometry = new THREE.CircleGeometry(1.7, 16);
    const borderMaterial = new THREE.MeshToonMaterial({ 
      color: 0x2196f3, // Azul mais escuro
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.set(1.5, 0.01, 3.5);
    scene.add(border);
  }
  
  /**
   * Casa 3D melhorada (não parece 2D)
   */
  private createImprovedHouse() {
    const scene = this.threeScene.getScene();
    const houseGroup = new THREE.Group();
    
    // BASE/FUNDAÇÃO - cinza escuro
    const foundationGeometry = new THREE.BoxGeometry(4, 0.3, 3.5);
    const foundationMaterial = new THREE.MeshToonMaterial({ color: 0x555555 });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.y = 0.15;
    houseGroup.add(foundation);
    
    // CORPO PRINCIPAL - vermelho com PROFUNDIDADE
    const bodyGeometry = new THREE.BoxGeometry(3.5, 2.2, 3);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0xd64545 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.4;
    houseGroup.add(body);
    
    // TELHADO - formato mais 3D (não cone achatado)
    const roofGroup = new THREE.Group();
    
    // Parte frontal do telhado
    const roofFrontGeometry = new THREE.BoxGeometry(4.2, 0.15, 2);
    const roofMaterial = new THREE.MeshToonMaterial({ color: 0x8b4513 });
    const roofFront = new THREE.Mesh(roofFrontGeometry, roofMaterial);
    roofFront.position.set(0, 0, 0.7);
    roofFront.rotation.x = -Math.PI / 6;
    roofGroup.add(roofFront);
    
    // Parte traseira do telhado
    const roofBack = new THREE.Mesh(roofFrontGeometry, roofMaterial);
    roofBack.position.set(0, 0, -0.7);
    roofBack.rotation.x = Math.PI / 6;
    roofGroup.add(roofBack);
    
    // Cumeeira (topo)
    const ridgeGeometry = new THREE.BoxGeometry(4.3, 0.2, 0.3);
    const ridge = new THREE.Mesh(ridgeGeometry, new THREE.MeshToonMaterial({ color: 0x6d3713 }));
    ridge.position.y = 0.3;
    roofGroup.add(ridge);
    
    roofGroup.position.y = 2.6;
    houseGroup.add(roofGroup);
    
    // PORTA - com profundidade
    const doorFrameGeometry = new THREE.BoxGeometry(0.9, 1.4, 0.15);
    const doorFrameMaterial = new THREE.MeshToonMaterial({ color: 0x8b4513 });
    const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.position.set(0, 0.7, 1.58);
    houseGroup.add(doorFrame);
    
    const doorGeometry = new THREE.BoxGeometry(0.8, 1.3, 0.1);
    const doorMaterial = new THREE.MeshToonMaterial({ color: 0xffa726 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.65, 1.63);
    houseGroup.add(door);
    
    // Maçaneta
    const knobGeometry = new THREE.SphereGeometry(0.05, 6, 6);
    const knob = new THREE.Mesh(knobGeometry, new THREE.MeshToonMaterial({ color: 0xffd700 }));
    knob.position.set(0.3, 0.7, 1.68);
    houseGroup.add(knob);
    
    // JANELAS - com moldura 3D
    const createWindow = (x: number, y: number, z: number) => {
      // Moldura
      const frameGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.12);
      const frameMaterial = new THREE.MeshToonMaterial({ color: 0xffffff });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(x, y, z);
      houseGroup.add(frame);
      
      // Vidro
      const glassGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.08);
      const glassMaterial = new THREE.MeshToonMaterial({ 
        color: 0x81d4fa,
        transparent: true,
        opacity: 0.7
      });
      const glass = new THREE.Mesh(glassGeometry, glassMaterial);
      glass.position.set(x, y, z + 0.02);
      houseGroup.add(glass);
    };
    
    createWindow(-1, 1.3, 1.53);
    createWindow(1, 1.3, 1.53);
    
    // CHAMINÉ - para dar mais volume 3D
    const chimneyGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const chimneyMaterial = new THREE.MeshToonMaterial({ color: 0x8b4513 });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(-1.3, 3.3, -0.8);
    houseGroup.add(chimney);
    
    // Topo da chaminé
    const chimneyTopGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    const chimneyTop = new THREE.Mesh(chimneyTopGeometry, new THREE.MeshToonMaterial({ color: 0x6d3713 }));
    chimneyTop.position.set(-1.3, 3.9, -0.8);
    houseGroup.add(chimneyTop);
    
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
   * Colinas VISÍVEIS no horizonte (marrom/terra)
   */
  private createVisibleHills() {
    const scene = this.threeScene.getScene();
    this.mountains = new THREE.Group();
    
    // Cores MARROM/TERRA (matching com a borda do chão)
    const hillColors = [
      0x8b7355, // Marrom terra médio
      0xa08060, // Marrom claro
      0x7a6348, // Marrom escuro
    ];
    
    // Criar 6 colinas AO REDOR do rancho (mais próximas)
    const hillCount = 6;
    for (let i = 0; i < hillCount; i++) {
      const angle = (i / hillCount) * Math.PI * 2;
      
      // Colinas cartoon (cones arredondados)
      const height = 3.5 + Math.random() * 2;
      const width = 2.5 + Math.random() * 1.5;
      
      const geometry = new THREE.ConeGeometry(width, height, 8);
      const material = new THREE.MeshToonMaterial({ 
        color: hillColors[i % hillColors.length],
      });
      
      const hill = new THREE.Mesh(geometry, material);
      
      // Posicionar MAIS PERTO (11-14 unidades)
      const distance = 11 + Math.random() * 3;
      hill.position.set(
        Math.cos(angle) * distance,
        height / 2 - 0.4, // Mais enterrado no chão
        Math.sin(angle) * distance
      );
      
      this.mountains.add(hill);
    }
    
    scene.add(this.mountains);
  }
  
  /**
   * Nuvens VISÍVEIS no céu (cartoon) - CORRIGIDO
   */
  private createVisibleClouds() {
    const scene = this.threeScene.getScene();
    this.clouds = new THREE.Group();
    
    const cloudMaterial = new THREE.MeshToonMaterial({
      color: 0xffffff,
      transparent: false, // SEM transparência para ficar bem visível
    });
    
    // Criar 5 nuvens GRANDES e VISÍVEIS
    const cloudCount = 5;
    for (let i = 0; i < cloudCount; i++) {
      const cloudGroup = new THREE.Group();
      
      // 4 esferas para fazer nuvem MAIOR e fofa
      for (let j = 0; j < 4; j++) {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 8, 6),
          cloudMaterial
        );
        sphere.position.set(
          (j - 1.5) * 0.7,
          Math.random() * 0.3,
          Math.random() * 0.3
        );
        sphere.scale.set(1.4, 0.8, 1.2); // Achatar e alargar
        cloudGroup.add(sphere);
      }
      
      // Posicionar nuvens DENTRO DO CAMPO DE VISÃO
      const angle = (i / cloudCount) * Math.PI * 2 + Math.PI / 4;
      const distance = 6 + Math.random() * 3; // MUITO PERTO
      cloudGroup.position.set(
        Math.cos(angle) * distance,
        5 + Math.random() * 1.5, // Altura média (não muito alto)
        Math.sin(angle) * distance
      );
      
      cloudGroup.scale.set(1.5, 1.5, 1.5); // MAIORES
      
      this.clouds.add(cloudGroup);
    }
    
    scene.add(this.clouds);
  }
  
  /**
   * Cerca de fundo separando rancho das terras selvagens
   */
  private createBackgroundFence() {
    const scene = this.threeScene.getScene();
    const fenceMaterial = new THREE.MeshToonMaterial({ 
      color: 0x8b6f47, // Marrom madeira escura
    });
    
    // Cerca circular ao redor (mais longe que a cerca frontal)
    const fenceRadius = 9;
    const postCount = 24; // Mais postes para cobrir o círculo
    
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      
      // Poste vertical
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1.2, 0.15),
        fenceMaterial
      );
      post.position.set(
        Math.cos(angle) * fenceRadius,
        0.6,
        Math.sin(angle) * fenceRadius
      );
      scene.add(post);
      
      // Travessa horizontal conectando postes
      if (i < postCount - 1) {
        const nextAngle = ((i + 1) / postCount) * Math.PI * 2;
        const midX = (Math.cos(angle) + Math.cos(nextAngle)) * fenceRadius / 2;
        const midZ = (Math.sin(angle) + Math.sin(nextAngle)) * fenceRadius / 2;
        
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.12, 1.5),
          fenceMaterial
        );
        rail.position.set(midX, 0.8, midZ);
        rail.lookAt(
          Math.cos(nextAngle) * fenceRadius,
          0.8,
          Math.sin(nextAngle) * fenceRadius
        );
        scene.add(rail);
      }
    }
    
    // Última conexão (fechar o círculo)
    const lastAngle = ((postCount - 1) / postCount) * Math.PI * 2;
    const firstAngle = 0;
    const midX = (Math.cos(lastAngle) + Math.cos(firstAngle)) * fenceRadius / 2;
    const midZ = (Math.sin(lastAngle) + Math.sin(firstAngle)) * fenceRadius / 2;
    
    const lastRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 1.5),
      fenceMaterial
    );
    lastRail.position.set(midX, 0.8, midZ);
    lastRail.lookAt(
      Math.cos(firstAngle) * fenceRadius,
      0.8,
      Math.sin(firstAngle) * fenceRadius
    );
    scene.add(lastRail);
  }
  
  /**
   * Floresta densa ao fundo (entre cerca e colinas)
   */
  private createBackgroundForest() {
    const scene = this.threeScene.getScene();
    
    // Árvores ao fundo: entre cerca (raio 9) e colinas (raio 11-14)
    // Posicionar em raio 9.5-10.8 para cobrir o azul do fundo
    
    const treeCount = 40; // MUITAS árvores para floresta densa
    const minDistance = 9.5; // Logo após a cerca
    const maxDistance = 10.8; // Antes das colinas
    
    for (let i = 0; i < treeCount; i++) {
      // Distribuição circular ao redor
      const angle = (Math.random() * Math.PI * 2);
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Árvore de fundo (mais escura, menor)
      const treeGroup = new THREE.Group();
      
      // Tronco
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 6);
      const trunkMaterial = new THREE.MeshToonMaterial({ 
        color: 0x5a4332, // Marrom mais escuro
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.75;
      treeGroup.add(trunk);
      
      // Folhagem (3 esferas, mais escuras)
      const foliageMaterial = new THREE.MeshToonMaterial({ 
        color: 0x2d5a2d, // Verde floresta escuro
      });
      
      const foliage1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 6, 6), 
        foliageMaterial
      );
      foliage1.position.y = 1.8;
      treeGroup.add(foliage1);
      
      const foliage2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 6, 6), 
        foliageMaterial
      );
      foliage2.position.set(-0.3, 2.1, 0);
      treeGroup.add(foliage2);
      
      const foliage3 = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 6, 6), 
        foliageMaterial
      );
      foliage3.position.set(0.3, 2.1, 0);
      treeGroup.add(foliage3);
      
      // Variação de escala
      const scale = 0.7 + Math.random() * 0.5;
      treeGroup.scale.set(scale, scale, scale);
      
      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
    }
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
    
    // Update grass animation (wind)
    if (this.grass) {
      this.grass.update(delta);
    }
    
    // Câmera fixa estilo Pokémon (sem rotação automática)
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
    
    // Dispose grass
    this.grass?.dispose();
    
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

