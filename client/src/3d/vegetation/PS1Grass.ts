/**
 * PS1-Style Grass
 * Instanced grass blades inspired by advanced grass shaders but simplified for PS1
 */

import * as THREE from 'three';

export interface PS1GrassOptions {
  count?: number;
  area?: number;
  color?: number;
  height?: number;
  windSpeed?: number;
  windStrength?: number;
}

export class PS1Grass {
  private instancedMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D;
  private time: number = 0;
  private windSpeed: number;
  private windStrength: number;
  private positions: Float32Array;
  
  constructor(options: PS1GrassOptions = {}) {
    const {
      count = 200,
      area = 10,
      color = 0x228b22,
      height = 0.3,
      windSpeed = 0.5,
      windStrength = 0.02,
    } = options;
    
    this.windSpeed = windSpeed;
    this.windStrength = windStrength;
    this.dummy = new THREE.Object3D();
    
    // Simple grass blade geometry (flat triangle)
    const geometry = new THREE.PlaneGeometry(0.08, height, 1, 2);
    geometry.translate(0, height / 2, 0); // Pivot at base
    
    // PS1-style material
    const material = new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    
    // Create instanced mesh for performance
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    
    // Store positions for wind animation
    this.positions = new Float32Array(count * 3);
    
    // Distribute grass randomly
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * area;
      const z = (Math.random() - 0.5) * area;
      
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = 0;
      this.positions[i * 3 + 2] = z;
      
      this.dummy.position.set(x, 0, z);
      this.dummy.rotation.y = Math.random() * Math.PI * 2;
      this.dummy.scale.setScalar(0.7 + Math.random() * 0.6);
      
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.castShadow = false;
    this.instancedMesh.receiveShadow = false;
  }
  
  /**
   * Update grass animation (wind effect)
   */
  public update(delta: number) {
    this.time += delta * this.windSpeed;
    
    // Simple wind animation (sway grass blades)
    const count = this.instancedMesh.count;
    
    for (let i = 0; i < count; i++) {
      const x = this.positions[i * 3];
      const z = this.positions[i * 3 + 2];
      
      // Calculate wind offset
      const windX = Math.sin(this.time + x * 0.5) * this.windStrength;
      const windZ = Math.cos(this.time + z * 0.5) * this.windStrength;
      
      // Get original matrix
      this.instancedMesh.getMatrixAt(i, this.dummy.matrix);
      this.dummy.matrix.decompose(this.dummy.position, this.dummy.quaternion, this.dummy.scale);
      
      // Apply wind rotation (subtle sway)
      this.dummy.rotation.z = windX * 0.3;
      this.dummy.rotation.x = windZ * 0.3;
      
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
  
  /**
   * Get the instanced mesh
   */
  public getMesh(): THREE.InstancedMesh {
    return this.instancedMesh;
  }
  
  /**
   * Dispose geometry and material
   */
  public dispose() {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
  }
}

