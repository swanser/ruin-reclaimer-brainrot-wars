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

// Loose ground items
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

// === SIMPLE BASE BUILDING (Lone Survivor Start) ===
let placedStructures = [];

function placeSimpleCamp(pawn) {
  if (!pawn) return;
  
  const camp = new THREE.Group();
  
  // Simple shelter / lean-to
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(10, 5, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x554433 })
  );
  wall.position.set(0, 3, 0);
  camp.add(wall);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(11, 1, 6),
    new THREE.MeshLambertMaterial({ color: 0x443322 })
  );
  roof.position.set(0, 6, 2);
  roof.rotation.x = -0.3;
  camp.add(roof);

  camp.position.copy(pawn.mesh.position);
  camp.position.y = 0;
  camp.position.x += 12; // place slightly in front
  
  camp.userData = { type: 'player_camp', name: 'Makeshift Shelter' };
  scene.add(camp);
  placedStructures.push(camp);

  console.log('%c[RUIN] You set up a basic shelter. This could become the start of something.', 'color:#aadd88');
}

// === INTERACTION ===
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (event.button === 0) {
    const allIntersects = raycaster.intersectObjects(scene.children, true);

    // Pawn selection + auto sheet
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
          console.log(`%c[RUIN] Scavenged ${node.userData.name} → ${item.name}`, 'color:#aadd88');
          if (node.userData.remaining <= 0) node.material.color.setHex(0x222222);
        }
      }
      return;
    }

    // Vehicle wrecks (better loot chance)
    const wreckHit = allIntersects.find(i => i.object.userData?.type === 'vehicle_wreck' || i.object.parent?.userData?.type === 'vehicle_wreck');
    if (wreckHit && selectedPawns.length > 0) {
      const wreck = wreckHit.object.parent || wreckHit.object;
      const pawn = selectedPawns[0];
      
      if (wreck.userData.remaining > 0) {
        // Vehicle wrecks give better / multiple items
        const possibleDrops = ['scrap_metal', 'wire', 'duct_tape', 'fuel_canister'];
        const dropKey = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
        const item = createItem(dropKey);
        if (item) {
          pawn.addItem(item);
          if (Math.random() > 0.6) { // chance for second item
            const extra = createItem(possibleDrops[Math.floor(Math.random() * possibleDrops.length)]);
            if (extra) pawn.addItem(extra);
          }
          wreck.userData.remaining--;
          console.log(`%c[RUIN] Stripped parts from ${wreck.userData.name}`, 'color:#aadd88');
        }
      } else {
        console.log('%c[RUIN] This wreck has been picked clean.', 'color:#666');
      }
      return;
    }

    // Loose items
    const looseHit = allIntersects.find(i => i.object.userData?.type === 'loose_item');
    if (looseHit && selectedPawns.length > 0) {
      const itemMesh = looseHit.object;
      selectedPawns[0].addItem(itemMesh.userData.itemData);
      scene.remove(itemMesh);
      console.log(`%c[RUIN] Picked up item from ground`, 'color:#aadd88');
      return;
    }

    // Workbench
    const benchHit = allIntersects.find(i => i.object.userData?.type === 'workbench');
    if (benchHit && selectedPawns.length > 0) {
      console.log('%c[RUIN] === WORKBENCH - Available Recipes ===', 'color:#c9b896');
      Object.keys(Recipes).forEach(k => {
        console.log(`  ${Recipes[k].name} ${canCraft(selectedPawns[0], k) ? '✓' : '✗'}`);
      });
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

// Keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const sheet = document.getElementById('character-sheet');
    if (sheet) sheet.style.display = (sheet.style.display === 'block') ? 'none' : 'block';
    if (sheet.style.display === 'block' && playerPawn) window.showCharacterSheet(playerPawn);
  }

  if (!selectedPawns.length) return;
  const pawn = selectedPawns[0];

  if (e.key.toLowerCase() === 'i') pawn.listInventory();
  if (e.key.toLowerCase() === 'c') craftItem(pawn, 'bandage');
  if (e.key.toLowerCase() === 's') {
    const scrap = createItem('scrap_metal');
    if (scrap) pawn.addItem(scrap);
  }
  if (e.key.toLowerCase() === 'b') {
    // Simple base building - place camp
    placeSimpleCamp(pawn);
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
  if (statusEl) {
    const p = pawns[0];
    statusEl.innerHTML = `${p.isPlayer ? 'YOU' : p.name} | H:${Math.floor(p.needs.health)} Hu:${Math.floor(p.needs.hunger)} Th:${Math.floor(p.needs.thirst)} San:${Math.floor(p.needs.sanity)} | Inv:${p.inventory.length}`;
  }

  renderer.render(scene, camera);
}

animate();

console.log('%c[RUIN RECLAIMER] World expanded with vehicle wrecks + simple camp building.', 'color:#c9b896');
console.log('%cPress B near your location to place a basic shelter. Vehicle wrecks give better loot.', 'color:#888');
