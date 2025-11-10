/**
 * 3D Ranch Scene - PS1 Style (Static layout + skin system)
 * Beast Keepers - Three.js ranch visualization with Monster Rancher aesthetic
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { PS1Grass } from '../vegetation/PS1Grass';
import { PS1Water } from '../water/PS1Water';
import { RanchCritters } from '../events/RanchCritters';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface TreePlacement {
  position: Vec2;
  rotation?: number;
  scale?: number;
}

interface HayBalePlacement {
  position: Vec3;
  rotation?: number;
  scale?: number;
}

interface LampPlacement {
  position: Vec2;
}

interface RockPlacement {
  position: Vec3;
  scale?: number;
}

interface FlowerPlacement {
  position: Vec3;
  colorIndex: number;
  rotation?: number;
  scale?: number;
}

interface MountainPlacement {
  position: Vec3;
  radius: number;
  height: number;
  colorIndex: number;
  rotation?: number;
}

interface CloudPlacement {
  position: Vec3;
  scale?: number;
}

interface RanchLayout {
  house: { position: Vec3; obstacleRadius: number };
  pond: { position: Vec3; outerRadius: number; innerRadius: number; collisionRadius: number; waterSize: number };
  fence: { radius: number; postCount: number };
  walkableRadius: number;
  grass: { count: number; area: number; seed: number };
  trees: TreePlacement[];
  hayBales: HayBalePlacement[];
  lamps: LampPlacement[];
  rocks: RockPlacement[];
  flowers: FlowerPlacement[];
  mountains: MountainPlacement[];
  clouds: CloudPlacement[];
}

interface HouseSkin {
  foundationColor: number;
  bodyColor: number;
  trimColor: number;
  roofColor: number;
  ridgeColor: number;
  doorColor: number;
  knobColor: number;
  windowFrameColor: number;
  windowGlassColor: number;
  chimneyColor: number;
  chimneyTopColor: number;
  porchColor: number;
}

interface GroundSkin {
  terrainColor: number;
  borderColor: number;
  centerPatchColor: number;
  pathRingColor: number;
  walkwayStoneColor: number;
}

interface TreeSkin {
  trunkColor: number;
  foliagePrimaryColor: number;
  foliageSecondaryColor: number;
}

interface LampSkin {
  poleColor: number;
  capColor: number;
  glassColor: number;
  emissiveColor: number;
  lightColor: number;
}

interface PondSkin {
  rimColor: number;
  innerRimColor: number;
  waterColor: number;
}

interface RanchSkin {
  id: string;
  displayName: string;
  ground: GroundSkin;
  house: HouseSkin;
  tree: TreeSkin;
  lamp: LampSkin;
  pond: PondSkin;
  hayBaleColor: number;
  rockColor: number;
  flowerColors: number[];
  fenceColor: number;
  cloudColor: number;
  cloudEmissive: number;
  mountainColors: number[];
  grassColor: number;
}

interface Obstacle {
  position: Vec2;
  radius: number;
}

const WORLD_Y_OFFSET = -1.2;

const DEFAULT_LAYOUT: RanchLayout = {
  house: { position: [0, 0.2, -6.8], obstacleRadius: 2.6 },
  pond: {
    position: [1.6, 0, 3.4],
    outerRadius: 1.5,
    innerRadius: 1.4,
    collisionRadius: 1.68,
    waterSize: 1.5,
  },
  fence: { radius: 9, postCount: 24 },
  walkableRadius: 7.3,
  grass: { count: 650, area: 16, seed: 1337 },
  trees: [{ position: [-4.2, -3.4], rotation: 0.32, scale: 1.0 }],
  hayBales: [],
  lamps: [
    { position: [-2.0, -1.8] },
    { position: [2.0, -1.8] },
  ],
  rocks: [
    { position: [-1.9, 0.0, -3.6], scale: 1.05 },
    { position: [2.7, 0.0, -3.1], scale: 1.1 },
    { position: [-3.8, 0.0, 2.4], scale: 0.95 },
    { position: [4.4, 0.0, 1.3], scale: 0.9 },
  ],
  flowers: [
    { position: [-1.2, 0, -1.2], colorIndex: 0 },
    { position: [-1.8, 0, -0.4], colorIndex: 1 },
    { position: [1.2, 0, -1.0], colorIndex: 2 },
    { position: [1.8, 0, -2.0], colorIndex: 4 },
  ],
  mountains: [
    { position: [0, 0, -10.6], radius: 4.8, height: 8.8, colorIndex: 0 },
    { position: [6.8, 0, -8.4], radius: 4.2, height: 7.3, colorIndex: 1, rotation: 0.4 },
    { position: [-6.6, 0, -8.2], radius: 4.1, height: 7.6, colorIndex: 2, rotation: -0.5 },
    { position: [9.4, 0, -3.6], radius: 3.9, height: 6.8, colorIndex: 1 },
    { position: [-9.2, 0, -3.8], radius: 3.9, height: 6.6, colorIndex: 3 },
    { position: [7.2, 0, 0.8], radius: 3.5, height: 5.4, colorIndex: 0 },
    { position: [-7.4, 0, 0.6], radius: 3.4, height: 5.3, colorIndex: 2 },
  ],
  clouds: [
    { position: [-5.8, 6.2, -5.6], scale: 1.2 },
    { position: [5.8, 6.2, -5.4], scale: 1.2 },
    { position: [0, 7.0, -7.2], scale: 1.35 },
  ],
};

const DEFAULT_SKIN: RanchSkin = {
  id: 'classic-ps1',
  displayName: 'Classic PS1 Ranch',
  ground: {
    terrainColor: 0x4f7652,
    borderColor: 0x3c291d,
    centerPatchColor: 0x5e8f64,
    pathRingColor: 0xd5b48b,
    walkwayStoneColor: 0xb9a98c,
  },
  house: {
    foundationColor: 0x4c4f62,
    bodyColor: 0xc23b3b,
    trimColor: 0x6d3f20,
    roofColor: 0x8b4a27,
    ridgeColor: 0x6e3418,
    doorColor: 0xd7882f,
    knobColor: 0xf9cc4e,
    windowFrameColor: 0xf3f5ff,
    windowGlassColor: 0xb9e4ff,
    chimneyColor: 0x7b4526,
    chimneyTopColor: 0x5d2f18,
    porchColor: 0x6d5240,
  },
  tree: {
    trunkColor: 0x76532d,
    foliagePrimaryColor: 0x56b072,
    foliageSecondaryColor: 0x4aa968,
  },
  lamp: {
    poleColor: 0x53423a,
    capColor: 0x2c1f18,
    glassColor: 0xfff3c4,
    emissiveColor: 0xffe49a,
    lightColor: 0xffcfa8,
  },
  pond: {
    rimColor: 0x3cc4ff,
    innerRimColor: 0x3cc4ff,
    waterColor: 0x3cc4ff,
  },
  hayBaleColor: 0xe5ca74,
  rockColor: 0x8c8f95,
  flowerColors: [0xffa0c0, 0xffd65c, 0xff9159, 0xb074ff, 0xff6d7a],
  fenceColor: 0xd4a574,
  cloudColor: 0xf3f6ff,
  cloudEmissive: 0xe0e4ff,
  mountainColors: [0x8b7355, 0xa08060, 0x7a6348, 0x9a8570],
  grassColor: 0x3f6d3f,
};

export class RanchScene3D {
  private threeScene: ThreeScene;

  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;
  private baseYPosition = WORLD_Y_OFFSET;
  private activeRigAnimation: 'idle' | 'walk' | null = null;
  private needsFit = false;

  private layout: RanchLayout = DEFAULT_LAYOUT;
  private skin: RanchSkin = DEFAULT_SKIN;

  private decorationsRoot: THREE.Group | null = null;
  private grass: PS1Grass | null = null;
  private water: PS1Water | null = null;
  private critters: RanchCritters | null = null;

  private gltfLoader = new GLTFLoader();
  private houseModel: THREE.Group | null = null;
  private treeModel: THREE.Group | null = null;

  private obstacles: Obstacle[] = [];
  private boundaryRadius: number = DEFAULT_LAYOUT.walkableRadius;

  private currentTarget: THREE.Vector3 | null = null;
  private isMoving = false;
  private moveSpeed = 1.5; // Unidades por segundo
  private nextMoveTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupRanchEnvironment();
  }

  private setupRanchEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;

    camera.fov = 46;
    camera.position.set(0, 5.2, 9.6);
    camera.lookAt(0, WORLD_Y_OFFSET + 1.0, 0);
    camera.updateProjectionMatrix();
    
    scene.background = new THREE.Color(0x1d2b44);
    scene.fog = new THREE.Fog(0x1d2b44, 18, 45);

    this.rebuildDecorations();
  }

  public applySkin(skin: RanchSkin) {
    this.skin = skin;
    this.rebuildDecorations();
  }

  private rebuildDecorations() {
    const scene = this.threeScene.getScene();
    this.clearDecorations();

    this.decorationsRoot = new THREE.Group();
    this.decorationsRoot.position.y = WORLD_Y_OFFSET;
    this.threeScene.addObject(this.decorationsRoot);

    this.createGround();
    this.createPond();
    this.createGrass();
    this.createFlowers();
    this.createTrees();
    this.createHayBales();
    this.createRocks();
    this.createLamps();
    this.createMountains();
    this.createClouds();
    this.createHouse();

    this.setupObstacles();
    
    this.critters = new RanchCritters(scene);
  }
  
  private clearDecorations() {
    if (this.critters) {
      this.critters.dispose();
      this.critters = null;
    }

    if (this.grass) {
      if (this.decorationsRoot) {
        this.decorationsRoot.remove(this.grass.getMesh());
      }
      this.grass.dispose();
      this.grass = null;
    }

    if (this.water) {
      if (this.decorationsRoot) {
        this.decorationsRoot.remove(this.water.getMesh());
      }
      this.water.dispose();
      this.water = null;
    }

    if (this.decorationsRoot) {
      this.disposeObject(this.decorationsRoot);
      this.threeScene.removeObject(this.decorationsRoot);
      this.decorationsRoot = null;
    }

    this.houseModel = null;
    this.treeModel = null;
  }

  private disposeObject(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose?.());
        } else if ((material as THREE.Material).dispose) {
          (material as THREE.Material).dispose();
        }
      }
    });
  }

  private addDecoration(object: THREE.Object3D) {
    if (!this.decorationsRoot) {
      throw new Error('Decoration root not initialised');
    }
    this.decorationsRoot.add(object);
  }

  private loadStaticModel(
    url: string,
    options: {
      position: Vec3;
      rotationY?: number;
      targetHeight?: number;
      scaleMultiplier?: number;
      name?: string;
      onLoaded?: (group: THREE.Group) => void;
    },
  ) {
    this.gltfLoader.load(
      url,
      (gltf) => {
        if (!this.decorationsRoot) {
          return;
        }

        const wrapper = new THREE.Group();
        if (options.name) {
          wrapper.name = options.name;
        }

        const root = gltf.scene;
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        wrapper.add(root);

        const sizeVector = new THREE.Vector3();
        const centerVector = new THREE.Vector3();
        const box = new THREE.Box3().setFromObject(root);
        box.getSize(sizeVector);

        if (options.targetHeight && sizeVector.y > 0) {
          const scaleTarget =
            (options.targetHeight * (options.scaleMultiplier ?? 1)) / sizeVector.y;
          root.scale.setScalar(scaleTarget);
          box.setFromObject(root);
          box.getSize(sizeVector);
        }

        box.getCenter(centerVector);
        root.position.sub(centerVector);

        wrapper.position.set(
          options.position[0],
          options.position[1] + WORLD_Y_OFFSET + sizeVector.y / 2,
          options.position[2],
        );

        if (options.rotationY) {
          wrapper.rotation.y = options.rotationY;
        }

        this.addDecoration(wrapper);
        options.onLoaded?.(wrapper);
      },
      undefined,
      (error) => {
        console.error(`[RanchScene3D] Failed to load model '${url}'`, error);
      },
    );
  }

  private createGround() {
    const groundGeometry = new THREE.PlaneGeometry(26, 26, 80, 80);
    const positions = groundGeometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const radialFalloff = 1 - Math.min(1, Math.sqrt(x * x + z * z) / 13);
      const noise =
        Math.sin(x * 0.14) * 0.04 +
        Math.cos(z * 0.12) * 0.03 +
        Math.sin((x + z) * 0.1) * 0.02;

      positions.setY(i, noise * radialFalloff);
    }
    positions.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.ground.terrainColor,
      roughness: 0.82,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeometry, terrainMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = WORLD_Y_OFFSET;
    ground.receiveShadow = true;
    this.addDecoration(ground);

    const borderGeometry = new THREE.RingGeometry(13.4, 14.6, 64);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.ground.borderColor,
      roughness: 0.92,
      metalness: 0.03,
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = WORLD_Y_OFFSET - 0.02;
    border.receiveShadow = true;
    this.addDecoration(border);

    const centerGeometry = new THREE.CircleGeometry(8.0, 64);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.ground.centerPatchColor,
      roughness: 0.78,
      metalness: 0.04,
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    center.position.y = WORLD_Y_OFFSET + 0.01;
    center.receiveShadow = true;
    this.addDecoration(center);

    // Removed walkway ring to keep ground clean
  }

  private createPond() {
    const pondGroup = new THREE.Group();

    this.water = new PS1Water({
      size: this.layout.pond.waterSize,
      segments: 28,
      color: this.skin.pond.waterColor,
      waveSpeed: 0.6,
      waveHeight: 0.06,
    });
    const waterMesh = this.water.getMesh();
    waterMesh.position.set(
      this.layout.pond.position[0],
      this.layout.pond.position[1] + WORLD_Y_OFFSET + 0.12,
      this.layout.pond.position[2],
    );
    pondGroup.add(waterMesh);

    this.addDecoration(pondGroup);
  }

  private createGrass() {
    this.grass = new PS1Grass({
      count: this.layout.grass.count,
      area: this.layout.grass.area,
      color: this.skin.grassColor,
      height: 0.28,
      windSpeed: 0.32,
      windStrength: 0.014,
      lakePosition: { x: this.layout.pond.position[0], z: this.layout.pond.position[2] },
      lakeRadius: this.layout.pond.collisionRadius,
      seed: this.layout.grass.seed,
      offsetY: WORLD_Y_OFFSET,
      maxRadius: this.layout.walkableRadius - 0.2,
    });
    this.addDecoration(this.grass.getMesh());
  }

  private createFlowers() {
    for (const placement of this.layout.flowers) {
      const flowerGroup = new THREE.Group();
      const color = this.skin.flowerColors[placement.colorIndex % this.skin.flowerColors.length];

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6),
        new THREE.MeshStandardMaterial({ color: 0x2f4a21, roughness: 0.8 }),
      );
      stem.castShadow = true;
      stem.position.y = 0.11;
      flowerGroup.add(stem);
      
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xffe27a,
          roughness: 0.4,
          metalness: 0.1,
          emissive: 0x70531a,
        }),
      );
      center.castShadow = true;
      center.position.y = 0.23;
      flowerGroup.add(center);
      
      const petalMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0,
        emissive: 0x111111,
        emissiveIntensity: 0.12,
      });
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), petalMaterial);
        petal.position.set(Math.cos(angle) * 0.08, 0.2, Math.sin(angle) * 0.08);
        petal.scale.set(1.2, 0.45, 0.8);
        petal.castShadow = true;
        flowerGroup.add(petal);
      }
      
      flowerGroup.position.set(
        placement.position[0],
        (placement.position[1] ?? 0) + WORLD_Y_OFFSET,
        placement.position[2],
      );
      if (placement.rotation) {
        flowerGroup.rotation.y = placement.rotation;
      }
      if (placement.scale) {
        flowerGroup.scale.setScalar(placement.scale);
      }

      this.addDecoration(flowerGroup);
    }
  }

  private createTrees() {
    this.treeModel = null;

    if (this.layout.trees.length === 0) {
      return;
    }

    const tree = this.layout.trees[0];
    this.loadStaticModel('/assets/3d/Ranch/Tree/Tree1.glb', {
      position: [tree.position[0], 0, tree.position[1]],
      rotationY: tree.rotation ?? 0,
      targetHeight: 6,
      scaleMultiplier: tree.scale ?? 1,
      name: 'ranch-tree',
      onLoaded: (group) => {
        this.treeModel = group;
      },
    });
  }

  private createHayBales() {
    if (this.layout.hayBales.length === 0) {
      return;
    }

    const group = new THREE.Group();
    const geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12);
    const material = new THREE.MeshStandardMaterial({
      color: this.skin.hayBaleColor,
      roughness: 0.6,
      metalness: 0.1,
    });
    
    for (const bale of this.layout.hayBales) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(bale.position[0], bale.position[1] + WORLD_Y_OFFSET, bale.position[2]);
      mesh.rotation.y = bale.rotation ?? 0;
      mesh.scale.setScalar(bale.scale ?? 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    this.addDecoration(group);
  }

  private createRocks() {
    const group = new THREE.Group();
    for (const rock of this.layout.rocks) {
      const geometry = new THREE.DodecahedronGeometry(0.32, 1);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: this.skin.rockColor,
          roughness: 0.85,
          metalness: 0.1,
        }),
      );
      mesh.position.set(rock.position[0], rock.position[1] + WORLD_Y_OFFSET, rock.position[2]);
      mesh.scale.setScalar(rock.scale ?? 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    this.addDecoration(group);
  }

  private createLamps() {
    const group = new THREE.Group();
    for (const lamp of this.layout.lamps) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8),
        new THREE.MeshStandardMaterial({
          color: this.skin.lamp.poleColor,
          roughness: 0.7,
          metalness: 0.15,
        }),
      );
      pole.position.set(lamp.position[0], WORLD_Y_OFFSET + 0.9, lamp.position[1]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      group.add(pole);

      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.3, 8),
        new THREE.MeshStandardMaterial({
          color: this.skin.lamp.capColor,
      roughness: 0.6,
          metalness: 0.2,
        }),
      );
      cap.position.set(lamp.position[0], WORLD_Y_OFFSET + 1.85, lamp.position[1]);
      cap.castShadow = true;
      group.add(cap);

      const glass = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 12),
        new THREE.MeshStandardMaterial({
          color: this.skin.lamp.glassColor,
          emissive: this.skin.lamp.emissiveColor,
          emissiveIntensity: 0.8,
          roughness: 0.2,
      metalness: 0.1,
          transparent: true,
          opacity: 0.85,
        }),
      );
      glass.position.set(lamp.position[0], WORLD_Y_OFFSET + 1.62, lamp.position[1]);
      group.add(glass);

      const light = new THREE.PointLight(this.skin.lamp.lightColor, 0.7, 6, 2);
      light.position.set(lamp.position[0], WORLD_Y_OFFSET + 1.62, lamp.position[1]);
      light.castShadow = false;
      group.add(light);
    }

    this.addDecoration(group);
  }

  private createMountains() {
    const group = new THREE.Group();
    for (const mountain of this.layout.mountains) {
      const geometry = new THREE.ConeGeometry(mountain.radius, mountain.height, 12);
      const material = new THREE.MeshLambertMaterial({
        color: this.skin.mountainColors[mountain.colorIndex % this.skin.mountainColors.length],
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(mountain.position[0], WORLD_Y_OFFSET + mountain.height / 2 - 0.5, mountain.position[2]);
      mesh.rotation.y = mountain.rotation ?? 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    this.addDecoration(group);
  }

  private createClouds() {
    const group = new THREE.Group();
    for (const cloud of this.layout.clouds) {
      const cluster = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({
        color: this.skin.cloudColor,
        transparent: true,
        opacity: 0.85,
        emissive: this.skin.cloudEmissive,
        emissiveIntensity: 0.05,
        roughness: 0.6,
        metalness: 0,
      });

      const offsets: Vec3[] = [
        [-0.6, 0.05, 0],
        [0, 0.2, 0.2],
        [0.6, 0.05, -0.1],
      ];

      for (const offset of offsets) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), material);
        sphere.position.set(offset[0], offset[1], offset[2]);
        sphere.scale.set(1.3, 0.7, 1.1);
        cluster.add(sphere);
      }

      cluster.position.set(cloud.position[0], cloud.position[1] + WORLD_Y_OFFSET, cloud.position[2]);
      const scale = cloud.scale ?? 1;
      cluster.scale.setScalar(scale);
      group.add(cluster);
    }
    this.addDecoration(group);
  }

  private createHouse() {
    this.houseModel = null;

    this.loadStaticModel('/assets/3d/Ranch/House/House1.glb', {
      position: this.layout.house.position,
      rotationY: 0,
      targetHeight: 5,
      name: 'ranch-house',
      onLoaded: (group) => {
        this.houseModel = group;
      },
    });
  }

  private setupObstacles() {
    const obstacles: Obstacle[] = [];
    const push = (x: number, z: number, radius: number) => obstacles.push({ position: [x, z], radius });

    push(this.layout.pond.position[0], this.layout.pond.position[2], this.layout.pond.collisionRadius);
    push(this.layout.house.position[0], this.layout.house.position[2], this.layout.house.obstacleRadius);
    this.layout.trees.forEach((tree) => push(tree.position[0], tree.position[1], 1.25));
    this.layout.lamps.forEach((lamp) => push(lamp.position[0], lamp.position[1], 0.35));
    this.layout.rocks.forEach((rock) => push(rock.position[0], rock.position[2], 0.4));

    const fencePoints = 16;
    for (let i = 0; i < fencePoints; i++) {
      const angle = (i / fencePoints) * Math.PI * 2;
      push(Math.cos(angle) * this.layout.fence.radius, Math.sin(angle) * this.layout.fence.radius, 0.45);
    }

    this.obstacles = obstacles;
    this.boundaryRadius = this.layout.walkableRadius;
  }

  private isPositionValid(x: number, z: number, clearance: number = 0.5): boolean {
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > this.boundaryRadius) {
      return false;
    }

    for (const obstacle of this.obstacles) {
      const dx = x - obstacle.position[0];
      const dz = z - obstacle.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < obstacle.radius + clearance) {
        return false;
      }
    }

    return true;
  }

  private chooseNextMovePoint(): THREE.Vector3 | null {
    const maxAttempts = 30;

    if (!this.beastGroup) {
      return null;
    }

    const currentPos = this.beastGroup.position;
    const distFromCenter = Math.sqrt(currentPos.x ** 2 + currentPos.z ** 2);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let x: number;
      let z: number;

      if (distFromCenter > 5) {
        if (Math.random() < 0.8) {
          x = (Math.random() - 0.5) * 6;
          z = (Math.random() - 0.5) * 6;
    } else {
          x = (Math.random() - 0.5) * 12;
          z = (Math.random() - 0.5) * 12;
        }
    } else {
        x = (Math.random() - 0.5) * 12;
        z = (Math.random() - 0.5) * 12;
      }

      if (this.isPositionValid(x, z, 0.75)) {
        return new THREE.Vector3(x, 0, z);
      }
    }

    return null;
  }

  private startNextMove() {
    const target = this.chooseNextMovePoint();

    if (target) {
      this.currentTarget = target;
      this.isMoving = true;
      if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('walk');
      }
    } else {
      this.nextMoveTime = 2;
    }
  }

  private updateBeastMovement(delta: number) {
    if (!this.beastGroup) {
      return;
    }

    if (!this.isMoving) {
      this.nextMoveTime -= delta;
      if (this.nextMoveTime <= 0) {
        this.startNextMove();
        this.nextMoveTime = 3 + Math.random() * 3;
      } else if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('idle');
      } else if (this.idleAnimation) {
        this.idleAnimation();
      }
      return;
    }
    
    if (!this.currentTarget) {
      this.isMoving = false;
      return;
    }

    const currentPos = this.beastGroup.position;
      const direction = new THREE.Vector3(
      this.currentTarget.x - currentPos.x,
        0,
      this.currentTarget.z - currentPos.z,
      );
      const distance = direction.length();
      
    if (distance < 0.15) {
        this.isMoving = false;
        this.currentTarget = null;
      this.nextMoveTime = 2 + Math.random() * 3;
        if (this.beastModel?.hasRiggedAnimations()) {
          this.playRigAnimation('idle');
        }
        return;
      }
      
      direction.normalize();
    const moveDistance = Math.min(distance, this.moveSpeed * delta);
    const newX = currentPos.x + direction.x * moveDistance;
    const newZ = currentPos.z + direction.z * moveDistance;
      
      if (!this.isPositionValid(newX, newZ, 0.6)) {
      const bounce = this.getBounceDirection(currentPos.x, currentPos.z, newX, newZ);
      const bounceTarget = this.getTargetTowardsCenter(currentPos.x, currentPos.z, bounce);
        if (bounceTarget) {
          this.currentTarget = bounceTarget;
        } else {
          this.isMoving = false;
          this.currentTarget = null;
          this.nextMoveTime = 1;
          }
        return;
      }
      
      currentPos.x = newX;
      currentPos.z = newZ;

      if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('walk');
      }
      
    this.beastGroup.rotation.y = Math.atan2(direction.x, direction.z);
  }
  
  private getBounceDirection(currentX: number, currentZ: number, blockedX: number, blockedZ: number): THREE.Vector3 {
    let closestObstacle: Obstacle | null = null;
    let minDist = Infinity;
    for (const obstacle of this.obstacles) {
      const dx = blockedX - obstacle.position[0];
      const dz = blockedZ - obstacle.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        closestObstacle = obstacle;
      }
    }
    
    if (!closestObstacle) {
      const away = new THREE.Vector3(-(blockedX - currentX), 0, -(blockedZ - currentZ));
      return away.normalize();
    }

    const awayVector = new THREE.Vector3(
      currentX - closestObstacle.position[0],
      0,
      currentZ - closestObstacle.position[1],
    ).normalize();
    
    return awayVector;
  }
  
  private getTargetTowardsCenter(currentX: number, currentZ: number, direction: THREE.Vector3): THREE.Vector3 | null {
    const toCenter = new THREE.Vector3(-currentX, 0, -currentZ).normalize();
    const blended = new THREE.Vector3(
      direction.x * 0.7 + toCenter.x * 0.3,
      0,
      direction.z * 0.7 + toCenter.z * 0.3,
    ).normalize();
    
    const distance = 2 + Math.random() * 2;
    const candidateX = currentX + blended.x * distance;
    const candidateZ = currentZ + blended.z * distance;
    if (this.isPositionValid(candidateX, candidateZ, 0.6)) {
      return new THREE.Vector3(candidateX, 0, candidateZ);
    }

    const centerCandidateX = currentX + toCenter.x * 2;
    const centerCandidateZ = currentZ + toCenter.z * 2;
    if (this.isPositionValid(centerCandidateX, centerCandidateZ, 0.6)) {
      return new THREE.Vector3(centerCandidateX, 0, centerCandidateZ);
    }

    return null;
  }

  public setBeast(beastLine: string) {
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }

    this.beastModel = new BeastModel(beastLine);
    this.beastGroup = this.beastModel.getGroup();
    this.needsFit = true;
    this.baseYPosition = WORLD_Y_OFFSET - 0.5;
    this.isMoving = false;
    this.currentTarget = null;
    this.nextMoveTime = 2 + Math.random() * 2;
    this.activeRigAnimation = null;

    this.beastGroup.position.set(0, 0, 0);
    this.threeScene.addObject(this.beastGroup);

    if (this.beastModel.hasRiggedAnimations()) {
      this.playRigAnimation('idle');
    } else {
      this.idleAnimation = this.beastModel.playIdleAnimation();
    }
  }

  public update(delta: number) {
    if (this.beastModel) {
      this.beastModel.update(delta);
    }

    if (this.beastGroup && this.needsFit && this.fitBeastToRanch(this.beastGroup)) {
      this.needsFit = false;
    }

    if (this.water) {
      this.water.update(delta);
    }

    if (this.grass) {
      this.grass.update(delta);
    }

    if (this.critters) {
      this.critters.update(delta);
    }

    this.updateBeastMovement(delta);
  }

  public render() {
    this.threeScene.render();
  }

  public startLoop() {
    this.threeScene.startAnimationLoop((delta) => this.update(delta));
  }

  public stopLoop() {
    this.threeScene.stopAnimationLoop();
  }

  public resize(width: number, height: number) {
    this.threeScene.resize(width, height);
  }

  public dispose() {
    this.beastModel?.dispose();
    this.beastModel = null;
    this.beastGroup = null;

    this.clearDecorations();
    this.threeScene.dispose();
  }

  private playRigAnimation(name: 'idle' | 'walk') {
    if (!this.beastModel || !this.beastModel.hasRiggedAnimations()) {
      return;
    }

    if (this.activeRigAnimation === name) {
        return;
    }

    const played = this.beastModel.playAnimation(name, {
      loop: THREE.LoopRepeat,
      clampWhenFinished: false,
      fadeIn: 0.2,
      fadeOut: 0.2,
      forceRestart: true,
    });

    if (played) {
      this.activeRigAnimation = name;
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

    return true;
  }
}



