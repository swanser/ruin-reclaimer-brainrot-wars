import * as THREE from 'three';

export class WorldGenerator {
  constructor(scene) {
    this.scene = scene;
    this.scrap = 0;
    this.ground = null;
  }

  generate(seed) {
    // Simple procedural wasteland ground
    const size = 2000;
    const geometry = new THREE.PlaneGeometry(size, size, 50, 50);
    const material = new THREE.MeshLambertMaterial({
      color: 0x3a3228,
      flatShading: true
    });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    // Add some grit - scattered debris
    for (let i = 0; i < 80; i++) {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(4 + Math.random() * 8, 1, 4 + Math.random() * 8),
        new THREE.MeshLambertMaterial({ color: 0x4a4035 })
      );
      debris.position.set(
        (Math.random() - 0.5) * size,
        1,
        (Math.random() - 0.5) * size
      );
      debris.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(debris);
    }

    // Resource nodes (scavengeable)
    for (let i = 0; i < 25; i++) {
      const node = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 8, 3, 6),
        new THREE.MeshLambertMaterial({ color: 0x5a5248 })
      );
      node.position.set(
        (Math.random() - 0.5) * (size * 0.8),
        2,
        (Math.random() - 0.5) * (size * 0.8)
      );
      node.userData = { type: 'scrap', amount: 15 + Math.floor(Math.random() * 20) };
      this.scene.add(node);
    }

    console.log(`%c[RUIN] Shard generated with seed ${seed}`, 'color:#c9b896');
  }
}
