import * as THREE from 'three';

export class WorldGenerator {
  constructor(scene) {
    this.scene = scene;
    this.ground = null;
    this.resourceNodes = [];
  }

  generate(seed) {
    const size = 2000;
    const geometry = new THREE.PlaneGeometry(size, size, 50, 50);
    const material = new THREE.MeshLambertMaterial({ color: 0x3a3228, flatShading: true });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    // Scattered debris
    for (let i = 0; i < 90; i++) {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(3 + Math.random() * 7, 1, 3 + Math.random() * 7),
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

    // === EXPANDED RESOURCE NODES ===
    const nodeTypes = [
      { type: 'metal_pile', color: 0x666666, drop: 'scrap_metal', name: 'Rusted Metal Pile', size: 'medium' },
      { type: 'chem_drum', color: 0x3a5f3a, drop: 'chem', name: 'Leaking Chem Drum', size: 'small' },
      { type: 'plastic_heap', color: 0x445566, drop: 'plastic', name: 'Plastic Debris Heap', size: 'medium' },
      { type: 'wire_spool', color: 0x775533, drop: 'wire', name: 'Tangled Wire Spool', size: 'small' },
      { type: 'fuel_barrel', color: 0x553322, drop: 'fuel_canister', name: 'Rusted Fuel Barrel', size: 'small' },
      { type: 'military_crate', color: 0x334455, drop: 'scrap_metal', name: 'Military Supply Crate', size: 'medium' }
    ];

    for (let i = 0; i < 35; i++) {
      const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      
      let geo;
      if (nodeType.size === 'medium') {
        geo = new THREE.BoxGeometry(7 + Math.random()*5, 2.5 + Math.random()*2, 7 + Math.random()*5);
      } else {
        geo = new THREE.CylinderGeometry(3.5, 4.5, 5, 8);
      }

      const mat = new THREE.MeshLambertMaterial({ color: nodeType.color });
      const node = new THREE.Mesh(geo, mat);
      
      node.position.set(
        (Math.random() - 0.5) * (size * 0.88),
        nodeType.size === 'medium' ? 3.5 : 3,
        (Math.random() - 0.5) * (size * 0.88)
      );
      
      node.userData = {
        type: 'resource_node',
        nodeType: nodeType.type,
        dropItem: nodeType.drop,
        name: nodeType.name,
        remaining: 2 + Math.floor(Math.random() * 5)
      };
      
      this.scene.add(node);
      this.resourceNodes.push(node);
    }

    // === VEHICLE WRECKS (bigger, better loot) ===
    for (let i = 0; i < 8; i++) {
      const wreck = new THREE.Group();
      
      // Main body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(14, 4, 7),
        new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
      );
      body.position.y = 3;
      wreck.add(body);

      // Wheels
      for (let w = 0; w < 4; w++) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(2.2, 2.2, 1.5, 8),
          new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(
          (w < 2 ? -5 : 5),
          1.5,
          (w % 2 === 0 ? -3.5 : 3.5)
        );
        wreck.add(wheel);
      }

      wreck.position.set(
        (Math.random() - 0.5) * (size * 0.75),
        0,
        (Math.random() - 0.5) * (size * 0.75)
      );
      wreck.rotation.y = Math.random() * Math.PI * 2;

      wreck.userData = {
        type: 'vehicle_wreck',
        name: 'Burned-out Vehicle Wreck',
        remaining: 4 + Math.floor(Math.random() * 3)
      };

      this.scene.add(wreck);
      this.resourceNodes.push(wreck); // treat as interactable
    }

    console.log(`%c[RUIN] World expanded with varied nodes + vehicle wrecks`, 'color:#c9b896');
  }
}
