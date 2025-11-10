/**
 * 3D Ranch Scene - Classic PS1 Procedural Environment
 * Recreates the low-poly ranch layout used before the imported 3D asset.
 */

import * as THREE from 'three';

import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { PS1Terrain } from '../terrain/PS1Terrain';

interface Obstacle {
  center: THREE.Vector2;
  radius: number;
}

export class RanchScene3D {
  private threeScene: ThreeScene;

  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;
  private activeRigAnimation: 'idle' | 'walk' | null = null;
  private needsFit = false;
  private baseYPosition = 0;

  private isMoving = false;
  private currentTarget: THREE.Vector3 | null = null;
  private nextMoveTime = 0;
  private moveSpeed = 1.1;

  private obstacles: Obstacle[] = [];
  private readonly boundaryRadius = 7.2;

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupScene();
  }

  private setupScene() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;

    scene.background = new THREE.Color(0x1d2b44);
    scene.fog = new THREE.Fog(0x1d2b44, 18, 45);

    camera.fov = 46;
    camera.position.set(0, 6.2, 10.4);
    camera.lookAt(0, 1.3, 0);
    camera.updateProjectionMatrix();

    this.createTerrain();
    this.createCenterPatch();
    this.createBarn();
    this.createPond();
    this.createFence();
    this.createTrees();
    this.createHayBales();
    this.createClouds();

    this.setupObstacles();
  }

  private createTerrain() {
    const terrainMesh = new PS1Terrain({
      size: 26,
      segments: 48,
      heightVariation: 0.35,
      colors: {
        base: 0x3c5a38,
        high: 0x5f8c49,
        low: 0x2b3f27,
      },
    }).getMesh();

    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = false;
    terrainMesh.position.y = -0.12;
    this.threeScene.addObject(terrainMesh);
  }

  private createCenterPatch() {
    const patchGroup = new THREE.Group();

    const center = new THREE.Mesh(
      new THREE.CircleGeometry(3.6, 32),
      new THREE.MeshLambertMaterial({ color: 0x5d8a52, emissive: 0x0c190d, emissiveIntensity: 0.2 }),
    );
    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.02;
    center.receiveShadow = true;
    patchGroup.add(center);

    const path = new THREE.Mesh(
      new THREE.RingGeometry(4.4, 5.6, 40),
      new THREE.MeshLambertMaterial({ color: 0xd5b48b, emissive: 0x2d1b0c, emissiveIntensity: 0.2 }),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.015;
    path.receiveShadow = true;
    patchGroup.add(path);

    const walkway = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 6, 1, 4),
      new THREE.MeshLambertMaterial({ color: 0xcda473 }),
    );
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.set(0, 0.02, -3.9);
    walkway.receiveShadow = true;
    patchGroup.add(walkway);

    this.threeScene.addObject(patchGroup);
  }

  private createBarn() {
    const barn = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.8, 3.2),
      new THREE.MeshLambertMaterial({ color: 0xa83232, emissive: 0x301010, emissiveIntensity: 0.25 }),
    );
    base.position.y = 1.4;
    base.castShadow = true;
    base.receiveShadow = true;
    barn.add(base);

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 3.4, 4, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x3d2a27 }),
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.6;
    roof.scale.y = 0.8;
    roof.castShadow = true;
    barn.add(roof);

    const roofCap = new THREE.Mesh(
      new THREE.BoxGeometry(3.9, 0.3, 3.4),
      new THREE.MeshLambertMaterial({ color: 0x261715 }),
    );
    roofCap.position.y = 3.1;
    roofCap.castShadow = true;
    barn.add(roofCap);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.6, 0.15),
      new THREE.MeshLambertMaterial({ color: 0xf2c27d }),
    );
    door.position.set(0, 0.8, 1.68);
    door.castShadow = true;
    barn.add(door);

    const trimMaterial = new THREE.MeshLambertMaterial({ color: 0xf2e8d0 });
    const window = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), trimMaterial);
    window.position.set(0, 1.9, -1.62);
    barn.add(window);

    barn.position.set(0, 0, -6.2);
    this.threeScene.addObject(barn);
  }

  private createPond() {
    const group = new THREE.Group();

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.9, 0.2, 24),
      new THREE.MeshLambertMaterial({ color: 0x6d5a4b }),
    );
    rim.position.y = 0.09;
    rim.castShadow = true;
    rim.receiveShadow = true;
    group.add(rim);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.1, 24),
      new THREE.MeshLambertMaterial({
        color: 0x4fb3ff,
        emissive: 0x0f2438,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
      }),
    );
    water.position.y = 0.04;
    group.add(water);

    group.position.set(2.2, 0, 2.6);
    this.threeScene.addObject(group);
  }

  private createFence() {
    const fenceGroup = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0xd9b38a });
    const postCount = 18;
    const radius = 7.6;

    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1, 0.18), material);
      post.position.set(x, 0.5, z);
      post.castShadow = true;
      fenceGroup.add(post);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 1.6), material);
      rail.position.set(x * 0.93, 0.75, z * 0.93);
      rail.rotation.y = angle;
      fenceGroup.add(rail);
    }

    this.threeScene.addObject(fenceGroup);
  }

  private createTrees() {
    const positions: Array<[number, number]> = [
      [-4.5, -2.8],
      [4.8, -1.6],
      [-3.2, 3.4],
    ];

    positions.forEach(([x, z]) => {
      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.36, 2.4, 6),
        new THREE.MeshLambertMaterial({ color: 0x6f4b2c }),
      );
      trunk.position.y = 1.2;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2f7a44 });
      for (let i = 0; i < 3; i++) {
        const size = 1.4 - i * 0.2;
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 10), foliageMaterial);
        sphere.position.y = 2.5 + i * 0.65;
        sphere.castShadow = true;
        tree.add(sphere);
      }

      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI;
      this.threeScene.addObject(tree);
    });
  }

  private createHayBales() {
    const bales = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0xe5ca74 });

    const bale1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12), material);
    bale1.rotation.z = Math.PI / 2;
    bale1.position.set(-2.4, 0.4, 1.6);
    bale1.castShadow = true;
    bale1.receiveShadow = true;
    bales.add(bale1);

    const bale2 = bale1.clone();
    bale2.position.set(-1.6, 0.4, 1.1);
    bale2.rotation.y = 0.4;
    bales.add(bale2);

    this.threeScene.addObject(bales);
  }

  private createClouds() {
    const clouds = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({
      color: 0xf3f6ff,
      transparent: true,
      opacity: 0.85,
    });

    const positions: Array<[number, number, number]> = [
      [-6, 6.4, -5.5],
      [6, 6.2, -5.2],
      [0, 7, -7],
    ];

    positions.forEach(([x, y, z]) => {
      const cluster = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.2, 8, 6), material);
        sphere.position.set((i - 1) * 0.6, Math.random() * 0.3, Math.random() * 0.2);
        sphere.scale.set(1.3, 0.7, 1.1);
        cluster.add(sphere);
      }
      cluster.position.set(x, y, z);
      clouds.add(cluster);
    });

    this.threeScene.addObject(clouds);
  }

  private setupObstacles() {
    this.obstacles = [
      { center: new THREE.Vector2(0, -6.2), radius: 2.4 }, // Barn
      { center: new THREE.Vector2(2.2, 2.6), radius: 1.6 }, // Pond
      { center: new THREE.Vector2(-2.2, 1.6), radius: 1.0 }, // Hay bales
      { center: new THREE.Vector2(4.6, -1.6), radius: 0.9 }, // Tree
      { center: new THREE.Vector2(-4.5, -2.8), radius: 0.9 }, // Tree
    ];
  }

  private isPositionValid(x: number, z: number, clearance: number = 0.6): boolean {
    const distance = Math.sqrt(x * x + z * z);
    if (distance > this.boundaryRadius) {
      return false;
    }

    const point = new THREE.Vector2(x, z);
    for (const obstacle of this.obstacles) {
      if (obstacle.center.distanceTo(point) < obstacle.radius + clearance) {
        return false;
      }
    }

    return true;
  }

  private chooseNextMovePoint(): THREE.Vector3 | null {
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 1.5 + Math.random() * 4;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      if (this.isPositionValid(x, z, 0.7)) {
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

  private getBounceDirection(currentX: number, currentZ: number): THREE.Vector3 {
    const current = new THREE.Vector2(currentX, currentZ);
    let closest: Obstacle | null = null;
    let min = Infinity;

    for (const obstacle of this.obstacles) {
      const dist = obstacle.center.distanceTo(current);
      if (dist < min) {
        min = dist;
        closest = obstacle;
      }
    }

    if (!closest) {
      return current.clone().negate().setLength(1).setY(0) as unknown as THREE.Vector3;
    }

    const away = current.clone().sub(closest.center).normalize();
    return new THREE.Vector3(away.x, 0, away.y);
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
      const bounce = this.getBounceDirection(currentPos.x, currentPos.z);
      const bounceTarget = currentPos.clone().addScaledVector(bounce, 2);
      if (this.isPositionValid(bounceTarget.x, bounceTarget.z, 0.6)) {
        this.currentTarget = new THREE.Vector3(bounceTarget.x, 0, bounceTarget.z);
      } else {
        this.isMoving = false;
        this.currentTarget = null;
        this.nextMoveTime = 1;
      }
      return;
    }

    currentPos.x = newX;
    currentPos.z = newZ;

    this.beastGroup.rotation.y = Math.atan2(direction.x, direction.z);
  }

  public setBeast(beastLine: string) {
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }

    this.beastModel = new BeastModel(beastLine);
    this.beastGroup = this.beastModel.getGroup();
    this.needsFit = true;
    this.baseYPosition = 0;
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
    this.idleAnimation = null;
    this.activeRigAnimation = null;

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


