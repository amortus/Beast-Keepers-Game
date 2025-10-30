/**
 * Ranch Critters - Eventos aleatórios de bichinhos
 * Mosquinhas, abelhas, pássaros, esquilos, formigas, etc.
 */

import * as THREE from 'three';

// Tipos de critters
type CritterType = 'fly' | 'bee' | 'bird' | 'squirrel' | 'ant';

interface Critter {
  mesh: THREE.Group;
  type: CritterType;
  velocity: THREE.Vector3;
  lifetime: number; // Tempo até desaparecer
  maxLifetime: number;
}

export class RanchCritters {
  private scene: THREE.Scene;
  private critters: Critter[] = [];
  private nextSpawnTime: number = 0;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nextSpawnTime = this.getRandomSpawnDelay();
  }
  
  /**
   * Tempo aleatório até próximo spawn (5-15 segundos)
   */
  private getRandomSpawnDelay(): number {
    return 5 + Math.random() * 10;
  }
  
  /**
   * Update - spawnar e atualizar critters
   */
  public update(delta: number) {
    // Countdown para próximo spawn
    this.nextSpawnTime -= delta;
    
    if (this.nextSpawnTime <= 0) {
      this.spawnRandomCritter();
      this.nextSpawnTime = this.getRandomSpawnDelay();
    }
    
    // Atualizar todos os critters ativos
    for (let i = this.critters.length - 1; i >= 0; i--) {
      const critter = this.critters[i];
      
      // Atualizar lifetime
      critter.lifetime -= delta;
      
      // Remover se tempo acabou
      if (critter.lifetime <= 0) {
        this.scene.remove(critter.mesh);
        this.critters.splice(i, 1);
        continue;
      }
      
      // Atualizar movimento
      this.updateCritterMovement(critter, delta);
    }
  }
  
  /**
   * Spawnar critter aleatório
   */
  private spawnRandomCritter() {
    const types: CritterType[] = ['fly', 'bee', 'bird', 'squirrel', 'ant'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch (type) {
      case 'fly':
        this.spawnFly();
        break;
      case 'bee':
        this.spawnBee();
        break;
      case 'bird':
        this.spawnBird();
        break;
      case 'squirrel':
        this.spawnSquirrel();
        break;
      case 'ant':
        this.spawnAnt();
        break;
    }
  }
  
  /**
   * Mosquinha - voa erraticamente
   */
  private spawnFly() {
    const flyGroup = new THREE.Group();
    
    // Corpo minúsculo (esfera preta)
    const bodyGeometry = new THREE.SphereGeometry(0.04, 4, 4);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    flyGroup.add(body);
    
    // 2 asas (planos transparentes)
    const wingGeometry = new THREE.PlaneGeometry(0.06, 0.03);
    const wingMaterial = new THREE.MeshToonMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.5
    });
    
    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.position.set(-0.03, 0, 0);
    flyGroup.add(wing1);
    
    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing2.position.set(0.03, 0, 0);
    flyGroup.add(wing2);
    
    // Posição inicial aleatória na borda
    const side = Math.floor(Math.random() * 4);
    let x, z;
    
    if (side === 0) { x = -7; z = (Math.random() - 0.5) * 10; } // Esquerda
    else if (side === 1) { x = 7; z = (Math.random() - 0.5) * 10; } // Direita
    else if (side === 2) { x = (Math.random() - 0.5) * 10; z = -7; } // Trás
    else { x = (Math.random() - 0.5) * 10; z = 7; } // Frente
    
    flyGroup.position.set(x, 0.5 + Math.random() * 1.5, z);
    this.scene.add(flyGroup);
    
    // Velocidade errática
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 2
    );
    
    this.critters.push({
      mesh: flyGroup,
      type: 'fly',
      velocity,
      lifetime: 8 + Math.random() * 4, // 8-12 segundos
      maxLifetime: 12
    });
  }
  
  /**
   * Abelha - voa em linha reta com zigue-zague
   */
  private spawnBee() {
    const beeGroup = new THREE.Group();
    
    // Corpo (amarelo e preto)
    const bodyGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    bodyGeometry.scale(1, 1.2, 1); // Alongar
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0xffd700 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    beeGroup.add(body);
    
    // Listras pretas
    const stripeGeometry = new THREE.BoxGeometry(0.16, 0.03, 0.16);
    const stripeMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    
    const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe1.position.y = 0.03;
    beeGroup.add(stripe1);
    
    const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe2.position.y = -0.03;
    beeGroup.add(stripe2);
    
    // Asas
    const wingGeometry = new THREE.PlaneGeometry(0.12, 0.08);
    const wingMaterial = new THREE.MeshToonMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.4
    });
    
    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.position.set(-0.08, 0, 0);
    wing1.rotation.y = Math.PI / 6;
    beeGroup.add(wing1);
    
    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing2.position.set(0.08, 0, 0);
    wing2.rotation.y = -Math.PI / 6;
    beeGroup.add(wing2);
    
    // Posição e direção
    const startX = Math.random() < 0.5 ? -7 : 7;
    const z = (Math.random() - 0.5) * 8;
    
    beeGroup.position.set(startX, 1 + Math.random() * 0.5, z);
    this.scene.add(beeGroup);
    
    const velocity = new THREE.Vector3(
      startX < 0 ? 1.5 : -1.5, // Atravessa de um lado pro outro
      Math.sin(Math.random() * Math.PI) * 0.2,
      (Math.random() - 0.5) * 0.5
    );
    
    this.critters.push({
      mesh: beeGroup,
      type: 'bee',
      velocity,
      lifetime: 10,
      maxLifetime: 10
    });
  }
  
  /**
   * Pássaro - voa alto atravessando
   */
  private spawnBird() {
    const birdGroup = new THREE.Group();
    
    // Corpo (marrom)
    const bodyGeometry = new THREE.SphereGeometry(0.12, 6, 6);
    bodyGeometry.scale(1, 1, 1.5); // Alongar
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x8b6f47 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    birdGroup.add(body);
    
    // Asas (triângulos)
    const wingGeometry = new THREE.ConeGeometry(0.15, 0.3, 3);
    const wingMaterial = new THREE.MeshToonMaterial({ color: 0x5a4332 });
    
    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.rotation.z = Math.PI / 2;
    wing1.position.set(-0.12, 0, 0);
    birdGroup.add(wing1);
    
    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing2.rotation.z = -Math.PI / 2;
    wing2.position.set(0.12, 0, 0);
    birdGroup.add(wing2);
    
    // Posição alta
    const startX = Math.random() < 0.5 ? -8 : 8;
    const z = (Math.random() - 0.5) * 10;
    
    birdGroup.position.set(startX, 4 + Math.random() * 2, z);
    this.scene.add(birdGroup);
    
    const velocity = new THREE.Vector3(
      startX < 0 ? 3 : -3, // Rápido
      Math.sin(Math.random() * Math.PI) * 0.3,
      (Math.random() - 0.5) * 0.8
    );
    
    this.critters.push({
      mesh: birdGroup,
      type: 'bird',
      velocity,
      lifetime: 8,
      maxLifetime: 8
    });
  }
  
  /**
   * Esquilo - corre no chão
   */
  private spawnSquirrel() {
    const squirrelGroup = new THREE.Group();
    
    // Corpo (marrom claro)
    const bodyGeometry = new THREE.SphereGeometry(0.15, 6, 6);
    bodyGeometry.scale(1, 0.8, 1.2);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0xc4a574 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.1;
    squirrelGroup.add(body);
    
    // Cabeça
    const headGeometry = new THREE.SphereGeometry(0.1, 6, 6);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.12, 0.15);
    squirrelGroup.add(head);
    
    // Cauda fofa (cone)
    const tailGeometry = new THREE.ConeGeometry(0.12, 0.3, 6);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.2, -0.2);
    tail.rotation.x = Math.PI / 3;
    squirrelGroup.add(tail);
    
    // Posição na borda
    const startX = Math.random() < 0.5 ? -6 : 6;
    const z = (Math.random() - 0.5) * 8;
    
    squirrelGroup.position.set(startX, 0, z);
    this.scene.add(squirrelGroup);
    
    const velocity = new THREE.Vector3(
      startX < 0 ? 2 : -2, // Corre rápido
      0,
      (Math.random() - 0.5) * 0.3
    );
    
    this.critters.push({
      mesh: squirrelGroup,
      type: 'squirrel',
      velocity,
      lifetime: 6,
      maxLifetime: 6
    });
  }
  
  /**
   * Formiga - anda devagar no chão
   */
  private spawnAnt() {
    const antGroup = new THREE.Group();
    
    // Corpo minúsculo (preto)
    const bodyGeometry = new THREE.SphereGeometry(0.03, 4, 4);
    bodyGeometry.scale(1, 0.8, 1.5);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.02;
    antGroup.add(body);
    
    // Cabeça
    const headGeometry = new THREE.SphereGeometry(0.02, 4, 4);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.02, 0.04);
    antGroup.add(head);
    
    // Posição aleatória no rancho
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    
    antGroup.position.set(x, 0, z);
    this.scene.add(antGroup);
    
    // Movimento lento e aleatório
    const angle = Math.random() * Math.PI * 2;
    const velocity = new THREE.Vector3(
      Math.cos(angle) * 0.3,
      0,
      Math.sin(angle) * 0.3
    );
    
    this.critters.push({
      mesh: antGroup,
      type: 'ant',
      velocity,
      lifetime: 5 + Math.random() * 3, // Some depois de 5-8 segundos
      maxLifetime: 8
    });
  }
  
  /**
   * Atualizar movimento de um critter
   */
  private updateCritterMovement(critter: Critter, delta: number) {
    const pos = critter.mesh.position;
    
    // Movimento específico por tipo
    switch (critter.type) {
      case 'fly':
        // Movimento errático (muda direção)
        if (Math.random() < delta * 2) { // Chance de mudar direção
          critter.velocity.x += (Math.random() - 0.5) * 0.5;
          critter.velocity.y += (Math.random() - 0.5) * 0.3;
          critter.velocity.z += (Math.random() - 0.5) * 0.5;
          
          // Limitar velocidade
          const speed = critter.velocity.length();
          if (speed > 2) {
            critter.velocity.normalize().multiplyScalar(2);
          }
        }
        break;
        
      case 'bee':
        // Zigue-zague sutil
        critter.velocity.y = Math.sin(critter.lifetime * 3) * 0.2;
        break;
        
      case 'bird':
        // Leve ondulação (batida de asas)
        critter.velocity.y = Math.sin(critter.lifetime * 4) * 0.3;
        
        // Animar asas (batendo)
        if (critter.mesh.children.length > 2) {
          const wing1 = critter.mesh.children[1];
          const wing2 = critter.mesh.children[2];
          const flapAngle = Math.sin(critter.lifetime * 10) * 0.3;
          wing1.rotation.z = Math.PI / 2 + flapAngle;
          wing2.rotation.z = -Math.PI / 2 - flapAngle;
        }
        break;
        
      case 'squirrel':
        // Leve pulo (hop)
        if (Math.random() < delta * 3) {
          critter.velocity.y = 0.5; // Pula
        } else {
          critter.velocity.y -= 2 * delta; // Gravidade
          critter.velocity.y = Math.max(critter.velocity.y, 0);
        }
        
        // Balançar cauda
        if (critter.mesh.children.length > 2) {
          const tail = critter.mesh.children[2];
          tail.rotation.x = Math.PI / 3 + Math.sin(critter.lifetime * 5) * 0.2;
        }
        break;
        
      case 'ant':
        // Movimento retilíneo devagar
        // Fade out nos últimos 2 segundos
        if (critter.lifetime < 2) {
          critter.mesh.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
              (child.material as THREE.MeshToonMaterial).opacity = critter.lifetime / 2;
              (child.material as THREE.MeshToonMaterial).transparent = true;
            }
          });
        }
        break;
    }
    
    // Aplicar velocidade
    pos.x += critter.velocity.x * delta;
    pos.y += critter.velocity.y * delta;
    pos.z += critter.velocity.z * delta;
    
    // Manter altura mínima (chão)
    if (critter.type === 'squirrel' || critter.type === 'ant') {
      pos.y = Math.max(pos.y, 0);
    }
    
    // Remover se saiu muito longe
    const distFromCenter = Math.sqrt(pos.x ** 2 + pos.z ** 2);
    if (distFromCenter > 12) {
      critter.lifetime = 0; // Forçar remoção
    }
  }
  
  /**
   * Limpar todos os critters
   */
  public dispose() {
    this.critters.forEach(critter => {
      this.scene.remove(critter.mesh);
    });
    this.critters = [];
  }
}

