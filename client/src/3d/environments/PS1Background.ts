/**
 * PS1-Style Background Environment
 * Skybox and distant mountains for Monster Rancher aesthetic
 */

import * as THREE from 'three';

/**
 * Create PS1-style skybox with gradient
 */
export function createPS1Skybox(scene: THREE.Scene): THREE.Mesh {
  // Gradient sky shader
  const vertexShader = `
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition).y;
      
      // Sky colors (PS1 style - saturated)
      vec3 skyTop = vec3(0.4, 0.6, 1.0);       // Light blue
      vec3 skyHorizon = vec3(0.7, 0.5, 0.9);   // Purple-pink
      vec3 skyBottom = vec3(0.5, 0.3, 0.7);    // Dark purple
      
      // Blend based on height
      vec3 color;
      if (h > 0.0) {
        color = mix(skyHorizon, skyTop, h);
      } else {
        color = mix(skyBottom, skyHorizon, h + 1.0);
      }
      
      // Reduce precision for PS1 look
      color = floor(color * 32.0) / 32.0;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  
  // Large sphere for skybox (low poly for PS1)
  const skyGeo = new THREE.SphereGeometry(100, 8, 6);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  });
  
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -1; // Render first
  scene.add(sky);
  
  return sky;
}

/**
 * Create distant low-poly mountains
 */
export function createDistantMountains(scene: THREE.Scene): THREE.Group {
  const mountainGroup = new THREE.Group();
  
  // Mountain colors (greenish-brown)
  const mountainColors = [
    0x4a7c59, // Dark green
    0x5a8c69, // Medium green
    0x3a6c49, // Forest green
    0x6a9c79, // Light green
  ];
  
  // Create ring of mountains
  const mountainCount = 8;
  for (let i = 0; i < mountainCount; i++) {
    const angle = (i / mountainCount) * Math.PI * 2;
    
    // Random height and width
    const height = 4 + Math.random() * 3;
    const width = 2.5 + Math.random() * 1.5;
    
    // Low-poly cone (4-sided pyramid)
    const geometry = new THREE.ConeGeometry(width, height, 4);
    const material = new THREE.MeshLambertMaterial({ 
      color: mountainColors[i % mountainColors.length],
      flatShading: true,
    });
    
    const mountain = new THREE.Mesh(geometry, material);
    
    // Position in circle far from center
    const distance = 25 + Math.random() * 5;
    mountain.position.set(
      Math.cos(angle) * distance,
      height / 2 - 0.5, // Slightly below ground level
      Math.sin(angle) * distance
    );
    
    // Random rotation for variety
    mountain.rotation.y = Math.random() * Math.PI * 2;
    
    mountainGroup.add(mountain);
  }
  
  scene.add(mountainGroup);
  return mountainGroup;
}

/**
 * Create simple clouds (optional)
 */
export function createPS1Clouds(scene: THREE.Scene, count: number = 5): THREE.Group {
  const cloudGroup = new THREE.Group();
  
  for (let i = 0; i < count; i++) {
    // Simple sphere cluster for clouds
    const cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      flatShading: true,
      transparent: true,
      opacity: 0.8,
    });
    
    // Main cloud body (stretched sphere)
    const cloudGeometry = new THREE.SphereGeometry(1, 6, 4);
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.scale.set(1.5, 0.6, 1);
    
    // Position high and far
    const angle = (i / count) * Math.PI * 2;
    const distance = 15 + Math.random() * 10;
    cloud.position.set(
      Math.cos(angle) * distance,
      8 + Math.random() * 4,
      Math.sin(angle) * distance
    );
    
    cloudGroup.add(cloud);
  }
  
  scene.add(cloudGroup);
  return cloudGroup;
}

/**
 * Setup fog for depth (PS1 aesthetic)
 */
export function setupPS1Fog(scene: THREE.Scene, color: number = 0x5a4a7a, near: number = 15, far: number = 35) {
  scene.fog = new THREE.Fog(color, near, far);
}

