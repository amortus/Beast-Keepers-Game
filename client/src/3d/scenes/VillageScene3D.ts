/**
 * Vila 3D Interativa - Beast Keepers
 * Cena dinâmica onde cada casa representa um NPC ou estrutura da vila.
 */

import * as THREE from 'three';

import type { VillageBuildingConfig } from '../../types/village';

interface BuildingInstance {
  config: VillageBuildingConfig;
  group: THREE.Group;
  highlight: THREE.Mesh;
  isHovered: boolean;
}

export class VillageScene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationId: number | null = null;

  private buildingGroup: THREE.Group;
  private buildings: BuildingInstance[] = [];
  private hoveredBuilding: BuildingInstance | null = null;

  private mouseMoveHandler: (event: MouseEvent) => void;
  private clickHandler: (event: MouseEvent) => void;

  public onBuildingClick?: (building: VillageBuildingConfig) => void;
  public onBuildingHover?: (building: VillageBuildingConfig | null) => void;

  constructor(
    container: HTMLElement,
    width: number,
    height: number,
    buildings: VillageBuildingConfig[],
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 35, 110);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    this.camera.position.set(8, 24, 38);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);

    this.setupLights();
    this.createGround();
    this.createDecoration();
    this.setBuildings(buildings);
    this.setupEventListeners();

    this.animate();
    console.log('[VillageScene3D] Vila 3D inicializada');
  }

  public setBuildings(buildings: VillageBuildingConfig[]): void {
    this.clearBuildings();

    for (const config of buildings) {
      const group = this.createBuildingMesh(config);
      group.position.set(config.position.x, config.position.y, config.position.z);
      if (config.rotation) {
        group.rotation.y = config.rotation;
      }
      group.castShadow = true;
      group.receiveShadow = true;
      group.userData.buildingId = config.id;

      const highlight = this.createHighlightCircle(config);
      highlight.position.set(config.position.x, 0.05, config.position.z);
      highlight.userData.buildingId = config.id;

      this.buildingGroup.add(group);
      this.buildingGroup.add(highlight);

      this.buildings.push({
        config,
        group,
        highlight,
        isHovered: false,
      });
    }

    console.log(`[VillageScene3D] Carregado ${this.buildings.length} edifícios.`);
  }

  private clearBuildings(): void {
    for (const building of this.buildings) {
      this.disposeObject(building.group);
      this.disposeObject(building.highlight);
      this.buildingGroup.remove(building.group);
      this.buildingGroup.remove(building.highlight);
    }
    this.buildings = [];
    this.hoveredBuilding = null;
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff2d5, 0.8);
    sun.position.set(18, 38, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x5c8a3a, 0.35);
    this.scene.add(hemi);
  }

  private createGround(): void {
    const groundGroup = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x5b9b59, roughness: 0.85 }),
    );
    base.rotation.x = -Math.PI / 2;
    base.receiveShadow = true;
    groundGroup.add(base);

    const lushGrass = new THREE.Mesh(
      new THREE.CircleGeometry(26, 64),
      new THREE.MeshStandardMaterial({ color: 0x6ecf72, roughness: 0.82 }),
    );
    lushGrass.rotation.x = -Math.PI / 2;
    lushGrass.position.y = 0.01;
    lushGrass.receiveShadow = true;
    groundGroup.add(lushGrass);

    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(14.5, 60),
      new THREE.MeshStandardMaterial({ color: 0xdcc9a5, roughness: 0.88 }),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.015;
    plaza.receiveShadow = true;
    groundGroup.add(plaza);

    const plazaRing = new THREE.Mesh(
      new THREE.RingGeometry(15, 19.5, 60, 1),
      new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 0.78 }),
    );
    plazaRing.rotation.x = -Math.PI / 2;
    plazaRing.position.y = 0.012;
    plazaRing.receiveShadow = true;
    groundGroup.add(plazaRing);

    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xe4cfa8, roughness: 0.78 });

    const radialPaths: Array<{ size: [number, number, number]; position: [number, number, number]; rotation?: number }> = [
      { size: [4, 0.12, 18], position: [0, 0.04, 9] }, // templo
      { size: [12, 0.12, 3], position: [-12, 0.04, 4], rotation: Math.PI / 18 },
      { size: [12, 0.12, 3], position: [12, 0.04, 4], rotation: -Math.PI / 18 },
      { size: [4, 0.12, 14], position: [-8, 0.04, -9], rotation: -Math.PI / 12 },
      { size: [4, 0.12, 14], position: [8, 0.04, -9], rotation: Math.PI / 12 },
    ];

    for (const path of radialPaths) {
      const walkway = new THREE.Mesh(new THREE.BoxGeometry(...path.size), pathMaterial);
      walkway.position.set(...path.position);
      if (path.rotation) {
        walkway.rotation.y = path.rotation;
      }
      walkway.receiveShadow = true;
      groundGroup.add(walkway);
    }

    this.scene.add(groundGroup);
  }

  private createDecoration(): void {
    const fountain = this.createFountain();
    fountain.position.set(0, 0, 0);
    this.scene.add(fountain);

    const treePositions: Array<[number, number]> = [
      [-30, -16],
      [30, -16],
      [-32, 18],
      [32, 18],
      [-12, 26],
      [12, 26],
    ];

    for (const [x, z] of treePositions) {
      const tree = this.createTree();
      tree.position.set(x, 0, z);
      this.scene.add(tree);
    }

    const lampPositions: Array<[number, number]> = [
      [-9, 7],
      [9, 7],
      [-6, -6],
      [6, -6],
    ];

    for (const [x, z] of lampPositions) {
      const lamp = this.createLampPost();
      lamp.position.set(x, 0, z);
      this.scene.add(lamp);
    }

    const flowerPositions: Array<[number, number]> = [
      [-4, 11],
      [4, 11],
      [-11, -2],
      [11, -2],
    ];

    for (const [x, z] of flowerPositions) {
      const flowerBed = this.createFlowerBed();
      flowerBed.position.set(x, 0, z);
      this.scene.add(flowerBed);
    }
  }

  private createFountain(): THREE.Group {
    const group = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: 0x9aa5b1, roughness: 0.6 }),
    );
    base.castShadow = true;
    group.add(base);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.35, 20),
      new THREE.MeshStandardMaterial({ color: 0x4f9dd3, roughness: 0.2, transparent: true, opacity: 0.85 }),
    );
    water.position.y = 0.3;
    group.add(water);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xb8c1cc, roughness: 0.4 }),
    );
    pillar.position.y = 0.9;
    pillar.castShadow = true;
    group.add(pillar);

    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.4 }),
    );
    top.position.y = 1.6;
    top.castShadow = true;
    group.add(top);

    return group;
  }

  private createTree(): THREE.Group {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x7b4a25, roughness: 0.9 }),
    );
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2a8a2d, roughness: 0.7 });
    for (let i = 0; i < 3; i++) {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.4 - i * 0.2, 10, 10), foliageMaterial);
      foliage.position.y = 3 + i * 0.9;
      foliage.castShadow = true;
      tree.add(foliage);
    }

    return tree;
  }

  private createLampPost(): THREE.Group {
    const lamp = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.35, 0.4, 10),
      new THREE.MeshStandardMaterial({ color: 0x3a2a21, roughness: 0.7 }),
    );
    base.position.y = 0.2;
    base.castShadow = true;
    lamp.add(base);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.12, 3.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a3a31, roughness: 0.6 }),
    );
    pole.position.y = 2.0;
    pole.castShadow = true;
    lamp.add(pole);

    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d2019, roughness: 0.5 }),
    );
    cap.position.y = 3.5;
    lamp.add(cap);

    const globeMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff3c4,
      emissive: 0xffdf9a,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), globeMaterial);
    globe.position.y = 3.2;
    lamp.add(globe);

    const light = new THREE.PointLight(0xffe4a0, 1.2, 10, 2);
    light.position.y = 3.3;
    lamp.add(light);

    return lamp;
  }

  private createFlowerBed(): THREE.Group {
    const group = new THREE.Group();

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4b08c, roughness: 0.75 }),
    );
    rim.position.y = 0.15;
    rim.receiveShadow = true;
    group.add(rim);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x4d3725, roughness: 0.9 }),
    );
    soil.position.y = 0.3;
    group.add(soil);

    const flowerColors = [0xff8f8f, 0xffd75e, 0x8ce3ff, 0xc99bff];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 0.9 + Math.random() * 0.2;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.22 + Math.random() * 0.08, 10, 10),
        new THREE.MeshStandardMaterial({
          color: flowerColors[i % flowerColors.length],
          roughness: 0.4,
        }),
      );
      flower.position.set(Math.cos(angle) * radius, 0.55 + Math.random() * 0.1, Math.sin(angle) * radius);
      flower.castShadow = true;
      group.add(flower);
    }

    return group;
  }

  private createHighlightCircle(config: VillageBuildingConfig): THREE.Mesh {
    const highlightColor = config.highlightColor ?? 0xffd257;
    const geometry = new THREE.CircleGeometry(2.4, 40);
    const material = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  private createBuildingMesh(config: VillageBuildingConfig): THREE.Group {
    switch (config.variant) {
      case 'shop':
        return this.createShop(config);
      case 'alchemy':
        return this.createAlchemySanctum(config);
      case 'temple':
        return this.createTemple(config);
      case 'tavern':
        return this.createTavern(config);
      case 'guild':
        return this.createGuildHall(config);
      case 'house':
      default:
        return this.createHouse(config);
    }
  }

  private createHouse(config: VillageBuildingConfig): THREE.Group {
    const house = new THREE.Group();

    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.6, 3.4),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.75 }),
    );
    walls.position.y = 1.3;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 1.6, 4),
      new THREE.MeshStandardMaterial({ color: 0xcb623a, roughness: 0.85 }),
    );
    roof.position.y = 3.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.6, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x6a4630, roughness: 0.6 }),
    );
    door.position.set(0, 0.8, 1.75);
    house.add(door);

    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x8bd5ff, roughness: 0.2, metalness: 0 });
    const windowGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.12);

    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-1.1, 1.6, 1.76);
    house.add(leftWindow);

    const rightWindow = leftWindow.clone();
    rightWindow.position.x = 1.1;
    house.add(rightWindow);

    return house;
  }

  private createShop(config: VillageBuildingConfig): THREE.Group {
    const shop = this.createHouse(config);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.1, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xf5a65b, roughness: 0.6 }),
    );
    awning.position.set(0, 2.05, 1.76);
    shop.add(awning);

    const stripes = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.01, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xffe1a6, roughness: 0.5 }),
    );
    stripes.position.set(0, 2.0, 1.77);
    shop.add(stripes);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.6, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x3c2f2f, roughness: 0.7 }),
    );
    sign.position.set(0, 2.7, 1.62);
    shop.add(sign);

    const signText = this.createBillboardText(config.icon, 0.4);
    signText.position.set(0, 2.7, 1.78);
    shop.add(signText);

    return shop;
  }

  private createAlchemySanctum(config: VillageBuildingConfig): THREE.Group {
    const lab = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.6, 3.8),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6, metalness: 0.08 }),
    );
    base.position.y = 1.3;
    base.castShadow = true;
    base.receiveShadow = true;
    lab.add(base);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 0.25, 4.1),
      new THREE.MeshStandardMaterial({ color: 0x6c58c9, roughness: 0.6 }),
    );
    trim.position.y = 2.4;
    trim.castShadow = true;
    lab.add(trim);

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 3.4, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x503d92, roughness: 0.7 }),
    );
    roof.position.y = 3.4;
    roof.castShadow = true;
    lab.add(roof);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 20, 16),
      new THREE.MeshStandardMaterial({
        color: 0x7de8ff,
        roughness: 0.08,
        metalness: 0.2,
        transparent: true,
        opacity: 0.55,
      }),
    );
    dome.position.y = 4.5;
    dome.castShadow = true;
    lab.add(dome);

    const focusCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5),
      new THREE.MeshStandardMaterial({
        color: 0xb7fffb,
        emissive: 0x4af7ff,
        emissiveIntensity: 1.2,
        roughness: 0.1,
        metalness: 0.4,
      }),
    );
    focusCrystal.position.y = 5.6;
    lab.add(focusCrystal);

    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.0, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xd7ccff, roughness: 0.4 }),
    );
    doorFrame.position.set(0, 1.0, 1.95);
    lab.add(doorFrame);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x3a2d4f, roughness: 0.6 }),
    );
    door.position.set(0, 0.95, 1.96);
    lab.add(door);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.55, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x2f214a, roughness: 0.6 }),
    );
    signBoard.position.set(0, 2.7, 1.9);
    lab.add(signBoard);

    const signIcon = this.createBillboardText(config.icon, 0.42);
    signIcon.position.set(0, 2.7, 2.05);
    lab.add(signIcon);

    const cauldron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 0.9, 16, 1, false),
      new THREE.MeshStandardMaterial({ color: 0x2d334a, roughness: 0.45, metalness: 0.35 }),
    );
    cauldron.position.set(1.7, 0.45, 1.2);
    cauldron.castShadow = true;
    lab.add(cauldron);

    const cauldronRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.08, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0x575f7d, roughness: 0.4 }),
    );
    cauldronRim.position.set(1.7, 0.9, 1.2);
    cauldronRim.rotation.x = Math.PI / 2;
    lab.add(cauldronRim);

    const brew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.22, 16),
      new THREE.MeshStandardMaterial({
        color: 0x71ffe0,
        emissive: 0x49ffd1,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9,
      }),
    );
    brew.position.set(1.7, 0.95, 1.2);
    lab.add(brew);

    const bubbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xaefcff,
      emissive: 0x6ef9ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    for (let i = 0; i < 3; i++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.18 + i * 0.05, 10, 10), bubbleMaterial);
      bubble.position.set(1.7 + (i - 1) * 0.18, 1.1 + i * 0.15, 1.2 + (i % 2 === 0 ? 0.12 : -0.1));
      lab.add(bubble);
    }

    const vialMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.3,
    });
    const contents = [0xff7ebd, 0x7bffb4, 0xfff37a];
    for (let i = 0; i < 3; i++) {
      const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.2, 12), vialMaterial);
      vial.position.set(-1.8 + i * 0.8, 1.0, 1.5);
      lab.add(vial);

      const stopper = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.25, 10),
        new THREE.MeshStandardMaterial({ color: 0x4d3b2c, roughness: 0.7 }),
      );
      stopper.position.set(-1.8 + i * 0.8, 1.7, 1.5);
      lab.add(stopper);

      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.65, 12),
        new THREE.MeshStandardMaterial({
          color: contents[i],
          emissive: contents[i],
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.9,
        }),
      );
      liquid.position.set(-1.8 + i * 0.8, 0.75, 1.5);
      lab.add(liquid);
    }

    return lab;
  }

  private createTemple(config: VillageBuildingConfig): THREE.Group {
    const temple = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 3.2, 6),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6 }),
    );
    base.position.y = 1.6;
    base.castShadow = true;
    base.receiveShadow = true;
    temple.add(base);

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 4.6, 3.4, 6),
      new THREE.MeshStandardMaterial({ color: 0xb7a0e3, roughness: 0.8 }),
    );
    roof.position.y = 3.8;
    roof.castShadow = true;
    temple.add(roof);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
    );
    dome.position.y = 5.1;
    temple.add(dome);

    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xf2ebff, roughness: 0.4 });
    for (let i = -2; i <= 2; i += 2) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.2, 12), columnMaterial);
      column.position.set(i, 1.6, 2.9);
      column.castShadow = true;
      temple.add(column);
    }

    const stairs = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.6, 3),
      new THREE.MeshStandardMaterial({ color: 0xd8c7ff, roughness: 0.6 }),
    );
    stairs.position.set(0, 0.3, 3.2);
    temple.add(stairs);

    const emblem = this.createBillboardText(config.icon, 0.6);
    emblem.position.set(0, 3, 3.6);
    temple.add(emblem);

    return temple;
  }

  private createTavern(config: VillageBuildingConfig): THREE.Group {
    const tavern = this.createHouse(config);

    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2.4, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x50322d, roughness: 0.8 }),
    );
    banner.position.set(-1.9, 2.1, 1.6);
    tavern.add(banner);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.1),
      new THREE.MeshStandardMaterial({
        color: 0xffd280,
        roughness: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    flag.position.set(-2.7, 2.0, 1.6);
    flag.rotation.y = Math.PI / 2;
    tavern.add(flag);

    const note = this.createBillboardText(config.icon, 0.35);
    note.position.set(0, 2.6, 1.7);
    tavern.add(note);

    return tavern;
  }

  private createGuildHall(config: VillageBuildingConfig): THREE.Group {
    const hall = this.createHouse(config);

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 3.6, 2.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x9b6434, roughness: 0.7 }),
    );
    roof.position.y = 3.4;
    hall.add(roof);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.6, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x3a2d2a, roughness: 0.7 }),
    );
    sign.position.set(0, 2.5, 1.7);
    hall.add(sign);

    const emblem = this.createBillboardText(config.icon, 0.38);
    emblem.position.set(0, 2.5, 1.85);
    hall.add(emblem);

    return hall;
  }

  private createBillboardText(icon: string, scale: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '180px sans-serif';
      ctx.fillText(icon, canvas.width / 2, canvas.height / 2 + 10);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(scale * 2, scale * 2), material);
    plane.renderOrder = 10;
    return plane;
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    this.mouseMoveHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.updateHover();
    };

    this.clickHandler = () => {
      if (this.hoveredBuilding && this.onBuildingClick && !this.hoveredBuilding.config.isLocked) {
        this.onBuildingClick(this.hoveredBuilding.config);
      }
    };

    canvas.addEventListener('mousemove', this.mouseMoveHandler);
    canvas.addEventListener('click', this.clickHandler);

    canvas.style.cursor = 'default';
  }

  private updateHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingGroup.children, true);

    if (this.hoveredBuilding) {
      const material = this.hoveredBuilding.highlight.material as THREE.MeshBasicMaterial;
      material.opacity = 0;
      this.hoveredBuilding.isHovered = false;
    }

    if (intersects.length === 0) {
      this.hoveredBuilding = null;
      this.renderer.domElement.style.cursor = 'default';
      this.onBuildingHover?.(null);
      return;
    }

    const targetBuilding = this.findBuildingFromObject(intersects[0].object);
    if (!targetBuilding) {
      this.hoveredBuilding = null;
      this.renderer.domElement.style.cursor = 'default';
      this.onBuildingHover?.(null);
      return;
    }

    this.hoveredBuilding = targetBuilding;
    this.hoveredBuilding.isHovered = true;
    const material = this.hoveredBuilding.highlight.material as THREE.MeshBasicMaterial;
    material.opacity = this.hoveredBuilding.config.isLocked ? 0.15 : 0.35;
    material.color.setHex(this.hoveredBuilding.config.highlightColor ?? 0xffd257);
    this.renderer.domElement.style.cursor = this.hoveredBuilding.config.isLocked ? 'not-allowed' : 'pointer';
    this.onBuildingHover?.(this.hoveredBuilding.config);
  }

  private findBuildingFromObject(object: THREE.Object3D): BuildingInstance | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      const buildingId = current.userData.buildingId;
      if (buildingId) {
        return this.buildings.find((b) => b.config.id === buildingId) ?? null;
      }
      current = current.parent as THREE.Object3D;
    }
    return null;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.clearBuildings();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    canvas.removeEventListener('click', this.clickHandler);

    this.renderer.dispose();
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }

    console.log('[VillageScene3D] Disposed');
  }
}

