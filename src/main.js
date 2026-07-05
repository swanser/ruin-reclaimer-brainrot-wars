import * as THREE from 'three';
import { WorldGenerator } from './WorldGenerator.js';
import { Pawn } from './Pawn.js';
import { createItem, Recipes } from './Item.js';

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

// Add a simple visual "workbench" in the world for crafting
const workbench = new THREE.Mesh(
  new THREE.BoxGeometry(8, 3, 8),
  new THREE.MeshLambertMaterial({ color: 0x555555 })
);
workbench.position.set(40, 2, 30);
scene.add(workbench);
workbench.userData = { type: 'workbench' };

// Mouse + Keyboard controls
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (event.button === 0) {
    // Select pawn
    const pawnIntersects = raycaster.intersectObjects(pawns.map(p => p.mesh));
    if (pawnIntersects.length > 0) {
      const clicked = pawns.find(p => p.mesh === pawnIntersects[0].object);
      if (clicked) {
        selectedPawns = [clicked];
        console.log(`%c[RUIN] Selected: ${clicked.name}`, 'color:#c9b896');
      }
    } else {
      // Check for workbench or resource nodes
      const allIntersects = raycaster.intersectObjects(scene.children, true);
      const workbenchHit = allIntersects.find(i => i.object.userData?.type === 'workbench');
      if (workbenchHit && selectedPawns.length > 0) {
        console.log('%c[RUIN] At workbench. Type craft("bandage") or craft("spiked_bat") in console to craft.', 'color:#aadd88');
      }
    }
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

// Keyboard for quick actions
window.addEventListener('keydown', (e) => {
  if (!selectedPawns.length) return;
  const pawn = selectedPawns[0];

  if (e.key.toLowerCase() === 'i') {
    pawn.listInventory();
  }
  if (e.key.toLowerCase() === 'c') {
    // Quick craft examples
    console.log('%c[RUIN] Attempting to craft bandage...', 'color:#aadd88');
    import('./Item.js').then(({ craftItem }) => {
      craftItem(pawn, 'bandage');
    });
  }
  if (e.key.toLowerCase() === 's') {
    // Scavenge nearby (prototype)
    console.log('%c[RUIN] Scavenging...', 'color:#aadd88');
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

console.log('%c[RUIN RECLAIMER] Lone Survivor + Crafting active.', 'color:#c9b896');
console.log('%cControls: Left-click select | Right-click move | I = inventory | C = craft bandage | S = scavenge scrap', 'color:#888');
