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

// === LONE SURVIVOR ===
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
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), new THREE.MeshLambertMaterial({ color: 0x996633 }));
  mesh.position.set(x, 1.5, z);
  mesh.userData = { type: 'loose_item', itemData };
  scene.add(mesh);
}

spawnLooseItem('duct_tape', 15, 10);
spawnLooseItem('cloth', -20, 25);
spawnLooseItem('scrap_metal', 35, -15);

// === EXPANDED BUILDING SYSTEM (Lone Survivor) ===
let placedStructures = [];

function placeStructure(type, pawn) {
  if (!pawn) return;

  const structure = new THREE.Group();
  let label = '';

  if (type === 'shelter') {
    // Basic lean-to shelter
    const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 1.5), new THREE.MeshLambertMaterial({ color: 0x554433 }));
    wall.position.set(0, 3, 0);
    structure.add(wall);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(11, 1, 6), new THREE.MeshLambertMaterial({ color: 0x443322 }));
    roof.position.set(0, 6, 2);
    roof.rotation.x = -0.3;
    structure.add(roof);
    label = 'Makeshift Shelter';

  } else if (type === 'stockpile') {
    // Simple stockpile marker
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 8), new THREE.MeshLambertMaterial({ color: 0x3a3228 }));
    structure.add(base);

    const marker = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 6), new THREE.MeshLambertMaterial({ color: 0x665533 }));
    marker.position.y = 3;
    structure.add(marker);
    label = 'Stockpile Zone';

  } else if (type === 'wall') {
    // Basic defensive wall segment
    const wall = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 2), new THREE.MeshLambertMaterial({ color: 0x444444 }));
    wall.position.set(0, 4, 0);
    structure.add(wall);

    // Spikes on top
    for (let i = -4; i <= 4; i += 2) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 4), new THREE.MeshLambertMaterial({ color: 0x555555 }));
      spike.position.set(i, 7.5, 0);
      structure.add(spike);
    }
    label = 'Spike Wall Segment';

  } else if (type === 'barricade') {
    // Simple spike barricade
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 3), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
    structure.add(base);

    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4, 4), new THREE.MeshLambertMaterial({ color: 0x554433 }));
      spike.position.set(-3 + i * 1.5, 4, 0);
      structure.add(spike);
    }
    label = 'Spike Barricade';
  }

  structure.position.copy(pawn.mesh.position);
  structure.position.y = 0;
  structure.position.x += 14;
  structure.userData = { type: 'player_structure', name: label };

  scene.add(structure);
  placedStructures.push(structure);

  console.log(`%c[RUIN] Placed: ${label}`, 'color:#aadd88');
}

// === INTERACTION ===
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (event.button === 0) {
    const allIntersects = raycaster.intersectObjects(scene.children, true);

    const pawnIntersects = allIntersects.filter(i => pawns.some(p => p.mesh === i.object));
    if (pawnIntersects.length > 0) {
      const clicked = pawns.find(p => p.mesh === pawnIntersects[0].object);
      if (clicked) {
        selectedPawns = [clicked];
        if (clicked.isPlayer) setTimeout(() => window.showCharacterSheet(clicked), 100);
        return;
      }
    }

    // Resource nodes
    const nodeHit = allIntersects.find(i => i.object.userData?.type === 'resource_node');
    if (nodeHit && selectedPawns.length > 0) {
      const node = nodeHit.object;
      const pawn = selectedPawns[0];
      if (node.userData.remaining > 0) {
        const item = createItem(node.userData.dropItem || 'scrap_metal');
        if (item) {
          pawn.addItem(item);
          node.userData.remaining--;
          console.log(`%c[RUIN] Scavenged ${node.userData.name}`, 'color:#aadd88');
          if (node.userData.remaining <= 0) node.material.color.setHex(0x222222);
        }
      }
      return;
    }

    // Vehicle wrecks
    const wreckHit = allIntersects.find(i => i.object.userData?.type === 'vehicle_wreck' || i.object.parent?.userData?.type === 'vehicle_wreck');
    if (wreckHit && selectedPawns.length > 0) {
      const wreck = wreckHit.object.parent || wreckHit.object;
      const pawn = selectedPawns[0];
      if (wreck.userData.remaining > 0) {
        const drops = ['scrap_metal', 'wire', 'duct_tape', 'fuel_canister'];
        const item = createItem(drops[Math.floor(Math.random() * drops.length)]);
        if (item) pawn.addItem(item);
        if (Math.random() > 0.55) {
          const extra = createItem(drops[Math.floor(Math.random() * drops.length)]);
          if (extra) pawn.addItem(extra);
        }
        wreck.userData.remaining--;
        console.log(`%c[RUIN] Stripped ${wreck.userData.name}`, 'color:#aadd88');
      }
      return;
    }

    // Loose items & workbench (unchanged logic)
    const looseHit = allIntersects.find(i => i.object.userData?.type === 'loose_item');
    if (looseHit && selectedPawns.length > 0) {
      selectedPawns[0].addItem(looseHit.object.userData.itemData);
      scene.remove(looseHit.object);
      return;
    }

    const benchHit = allIntersects.find(i => i.object.userData?.type === 'workbench');
    if (benchHit && selectedPawns.length > 0) {
      console.log('%c[RUIN] WORKBENCH - Press C to craft, or use console', 'color:#c9b896');
      return;
    }

    selectedPawns = [];
  }

  if (event.button === 2 && selectedPawns.length > 0) {
    const ground = raycaster.intersectObject(world.ground);
    if (ground.length > 0) selectedPawns.forEach(p => p.moveTo(ground[0].point));
  }

  if (event.button === 0) { isDragging = true; lastMouseX = event.clientX; lastMouseY = event.clientY; }
}

function onMouseUp() { isDragging = false; }

function onMouseMove(event) {
  if (isDragging) {
    camera.position.x -= (event.clientX - lastMouseX) * 0.8 / zoom;
    camera.position.z -= (event.clientY - lastMouseY) * 0.8 / zoom;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function onWheel(event) {
  zoom = Math.max(0.3, Math.min(zoom + event.deltaY * -0.001, 4));
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = 450 / zoom;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const sheet = document.getElementById('character-sheet');
    if (sheet) {
      sheet.style.display = sheet.style.display === 'block' ? 'none' : 'block';
      if (sheet.style.display === 'block' && playerPawn) window.showCharacterSheet(playerPawn);
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

  // Building hotkeys
  if (e.key.toLowerCase() === 'b') placeStructure('shelter', pawn);
  if (e.key.toLowerCase() === 'p') placeStructure('stockpile', pawn);
  if (e.key.toLowerCase() === 'w') placeStructure('wall', pawn);
  if (e.key.toLowerCase() === 'd') placeStructure('barricade', pawn);
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
  if (statusEl) {
    const p = pawns[0];
    statusEl.innerHTML = `${p.isPlayer ? 'YOU' : p.name} | H:${Math.floor(p.needs.health)} Hu:${Math.floor(p.needs.hunger)} Th:${Math.floor(p.needs.thirst)} San:${Math.floor(p.needs.sanity)} | Inv:${p.inventory.length}`;
  }

  renderer.render(scene, camera);
}

animate();

console.log('%c[RUIN RECLAIMER] More building options added.', 'color:#c9b896');
console.log('%cB = Shelter | P = Stockpile | W = Wall | D = Spike Barricade', 'color:#888');
