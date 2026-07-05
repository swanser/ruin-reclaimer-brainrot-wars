import * as THREE from 'three';
import { WorldGenerator } from './WorldGenerator.js';
import { Pawn } from './Pawn.js';

// === CORE THREE.JS SETUP - TOP DOWN RIMWORLD VIEW ===
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2, window.innerWidth / 2,
  window.innerHeight / 2, window.innerHeight / -2,
  0.1, 2000
);
camera.position.set(0, 400, 0); // High top-down
camera.lookAt(0, 0, 0);

let zoom = 1;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting (gritty desaturated feel)
const ambient = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffeecc, 0.8);
dirLight.position.set(100, 200, 50);
scene.add(dirLight);

// Fog / Atmosphere
const fogColor = new THREE.Color(0x2a2520);
scene.fog = new THREE.Fog(fogColor, 300, 1200);

// Input state
let selectedPawns = [];
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// World
const world = new WorldGenerator(scene);
world.generate(12345); // Seed for this shard

// Initial Pawn
const pawn = new Pawn(scene, new THREE.Vector3(0, 0, 0));
const pawns = [pawn];

// Mouse Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (event.button === 0) { // Left click - select
    const intersects = raycaster.intersectObjects(pawns.map(p => p.mesh));
    if (intersects.length > 0) {
      const clickedPawn = pawns.find(p => p.mesh === intersects[0].object);
      if (clickedPawn) {
        selectedPawns = [clickedPawn];
        console.log('%c[RUIN] Pawn selected', 'color:#c9b896');
      }
    } else {
      selectedPawns = [];
    }
  }

  if (event.button === 2) { // Right click - move command
    if (selectedPawns.length > 0) {
      const groundIntersects = raycaster.intersectObject(world.ground);
      if (groundIntersects.length > 0) {
        const targetPos = groundIntersects[0].point;
        selectedPawns.forEach(p => p.moveTo(targetPos));
        console.log('%c[RUIN] Move order issued', 'color:#c9b896');
      }
    }
  }

  if (event.button === 0) {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function onMouseUp() {
  isDragging = false;
}

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
  const viewSize = 400 / zoom;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('contextmenu', e => e.preventDefault());

// Resize handler
function onResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = 400 / zoom;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Update pawns
  pawns.forEach(p => p.update());

  // Update UI status
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `Pawns: ${pawns.length} | Selected: ${selectedPawns.length} | Scrap: ${world.scrap}`;
  }

  renderer.render(scene, camera);
}

animate();

console.log('%c[RUIN RECLAIMER] Top-down prototype ignited. Wastelander in command.', 'color:#c9b896; font-size: 10px');
