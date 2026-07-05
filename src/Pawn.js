import * as THREE from 'three';

// === SIMPLE PROCEDURAL GENERATORS ===
function generateName() {
  const first = ['Jax', 'Rook', 'Vesper', 'Kael', 'Soren', 'Lira', 'Drax', 'Nyx', 'Torin', 'Elara'];
  const last = ['Ashwalker', 'Scrapborn', 'Radveil', 'Ironvein', 'Dustborn', 'Voidtongue', 'Rustblood', 'Ashmarked'];
  return `${first[Math.floor(Math.random()*first.length)]} ${last[Math.floor(Math.random()*last.length)]}`;
}

function generateBackstory() {
  const origins = [
    'Survivor of the final broadcast collapse in the old city.',
    'Escaped a brainrot cult compound after the silos opened.',
    'Former corporate drone who watched their entire floor turn on each other.',
    'Wanderer who lived in the ruins of a pre-war highway megastructure.',
    'One of the last people to see the sky before the ash permanently fell.'
  ];
  const traumas = [
    'Still hears phantom notifications in quiet moments.',
    'Lost everyone they ever trusted to a single deepfake.',
    'Carries a cracked phone that sometimes plays the last video they saw.',
    'Was forced to make an impossible choice during the final hours.',
    'Watched their own reflection in a puddle and didn’t recognize it.'
  ];
  return `${origins[Math.floor(Math.random()*origins.length)]} ${traumas[Math.floor(Math.random()*traumas.length)]}`;
}

function generateTraits() {
  const possibleTraits = [
    { name: 'Iron Stomach', desc: 'Tolerates spoiled food better. Hunger decays slower.', effect: { hungerDecay: -0.3 } },
    { name: 'Paranoid', desc: 'Higher sanity loss in ash storms but better at spotting threats.', effect: { sanityStorm: +1.5, perception: +2 } },
    { name: 'Scavenger’s Eye', desc: 'Finds more resources when scavenging.', effect: { scavengingBonus: 1.5 } },
    { name: 'Steady Hands', desc: 'Better at crafting and vehicle repairs.', effect: { craftingSpeed: 1.3, repairBonus: 1.2 } },
    { name: 'Berserker', desc: 'Combat effectiveness increases when health is low.', effect: { lowHealthCombat: 1.5 } },
    { name: 'Ghost', desc: 'Harder to detect when moving alone. Good for stealth.', effect: { stealth: 2 } }
  ];
  // Start with 1-2 random traits for prototype
  const count = 1 + Math.floor(Math.random() * 2);
  const shuffled = [...possibleTraits].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export class Pawn {
  constructor(scene, position, isPlayer = false) {
    this.scene = scene;
    this.position = position.clone();
    this.target = null;
    this.speed = 1.8;
    this.isPlayer = isPlayer; // The lone survivor / player character

    // === RPG IDENTITY ===
    this.id = 'pawn_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    this.name = isPlayer ? 'You' : generateName(); // Player pawn is "You"
    this.backstory = isPlayer 
      ? 'The last one left who still remembers what the feeds used to feel like.' 
      : generateBackstory();
    this.traits = isPlayer ? [] : generateTraits(); // Player starts traitless for now

    // === SKILLS (RPG progression) ===
    this.skills = {
      scavenging: isPlayer ? 3 : 1 + Math.floor(Math.random() * 3),
      combat: isPlayer ? 2 : 1 + Math.floor(Math.random() * 3),
      mechanics: isPlayer ? 2 : 1 + Math.floor(Math.random() * 3),
      medicine: isPlayer ? 1 : 1 + Math.floor(Math.random() * 2),
      driving: isPlayer ? 2 : 1 + Math.floor(Math.random() * 3)
    };

    // === EQUIPMENT SLOTS ===
    this.equipment = {
      head: null,
      torso: null,
      hands: null,
      legs: null,
      weapon: null
    };

    // === EXPANDED NEEDS & SANITY ===
    this.needs = {
      health: 100,
      hunger: isPlayer ? 55 : 65 + Math.random() * 15,
      thirst: isPlayer ? 45 : 55 + Math.random() * 20,
      radiation: isPlayer ? 20 : 10 + Math.random() * 25,
      sanity: isPlayer ? 75 : 70 + Math.random() * 20,
      fatigue: isPlayer ? 25 : 30 + Math.random() * 20
    };

    // Personal inventory
    this.inventory = [];

    // Visual (placeholder - will improve)
    const geometry = new THREE.CylinderGeometry(4, 4, 12, 8);
    const material = new THREE.MeshLambertMaterial({ 
      color: isPlayer ? 0x6b8e23 : 0x8a6f4a 
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 8;
    this.scene.add(this.mesh);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshLambertMaterial({ color: isPlayer ? 0x4a5d2e : 0x5a4030 })
    );
    head.position.y = 10;
    this.mesh.add(head);

    if (isPlayer) {
      // Give player a starting weapon for lone survivor start
      this.equipment.weapon = { name: 'Rusted Pipe', type: 'melee', damage: 8 };
      this.inventory.push({ name: 'Canned Beans', type: 'food', nutrition: 25 });
    }
  }

  moveTo(targetPos) {
    this.target = targetPos.clone();
    this.target.y = 8;
  }

  update(delta = 1) {
    if (this.target) {
      const direction = this.target.clone().sub(this.mesh.position);
      const distance = direction.length();
      if (distance > 2) {
        direction.normalize();
        this.mesh.position.x += direction.x * this.speed * delta;
        this.mesh.position.z += direction.z * this.speed * delta;
      } else {
        this.target = null;
      }
    }

    // Stronger needs decay (prototype values)
    const decayRate = this.isPlayer ? 0.8 : 1.0; // Player slightly more resilient at start
    this.needs.hunger = Math.max(0, this.needs.hunger - 0.012 * decayRate);
    this.needs.thirst = Math.max(0, this.needs.thirst - 0.018 * decayRate);
    this.needs.fatigue = Math.min(100, this.needs.fatigue + 0.008);
    this.needs.sanity = Math.max(0, this.needs.sanity - 0.003);

    // Simple sanity effects
    if (this.needs.sanity < 30 && Math.random() < 0.01) {
      console.log(`%c[RUIN] ${this.name} is muttering to themselves...`, 'color:#aa6644');
    }
  }

  // === RPG METHODS ===
  equipItem(item, slot) {
    if (this.equipment[slot]) {
      this.inventory.push(this.equipment[slot]); // unequip old
    }
    this.equipment[slot] = item;
    console.log(`%c[RUIN] ${this.name} equipped ${item.name} in ${slot}`, 'color:#c9b896');
  }

  getStatus() {
    return {
      name: this.name,
      isPlayer: this.isPlayer,
      backstory: this.backstory,
      traits: this.traits,
      skills: this.skills,
      needs: this.needs,
      equipment: this.equipment
    };
    }
}
