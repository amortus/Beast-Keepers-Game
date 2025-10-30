/**
 * 3D Ranch Scene - PS1 Style
 * Beast Keepers - Three.js ranch visualization with Monster Rancher aesthetic
 */

import * as THREE from 'three';
import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';

export class RanchScene3D {
  private threeScene: ThreeScene;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;
  
  // Propriedades não mais necessárias (cena simples Pokémon)

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
    
    // Chão plano estilo Pokémon - grama verde vibrante
    this.createPokemonGround();
    
    // Flores coloridas espalhadas
    this.createFlowers();
    
    // Árvores cartoon arredondadas
    this.createPokemonTree(-4, 0, -3);
    this.createPokemonTree(4, 0, -3);
    this.createPokemonTree(-3, 0, 4);
    this.createPokemonTree(3, 0, 4);
    
    // Pedras decorativas
    this.createRocks();
    
    // Lago/bebedouro estilo Pokémon
    this.createPokemonLake();
    
    // Casa/prédio colorido
    this.createPokemonHouse();
    
    // Cerca de madeira cartoon
    this.createPokemonFences();
    
    // Food bowl colorido
    const bowlGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.3, 8);
    const foodBowl = new THREE.Mesh(bowlGeometry, new THREE.MeshToonMaterial({ 
      color: 0xff6b6b, // Vermelho vibrante
    }));
    foodBowl.position.set(-3, 0.15, 3);
    scene.add(foodBowl);
  }
  
  /**
   * Chão plano estilo Pokémon
   */
  private createPokemonGround() {
    const scene = this.threeScene.getScene();
    
    // Chão verde vibrante plano
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshToonMaterial({ 
      color: 0x5cd65c, // Verde grama Pokémon vibrante
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);
    
    // Borda do chão (marrom claro)
    const borderGeometry = new THREE.PlaneGeometry(22, 22);
    const borderMaterial = new THREE.MeshToonMaterial({ 
      color: 0xc4a574, // Bege/marrom claro
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = -0.05;
    scene.add(border);
  }
  
  /**
   * Flores coloridas espalhadas
   */
  private createFlowers() {
    const scene = this.threeScene.getScene();
    const flowerColors = [
      0xff6b9d, // Rosa
      0xffd93d, // Amarelo
      0x6bcfff, // Azul claro
      0xff8c42, // Laranja
      0xc44569, // Roxo
    ];
    
    // Espalhar flores aleatoriamente
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 16;
      
      // Pétalas (pequenas esferas)
      const petalGeometry = new THREE.SphereGeometry(0.08, 6, 6);
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const petalMaterial = new THREE.MeshToonMaterial({ color });
      
      const flower = new THREE.Mesh(petalGeometry, petalMaterial);
      flower.position.set(x, 0.05, z);
      scene.add(flower);
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
   * Casa estilo Pokémon Center
   */
  private createPokemonHouse() {
    const scene = this.threeScene.getScene();
    const houseGroup = new THREE.Group();
    
    // Corpo principal - vermelho vibrante
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 2.5);
    const bodyMaterial = new THREE.MeshToonMaterial({ 
      color: 0xff5252, // Vermelho Pokémon Center
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    houseGroup.add(body);
    
    // Telhado - laranja vibrante
    const roofGeometry = new THREE.ConeGeometry(2.3, 1.5, 4);
    const roofMaterial = new THREE.MeshToonMaterial({ 
      color: 0xff6f00, // Laranja vibrante
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.75;
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);
    
    // Porta - branca com detalhes
    const doorGeometry = new THREE.BoxGeometry(0.8, 1.3, 0.1);
    const doorMaterial = new THREE.MeshToonMaterial({ 
      color: 0xffffff, // Branco
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.65, 1.26);
    houseGroup.add(door);
    
    // Janelas - azuis
    const windowGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.05);
    const windowMaterial = new THREE.MeshToonMaterial({ 
      color: 0x64b5f6, // Azul claro
    });
    
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-0.8, 1.2, 1.27);
    houseGroup.add(window1);
    
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(0.8, 1.2, 1.27);
    houseGroup.add(window2);
    
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
    
    // Dispose Three.js scene (limpa todos os elementos automaticamente)
    this.threeScene.dispose();
  }
}

