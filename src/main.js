import * as THREE from 'three';
import { WorldGenerator } from './WorldGenerator.js';
import { Pawn } from './Pawn.js';
import { createItem, Recipes, canCraft, craftItem } from './Item.js';

// === CORE SETUP ===
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2, window.innerWidth / 2,
  window.innerHeight / 2, window.innerHeight / -2,
  0.1, 2000
);
camera.position.set(0, 450, 0);
camera.lookAt(0, 0, 0);

let zoom = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting & Atmosphere
const ambient = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffeecc, 0.8);
dirLight.position.set(100, 200, 50);
scene.add(dirLight);

const fogColor = new THREE.Color(0x2a2520);
scene.fog = new THREE.Fog(fogColor, 300, 1200);

let selectedPawns = [];
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// World
const world = new WorldGenerator(scene);
world.generate(12345);

// === LONE SURVIVOR START ===
const playerPawn = new Pawn(scene, new THREE.Vector3(0, 0, 0), true);
const pawns = [playerPawn];

// Workbench
const workbench = new THREE.Mesh(
  new THREE.BoxGeometry(8, 3, 8),
  new THREE.MeshLambertMaterial({ color: 0x555555 })
);
workbench.position.set(40, 2, 30);
scene.add(workbench);
workbench.userData = { type: 'workbench' };

// Loose items
function spawnLooseItem(key, x, z) {
  const itemData = createItem(key);
  if (!itemData) return;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 2),
    new THREE.MeshLambertMaterial({ color: 0x996633 })
  );
  mesh.position.set(x, 1.5, z);
  mesh.userData = { type: 'loose_item', itemData: itemData };
  scene.add(mesh);
}

spawnLooseItem('duct_tape', 15, 10);
spawnLooseItem('cloth', -20, 25);
spawnLooseItem('scrap_metal', 35, -15);

// === CHARACTER SHEET FUNCTIONS ===
window.showCharacterSheet = function(pawn) {
  const sheet = document.getElementById('character-sheet');
  if (!sheet || !pawn) return;

  document.getElementById('sheet-name').textContent = pawn.name;
  document.getElementById('sheet-backstory').textContent = pawn.backstory || 'No memories remain.';

  // Traits
  const traitsDiv = document.getElementById('sheet-traits');
  traitsDiv.innerHTML = '';
  if (pawn.traits && pawn.traits.length > 0) {
    pawn.traits.forEach(trait => {
      const div = document.createElement('div');
      div.className = 'trait';
      div.innerHTML = `<strong>${trait.name}</strong><br><small>${trait.desc}</small>`;
      traitsDiv.appendChild(div);
    });
  } else {
    traitsDiv.innerHTML = '<div style="color:#665533">No notable traits yet.</div>';
  }

  // Skills
  const skillsDiv = document.getElementById('sheet-skills');
  skillsDiv.innerHTML = '';
  if (pawn.skills) {
    Object.entries(pawn.skills).forEach(([skill, level]) => {
      const div = document.createElement('div');
      div.className = 'skill';
      div.innerHTML = `${skill.charAt(0).toUpperCase() + skill.slice(1)} <span style="color:#aa8866">${level}</span>`;
      skillsDiv.appendChild(div);
    });
  }

  // Equipment
  const equipDiv = document.getElementById('sheet-equipment');
  equipDiv.innerHTML = '';
  if (pawn.equipment) {
    Object.entries(pawn.equipment).forEach(([slot, item]) => {
      const div = document.createElement('div');
      div.className = 'equipment-slot';
      const itemName = item ? item.name : '— Empty —';
      div.innerHTML = `${slot.toUpperCase()}: <span style="color:#aa8866">${itemName}</span>`;
      equipDiv.appendChild(div);
    });
  }

  // Inventory
  const invDiv = document.getElementById('sheet-inventory');
  invDiv.innerHTML = '';
  if (pawn.inventory && pawn.inventory.length > 0) {
    pawn.inventory.forEach(item => {
      const div = document.createElement('div');
      div.className = 'inventory-item';
      div.textContent = item.name;
      invDiv.appendChild(div);
    });
  } else {
    invDiv.innerHTML = '<div style="color:#665533">Inventory is empty.</div>';
  }

  sheet.style.display = 'block';
};

window.hideCharacterSheet = function() {
  const sheet = document.getElementById('character-sheet');
  if (sheet) sheet.style.display = 'none';
};

// === INTERACTION ===
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (event.button === 0) {
    const allIntersects = raycaster.intersectObjects(scene.children, true);

    // Pawn selection
    const pawnIntersects = allIntersects.filter(i => pawns.some(p => p.mesh === i.object));
    if (pawnIntersects.length > 0) {
      const clickedPawn = pawns.find(p => p.mesh === pawnIntersects[0].object);
      if (clickedPawn) {
        selectedPawns = [clickedPawn];
        console.log(`%c[RUIN] Selected: ${clickedPawn.name}`, 'color:#c9b896');
        
        // Auto-open character sheet for player pawn
        if (clickedPawn.isPlayer) {
          setTimeout(() => {
            window.showCharacterSheet(clickedPawn);
          }, 120);
        }
        return;
      }
    }

    // Resource nodes, loose items, workbench (same logic as before)
    const nodeHit = allIntersects.find(i => i.object.userData?.type === 'resource_node');
    if (nodeHit && selectedPawns.length > 0) {
      const node = nodeHit.object;
      const pawn = selectedPawns[0];
      if (node.userData.remaining > 0) {
        const item = createItem(node.userData.dropItem);
        if (item) {
          pawn.addItem(item);
          node.userData.remaining--;
          console.log(`%c[RUIN] Scavenged ${node.userData.name} → ${item.name}`, 'color:#aadd88');
          if (node.userData.remaining <= 0) node.material.color.setHex(0x222222);
        }
      }
      return;
    }

    const looseHit = allIntersects.find(i => i.object.userData?.type === 'loose_item');
    if (looseHit && selectedPawns.length > 0) {
      const itemMesh = looseHit.object;
      const itemData = itemMesh.userData.itemData;
      selectedPawns[0].addItem(itemData);
      scene.remove(itemMesh);
      const idx = looseItems.indexOf(itemMesh);
      if (idx !== -1) looseItems.splice(idx, 1);
      console.log(`%c[RUIN] Picked up ${itemData.name}`, 'color:#aadd88');
      return;
    }

    const workbenchHit = allIntersects.find(i => i.object.userData?.type === 'workbench');
    if (workbenchHit && selectedPawns.length > 0) {
      const pawn = selectedPawns[0];
      console.log('%c[RUIN] === WORKBENCH ===', 'color:#c9b896');
      Object.keys(Recipes).forEach(key => {
        const recipe = Recipes[key];
        const possible = canCraft(pawn, key);
        console.log(`  ${recipe.name} ${possible ? '✓' : '✗'}`);
      });
      console.log('%cPress C to quick-craft bandage, or use console: craft("recipe_key")', 'color:#888');
      return;
    }

    selectedPawns = [];
  }

  if (event.button === 2 && selectedPawns.length > 0) {
    const groundIntersects = raycaster.intersectObject(world.ground);
    if (groundIntersects.length > 0) {
      selectedPawns.forEach(p => p.moveTo(groundIntersects[0].point));
    }
  }

  if (event.button === 0) {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function onMouseUp() { isDragging = false; }

function onMouseMove(event) {
  if (isDragging) {
    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;
    camera.position.x -= deltaX * 0.8 / zoom;
    camera.position.z -= deltaY * 0.8 / zoom;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function onWheel(event) {
  zoom += event.deltaY * -0.001;
  zoom = Math.max(0.3, Math.min(zoom, 4));
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = 450 / zoom;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

// Keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (playerPawn) {
      const sheet = document.getElementById('character-sheet');
      if (sheet.style.display === 'block') {
        window.hideCharacterSheet();
      } else {
        window.showCharacterSheet(playerPawn);
      }
    }
  }

  if (!selectedPawns.length) return;
  const pawn = selectedPawns[0];

  if (e.key.toLowerCase() === 'i') pawn.listInventory();
  if (e.key.toLowerCase() === 'c') craftItem(pawn, 'bandage');
  if (e.key.toLowerCase() === 's') {
    const scrap = createItem('scrap_metal');
    if (scrap) pawn.addItem(scrap);
  }
});

window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('contextmenu', e => e.preventDefault());

function onResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = 450 / zoom;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  pawns.forEach(p => p.update());

  const statusEl = document.getElementById('status');
  if (statusEl && pawns.length > 0) {
    const p = pawns[0];
    statusEl.innerHTML = `
      ${p.isPlayer ? 'YOU' : p.name} | 
      H:${Math.floor(p.needs.health)} Hu:${Math.floor(p.needs.hunger)} 
      Th:${Math.floor(p.needs.thirst)} San:${Math.floor(p.needs.sanity)} | Inv:${p.inventory.length}
    `;
  }

  renderer.render(scene, camera);
}

animate();

console.log('%c[RUIN RECLAIMER] Character Sheet UI active.', 'color:#c9b896');
console.log('%cLeft-click yourself or press TAB to open Character Sheet. Gritty terminal style.', 'color:#888');
