import * as THREE from 'three';

export class Pawn {
  constructor(scene, position) {
    this.scene = scene;
    this.position = position.clone();
    this.target = null;
    this.speed = 1.8;

    // Simple pawn representation (will be replaced with better sprites/models later)
    const geometry = new THREE.CylinderGeometry(4, 4, 12, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x8a6f4a });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 8;
    this.scene.add(this.mesh);

    // Simple "head" marker
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x5a4030 })
    );
    head.position.y = 10;
    this.mesh.add(head);

    this.needs = {
      health: 100,
      hunger: 60,
      thirst: 50,
      radiation: 10,
      sanity: 85
    };
  }

  moveTo(targetPos) {
    this.target = targetPos.clone();
    this.target.y = 8; // Keep on ground level
  }

  update() {
    if (this.target) {
      const direction = this.target.clone().sub(this.mesh.position);
      const distance = direction.length();

      if (distance > 2) {
        direction.normalize();
        this.mesh.position.x += direction.x * this.speed;
        this.mesh.position.z += direction.z * this.speed;
      } else {
        this.target = null;
      }
    }

    // Simple need decay (prototype)
    this.needs.hunger = Math.max(0, this.needs.hunger - 0.01);
    this.needs.thirst = Math.max(0, this.needs.thirst - 0.015);
  }
}
