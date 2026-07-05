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

// Some loose items on the ground for pickup demo
const looseItems = [];
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
  looseItems.push(mesh);
}

// Spawn a few loose items near start
spawnLooseItem('duct_tape', 15, 10);
spawnLooseItem('cloth', -20, 25);
spawnLooseItem('scrap_metal', 35, -15);

// === IMPROVED INTERACTION ===
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (event.button === 0) { // Left click
    const allIntersects = raycaster.intersectObjects(scene.children, true);

    // 1. Try selecting a pawn first
    const pawnIntersects = allIntersects.filter(i => pawns.some(p => p.mesh === i.object));
    if (pawnIntersects.length > 0) {
      const clickedPawn = pawns.find(p => p.mesh === pawnIntersects[0].object);
      if (clickedPawn) {
        selectedPawns = [clickedPawn];
        console.log(`%c[RUIN] Selected: ${clickedPawn.name}`, 'color:#c9b896');
        return;
      }
    }

    // 2. Check for resource nodes
    const nodeHit = allIntersects.find(i => i.object.userData?.type === 'resource_node');
    if (nodeHit && selectedPawns.length > 0) {
      const node = nodeHit.object;
      const pawn = selectedPawns[0];
      
      if (node.userData.remaining > 0) {
        const itemKey = node.userData.dropItem;
        const item = createItem(itemKey);
        if (item) {
          pawn.addItem(item);
          node.userData.remaining--;
          console.log(`%c[RUIN] Scavenged ${node.userData.name} → got ${item.name}`, 'color:#aadd88');
          
          // Deplete visual when empty
          if (node.userData.remaining <= 0) {
            node.material.color.setHex(0x222222);
          }
        }
      } else {
        console.log('%c[RUIN] This node is depleted.', 'color:#666');
      }
      return;
    }

    // 3. Check for loose items on ground
    const looseHit = allIntersects.find(i => i.object.userData?.type === 'loose_item');
    if (looseHit && selectedPawns.length > 0) {
      const itemMesh = looseHit.object;
      const itemData = itemMesh.userData.itemData;
      const pawn = selectedPawns[0];
      
      pawn.addItem(itemData);
      scene.remove(itemMesh);
      const idx = looseItems.indexOf(itemMesh);
      if (idx !== -1) looseItems.splice(idx, 1);
      
      console.log(`%c[RUIN] Picked up ${itemData.name} from the ground`, 'color:#aadd88');
      return;
    }

    // 4. Workbench interaction
    const workbenchHit = allIntersects.find(i => i.object.userData?.type === 'workbench');
    if (workbenchHit && selectedPawns.length > 0) {
      const pawn = selectedPawns[0];
      console.log('%c[RUIN] === WORKBENCH ===', 'color:#c9b896');
      console.log('Available recipes you can craft:');
      
      Object.keys(Recipes).forEach(key => {
        const recipe = Recipes[key];
        const possible = canCraft(pawn, key);
        const status = possible ? '✓ Can craft' : '✗ Missing materials';
        console.log(`  ${recipe.name} - ${status}`);
      });
      
      console.log('%cType craft("recipe_key") in console to craft (e.g. craft("bandage"))', 'color:#888');
      return;
    }

    // Default: clear selection
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

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (!selectedPawns.length) return;
  const pawn = selectedPawns[0];

  if (e.key.toLowerCase() === 'i') pawn.listInventory();
  
  if (e.key.toLowerCase() === 'c') {
    console.log('%c[RUIN] Quick crafting bandage...', 'color:#aadd88');
    craftItem(pawn, 'bandage');
  }
  
  if (e.key.toLowerCase() === 's') {
    console.log('%c[RUIN] Quick scavenge for scrap...', 'color:#aadd88');
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

console.log('%c[RUIN RECLAIMER] World Interaction Polished.', 'color:#c9b896');
console.log('%cLeft-click resource nodes or loose items to interact. Click workbench for recipe list.', 'color:#888');
