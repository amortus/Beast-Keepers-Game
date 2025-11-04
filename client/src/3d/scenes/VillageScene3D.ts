/**
 * Vila 3D Interativa - Beast Keepers
 * Cena 3D da vila com casas clicáveis que abrem diferentes funcionalidades
 */

import * as THREE from 'three';

// Tipos de edificações da vila
export type BuildingType = 
  | 'shop'          // 🛒 Loja do Dalan
  | 'temple'        // 🏛️ Templo dos Ecos
  | 'craft'         // ⚗️ Oficina de Craft
  | 'inventory'     // 🎒 Armazém (Inventário)
  | 'quests'        // 📜 Tábua de Missões
  | 'achievements'  // 🏆 Salão da Fama
  | 'exploration'   // 🗺️ Portal de Exploração
  | 'dungeons'      // ⚔️ Entrada das Dungeons
  | 'ranch';        // 🏡 Rancho (Beast atual)

// Configuração de uma edificação
export interface BuildingConfig {
  type: BuildingType;
  position: THREE.Vector3;
  name: string;
  icon: string;
  color: string;
}

// Edificação 3D
interface Building3D {
  config: BuildingConfig;
  mesh: THREE.Group;
  highlightMesh?: THREE.Mesh;
  isHovered: boolean;
}

export class VillageScene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private buildings: Building3D[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  // Callbacks
  public onBuildingClick?: (type: BuildingType) => void;
  public onBuildingHover?: (type: BuildingType | null, name: string) => void;
  
  private animationId: number | null = null;
  private hoveredBuilding: Building3D | null = null;

  constructor(container: HTMLElement, width: number, height: number) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Céu azul
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 100);
    
    // Camera (visão isométrica elevada)
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    this.camera.position.set(0, 25, 35);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // Raycaster para cliques
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Setup inicial
    this.setupLights();
    this.createGround();
    this.createBuildings();
    this.createDecoration();
    
    // Event listeners
    this.setupEventListeners();
    
    // Start animation
    this.animate();
    
    console.log('[VillageScene3D] Vila 3D inicializada');
  }

  /**
   * Configura iluminação da cena
   */
  private setupLights(): void {
    // Luz ambiente suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Luz direcional (sol)
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 0.8);
    sunLight.position.set(20, 40, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    this.scene.add(sunLight);
    
    // Luz hemisférica (céu/chão)
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x6B8E23, 0.4);
    this.scene.add(hemiLight);
  }

  /**
   * Cria o chão da vila
   */
  private createGround(): void {
    // Grama
    const groundGeometry = new THREE.PlaneGeometry(80, 80);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x5FAD56, // Verde grama
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Caminho de pedra (circular no centro)
    const pathGeometry = new THREE.CircleGeometry(12, 32);
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2B48C, // Bege/areia
      roughness: 0.9,
    });
    
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.01; // Ligeiramente acima da grama
    path.receiveShadow = true;
    this.scene.add(path);
  }

  /**
   * Cria fonte central
   */
  private createFountain(): THREE.Group {
    const fountain = new THREE.Group();
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    fountain.add(base);
    
    // Bacia de água
    const basinGeometry = new THREE.CylinderGeometry(1, 1.1, 0.5, 16);
    const basinMaterial = new THREE.MeshStandardMaterial({ color: 0x4682B4 });
    const basin = new THREE.Mesh(basinGeometry, basinMaterial);
    basin.position.y = 0.4;
    basin.castShadow = true;
    fountain.add(basin);
    
    // Coluna central
    const columnGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x708090 });
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.y = 1;
    column.castShadow = true;
    fountain.add(column);
    
    // Topo
    const topGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const top = new THREE.Mesh(topGeometry, baseMaterial);
    top.position.y = 1.6;
    top.castShadow = true;
    fountain.add(top);
    
    return fountain;
  }

  /**
   * Cria uma casa 3D
   */
  private createHouse(config: BuildingConfig): THREE.Group {
    const house = new THREE.Group();
    
    // Paredes
    const wallGeometry = new THREE.BoxGeometry(3, 2.5, 3);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.7,
    });
    
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 1.25;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);
    
    // Telhado
    const roofGeometry = new THREE.ConeGeometry(2.5, 1.5, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2691E, // Laranja terracota
      roughness: 0.8,
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.25;
    roof.rotation.y = Math.PI / 4; // 45° para ficar alinhado
    roof.castShadow = true;
    house.add(roof);
    
    // Porta
    const doorGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.75, 1.51);
    house.add(door);
    
    // Janelas
    const windowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x87CEEB });
    
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-0.8, 1.5, 1.51);
    house.add(window1);
    
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(0.8, 1.5, 1.51);
    house.add(window2);
    
    return house;
  }

  /**
   * Cria edificações da vila
   */
  private createBuildings(): void {
    // Configuração das edificações
    const buildingConfigs: BuildingConfig[] = [
      { type: 'shop', position: new THREE.Vector3(-10, 0, -8), name: 'Loja do Dalan', icon: '🛒', color: 0xFFD700 },
      { type: 'temple', position: new THREE.Vector3(10, 0, -8), name: 'Templo dos Ecos', icon: '🏛️', color: 0x9370DB },
      { type: 'craft', position: new THREE.Vector3(-15, 0, 3), name: 'Oficina de Craft', icon: '⚗️', color: 0x32CD32 },
      { type: 'inventory', position: new THREE.Vector3(15, 0, 3), name: 'Armazém', icon: '🎒', color: 0xA0522D },
      { type: 'quests', position: new THREE.Vector3(-10, 0, 14), name: 'Tábua de Missões', icon: '📜', color: 0xDAA520 },
      { type: 'achievements', position: new THREE.Vector3(10, 0, 14), name: 'Salão da Fama', icon: '🏆', color: 0xFFD700 },
      { type: 'exploration', position: new THREE.Vector3(-20, 0, -3), name: 'Portal de Exploração', icon: '🗺️', color: 0x4169E1 },
      { type: 'dungeons', position: new THREE.Vector3(20, 0, -3), name: 'Entrada das Dungeons', icon: '⚔️', color: 0x8B008B },
      { type: 'ranch', position: new THREE.Vector3(0, 0, 20), name: 'Seu Rancho', icon: '🏡', color: 0xCD853F },
    ];
    
    // Criar cada edificação
    for (const config of buildingConfigs) {
      const houseMesh = this.createHouse(config);
      houseMesh.position.copy(config.position);
      this.scene.add(houseMesh);
      
      // Highlight (círculo de seleção invisível inicialmente)
      const highlightGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
      const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        transparent: true,
        opacity: 0,
      });
      const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlight.position.set(config.position.x, 0.05, config.position.z);
      highlight.rotation.x = -Math.PI / 2;
      this.scene.add(highlight);
      
      // Adicionar à lista
      this.buildings.push({
        config,
        mesh: houseMesh,
        highlightMesh: highlight,
        isHovered: false,
      });
    }
    
    console.log(`[VillageScene3D] ${this.buildings.length} edificações criadas`);
  }

  /**
   * Cria decorações (árvores, arbustos, fonte)
   */
  private createDecoration(): void {
    // Fonte central
    const fountain = this.createFountain();
    fountain.position.set(0, 0, 0);
    this.scene.add(fountain);
    
    // Árvores ao redor
    const treePositions = [
      new THREE.Vector3(-25, 0, -10),
      new THREE.Vector3(25, 0, -10),
      new THREE.Vector3(-25, 0, 10),
      new THREE.Vector3(25, 0, 10),
      new THREE.Vector3(0, 0, -20),
    ];
    
    for (const pos of treePositions) {
      const tree = this.createTree();
      tree.position.copy(pos);
      this.scene.add(tree);
    }
  }

  /**
   * Cria uma árvore simples
   */
  private createTree(): THREE.Group {
    const tree = new THREE.Group();
    
    // Tronco
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Copa (3 esferas)
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    
    for (let i = 0; i < 3; i++) {
      const foliageGeometry = new THREE.SphereGeometry(1.2 - i * 0.2, 8, 8);
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 3 + i * 0.8;
      foliage.castShadow = true;
      tree.add(foliage);
    }
    
    return tree;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    
    // Mouse move para hover
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.updateHover();
    });
    
    // Click para interagir
    canvas.addEventListener('click', () => {
      if (this.hoveredBuilding && this.onBuildingClick) {
        console.log(`[VillageScene3D] Clicked: ${this.hoveredBuilding.config.name}`);
        this.onBuildingClick(this.hoveredBuilding.config.type);
      }
    });
    
    // Cursor pointer quando hover
    canvas.style.cursor = 'default';
  }

  /**
   * Atualiza hover state
   */
  private updateHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Verificar interseção com edificações
    const meshes = this.buildings.map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);
    
    // Resetar hover anterior
    if (this.hoveredBuilding) {
      if (this.hoveredBuilding.highlightMesh) {
        (this.hoveredBuilding.highlightMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
      this.hoveredBuilding.isHovered = false;
    }
    
    // Atualizar novo hover
    if (intersects.length > 0) {
      // Encontrar qual edificação foi atingida
      const hitMesh = intersects[0].object.parent;
      const building = this.buildings.find(b => b.mesh === hitMesh);
      
      if (building) {
        this.hoveredBuilding = building;
        building.isHovered = true;
        
        if (building.highlightMesh) {
          (building.highlightMesh.material as THREE.MeshBasicMaterial).opacity = 0.3;
        }
        
        this.renderer.domElement.style.cursor = 'pointer';
        
        if (this.onBuildingHover) {
          this.onBuildingHover(building.config.type, `${building.config.icon} ${building.config.name}`);
        }
      }
    } else {
      this.hoveredBuilding = null;
      this.renderer.domElement.style.cursor = 'default';
      
      if (this.onBuildingHover) {
        this.onBuildingHover(null, '');
      }
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Rotação suave da câmera (opcional)
    // this.camera.position.x = Math.sin(Date.now() * 0.0001) * 40;
    // this.camera.position.z = Math.cos(Date.now() * 0.0001) * 40;
    // this.camera.lookAt(0, 0, 0);
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Resize handler
   */
  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.renderer.dispose();
    
    // Remove canvas do DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    
    console.log('[VillageScene3D] Disposed');
  }
}

