import * as THREE from 'three';

export class WorldGenerator {
  constructor(scene) {
    this.scene = scene;
    this.scrap = 0;
    this.ground = null;
    this.resourceNodes = [];
  }

  generate(seed) {
    const size = 2000;
    const geometry = new THREE.PlaneGeometry(size, size, 50, 50);
    const material = new THREE.MeshLambertMaterial({
      color: 0x3a3228,
      flatShading: true
    });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    // Debris props
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

    // === VARIED RESOURCE NODES ===
    const nodeTypes = [
      { type: 'metal_pile', color: 0x666666, drop: 'scrap_metal', name: 'Rusted Metal Pile' },
      { type: 'chem_drum', color: 0x3a5f3a, drop: 'chem', name: 'Leaking Chem Drum' },
      { type: 'plastic_heap', color: 0x445566, drop: 'plastic', name: 'Plastic Debris Heap' },
      { type: 'wire_spool', color: 0x775533, drop: 'wire', name: 'Tangled Wire Spool' }
    ];

    for (let i = 0; i < 30; i++) {
      const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      
      let geometry;
      if (nodeType.type === 'metal_pile' || nodeType.type === 'plastic_heap') {
        geometry = new THREE.BoxGeometry(6 + Math.random()*4, 2 + Math.random()*3, 6 + Math.random()*4);
      } else {
        geometry = new THREE.CylinderGeometry(4, 5, 5, 8);
      }

      const material = new THREE.MeshLambertMaterial({ color: nodeType.color });
      const node = new THREE.Mesh(geometry, material);
      
      node.position.set(
        (Math.random() - 0.5) * (size * 0.85),
        3,
        (Math.random() - 0.5) * (size * 0.85)
      );
      
      node.userData = {
        type: 'resource_node',
        nodeType: nodeType.type,
        dropItem: nodeType.drop,
        name: nodeType.name,
        remaining: 3 + Math.floor(Math.random() * 4) // Can be scavenged a few times
      };
      
      this.scene.add(node);
      this.resourceNodes.push(node);
    }

    console.log(`%c[RUIN] Shard generated with ${this.resourceNodes.length} varied resource nodes`, 'color:#c9b896');
  }
}
