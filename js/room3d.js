import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const container = document.getElementById("serverRoom");
const rackArea = document.getElementById("rackArea");
const roomHardware = document.getElementById("roomHardware");
const roomDescription = document.getElementById("roomDescription");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || document.documentElement.dataset.reducedMotion === "true";
const scene = new THREE.Scene();
scene.background = new THREE.Color("#05090e");
scene.fog = new THREE.Fog("#05090e", 20, 46);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(9, 8, 12);
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
catch (error) { console.error("Could not initialize the 3D server room:", error); window.showRoomFallback("WEBGL UNAVAILABLE — RACK ASSEMBLY IS STILL AVAILABLE"); throw error; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.prepend(renderer.domElement);
renderer.domElement.setAttribute("aria-hidden", "true");
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.15, 0);
controls.enableDamping = !reducedMotion;
controls.dampingFactor = 0.055;
controls.minDistance = 5;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI * 0.48;
scene.add(new THREE.HemisphereLight(0x9bdcff, 0x101722, 1.65));
const keyLight = new THREE.DirectionalLight(0xb5e7ff, 3.7);
keyLight.position.set(-5, 10, 7); keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024); scene.add(keyLight);
scene.add(new THREE.PointLight(0x13bde0, 18, 18, 2)).position.set(-5, 3.5, 1);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 24), new THREE.MeshStandardMaterial({ color: 0x111a22, roughness: 0.68, metalness: 0.32 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.035; floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.GridHelper(32, 48, 0x246079, 0x172c39); grid.position.y = -0.022; scene.add(grid);
const racksGroup = new THREE.Group(); scene.add(racksGroup);
const equipmentGroup = new THREE.Group(); scene.add(equipmentGroup);
const packetGroup = new THREE.Group(); scene.add(packetGroup);
const roomDetails = new THREE.Group(); scene.add(roomDetails);
const material = (color, emissive = 0x000000) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? 0.7 : 0, metalness: 0.55, roughness: 0.32 });
const roomWallMaterial = material(0x101923);
const materials = {
    frame: material(0x354858), dark: material(0x0a1118), trim: material(0x88a9bb),
    web: material(0x56d9ef, 0x087d98), database: material(0xffb86c, 0x80450b), storage: material(0xa78bfa, 0x5733a4),
    backup: material(0x88ffcc, 0x127047), auth: material(0xf0a6ca, 0x8a315b), gpu: material(0xa276ff, 0x4a24aa),
    switch: material(0x42c8e8, 0x0c4854), router: material(0xff735f, 0x742317), loadbalancer: material(0xf4d35e, 0x755b0a)
};
const roomThemes = {
    dark: { background: "#05090e", floor: 0x111a22, wall: 0x101923, frame: 0x354858, dark: 0x0a1118, trim: 0x88a9bb, grid: 0xffffff, gridVertexColors: true },
    light: { background: "#eaf1f4", floor: 0xd9e3e7, wall: 0xf5f8f9, frame: 0x52636c, dark: 0x34434a, trim: 0x25363d, grid: 0x607a83, gridVertexColors: false },
    "high-contrast": { background: "#000000", floor: 0x050505, wall: 0x000000, frame: 0xffffff, dark: 0x101010, trim: 0xffffff, grid: 0xffffff, gridVertexColors: false }
};
function applySceneTheme() {
    const theme = roomThemes[document.documentElement.dataset.theme] || roomThemes.dark;
    scene.background.set(theme.background);
    scene.fog.color.set(theme.background);
    floor.material.color.setHex(theme.floor);
    roomWallMaterial.color.setHex(theme.wall);
    materials.frame.color.setHex(theme.frame);
    materials.dark.color.setHex(theme.dark);
    materials.trim.color.setHex(theme.trim);
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach(gridMaterial => {
        gridMaterial.vertexColors = theme.gridVertexColors;
        gridMaterial.color.setHex(theme.grid);
        gridMaterial.needsUpdate = true;
    });
    renderer.render(scene, camera);
}
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
function addBox(parent, mat, x, y, z, width, height, depth, shadow = true) {
    const mesh = new THREE.Mesh(boxGeometry, mat); mesh.position.set(x, y, z); mesh.scale.set(width, height, depth); mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function clearGroup(group) { while (group.children.length) { const child = group.children.pop(); if (child) group.remove(child); } }
function buildRoomDetails() {
    const glow = new THREE.MeshBasicMaterial({ color: 0x2ad9ff });
    addBox(roomDetails, roomWallMaterial, 0, 2.5, -7, 18, 5, 0.35, false);
    addBox(roomDetails, roomWallMaterial, -9, 2.5, -0.5, 0.35, 5, 13, false);
    addBox(roomDetails, roomWallMaterial, 9, 2.5, -0.5, 0.35, 5, 13, false);
    for (let x = -8; x <= 8; x += 2) addBox(roomDetails, glow, x + 0.25, 4.3, -6.74, 0.28, 0.035, 0.025, false);
    for (let x = -6; x <= 6; x += 4) addBox(roomDetails, glow, x, 4.38, -0.2, 0.045, 0.025, 8.5, false);
}
function buildRack(rackNode, x, z, index) {
    const type = rackNode.dataset.rackType || "standard";
    const bays = [...rackNode.querySelectorAll(":scope > .rack-slot")];
    const group = new THREE.Group(); group.position.set(x, 0, z); racksGroup.add(group);
    const width = type === "gpu" ? 1.3 : 1.12;
    const height = type === "dense" ? 3.25 : 2.72;
    const depth = 0.82;
    [-width / 2, width / 2].forEach(sideX => [-depth / 2, depth / 2].forEach(sideZ => addBox(group, materials.frame, sideX, height / 2, sideZ, 0.075, height, 0.075)));
    [-depth / 2, depth / 2].forEach(sideZ => { addBox(group, materials.trim, 0, height - 0.045, sideZ, width + 0.05, 0.09, 0.09); addBox(group, materials.frame, 0, 0.045, sideZ, width + 0.05, 0.09, 0.09); });
    addBox(group, materials.dark, 0, height / 2, -depth / 2 + 0.045, width - 0.1, height - 0.2, 0.045, false);
    if (type === "gpu") addBox(group, materials.gpu, -width / 2 - 0.1, height / 2, 0, 0.12, height * 0.8, depth * 0.7, false);
    const bayHeight = Math.min(0.205, (height - 0.42) / Math.max(bays.length, 1));
    const bayGap = (height - 0.4) / Math.max(bays.length, 1);
    bays.forEach((bay, slotIndex) => {
        const part = bay.querySelector(":scope > .server");
        if (!part) return;
        const typeKey = part.dataset.part || "web";
        const y = 0.21 + slotIndex * bayGap;
        const frontZ = depth / 2 + 0.01;
        const color = materials[typeKey] || materials.web;
        addBox(group, color, 0, y, frontZ, width - 0.17, bayHeight, 0.11);
        addBox(group, materials.dark, -0.14, y, frontZ + 0.061, 0.27, Math.max(0.06, bayHeight * 0.45), 0.012, false);
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: typeKey === "router" ? 0xff735f : 0x88ffcc }));
        led.position.set(width * 0.34, y, frontZ + 0.075); group.add(led);
        if (typeKey === "gpu") { addBox(group, materials.dark, -0.2, y, frontZ + 0.07, 0.12, bayHeight * 0.42, 0.02, false); addBox(group, materials.trim, 0.22, y, frontZ + 0.07, 0.15, 0.035, 0.02, false); }
    });
    addBox(group, materials.dark, 0, height + 0.1, 0, 0.72, 0.18, 0.045, false);
}
function buildCoolingUnits(active) {
    clearGroup(equipmentGroup); if (!active) return;
    for (let x = -3; x <= 3; x += 2) {
        const unit = new THREE.Group(); unit.position.set(x, 0, -3.1); equipmentGroup.add(unit);
        addBox(unit, materials.frame, 0, 1.35, 0, 1.05, 2.7, 0.6);
        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), materials.switch); fan.rotation.x = Math.PI / 2; fan.position.set(0, 1.7, 0.34); unit.add(fan);
    }
}
function buildPowerUnit() {
    if (!document.getElementById("upsToggle").checked) return;
    const unit = new THREE.Group(); unit.position.set(4.4, 0, 1.2); equipmentGroup.add(unit);
    addBox(unit, materials.frame, 0, 0.72, 0, 0.9, 1.44, 0.82); addBox(unit, materials.backup, 0, 1.05, 0.43, 0.32, 0.08, 0.035, false);
}
function syncRoom() {
    const racks = [...rackArea.querySelectorAll(":scope > .rack")];
    clearGroup(racksGroup);
    const columns = Math.min(4, Math.max(1, racks.length));
    const rows = Math.max(1, Math.ceil(racks.length / columns));
    racks.forEach((rack, index) => buildRack(rack, (index % columns - (columns - 1) / 2) * 2.15, (Math.floor(index / columns) - (rows - 1) / 2) * 2.05, index));
    buildCoolingUnits(document.getElementById("coolingToggle").checked); buildPowerUnit();
    const parts = [...rackArea.querySelectorAll(".server")];
    const countBy = key => parts.filter(part => part.dataset.part === key).length;
    roomHardware.textContent = `${racks.length} RACK${racks.length === 1 ? "" : "S"} · ${parts.length} EQUIPMENT PIECE${parts.length === 1 ? "" : "S"}`;
    const summary = parts.length ? `${parts.length} piece${parts.length === 1 ? "" : "s"} of equipment installed across ${racks.length} open rack${racks.length === 1 ? "" : "s"}. ${countBy("gpu")} graphics processor${countBy("gpu") === 1 ? "" : "s"}; ${countBy("switch") + countBy("router") + countBy("loadbalancer")} network part${countBy("switch") + countBy("router") + countBy("loadbalancer") === 1 ? "" : "s"}.` : "Open racks are ready. Drag parts into the spaces below to set up your data center.";
    roomDescription.textContent = summary;
    container.setAttribute("aria-label", `Interactive 3D data center with ${racks.length} racks and ${parts.length} installed hardware parts. Drag to orbit and scroll to zoom.`);
    renderer.render(scene, camera);
}
function buildPackets() {
    for (let index = 0; index < 8; index++) { const packet = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0x5de4ff })); packet.userData.phase = index / 8; packetGroup.add(packet); }
}
buildPackets(); buildRoomDetails(); syncRoom();
applySceneTheme();
document.getElementById("roomLoading")?.remove();
new MutationObserver(applySceneTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
new MutationObserver(syncRoom).observe(rackArea, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-part", "data-rack-type"] });
window.addEventListener("simunet:hardware-change", syncRoom);
["coolingToggle", "upsToggle"].forEach(id => document.getElementById(id).addEventListener("change", syncRoom));
document.getElementById("roomResetView").addEventListener("click", () => { camera.position.set(9, 8, 12); controls.target.set(0, 1.15, 0); controls.update(); });
new ResizeObserver(() => { const width = container.clientWidth, height = container.clientHeight; if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.render(scene, camera); }).observe(container);
controls.addEventListener("change", () => {
    if (reducedMotion) renderer.render(scene, camera);
});
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    packetGroup.children.forEach(packet => { const progress = (time * 0.12 + packet.userData.phase) % 1; packet.position.set(-5 + progress * 10, 0.35 + Math.sin(progress * Math.PI * 2) * 0.08, 1.25); packet.visible = document.getElementById("serviceStatus").classList.contains("online"); });
    equipmentGroup.children.forEach(unit => { const fan = unit.children.find(child => child.geometry?.type === "CylinderGeometry"); if (fan) fan.rotation.z += 0.025; });
    controls.update(); renderer.render(scene, camera);
}
if (reducedMotion) renderer.render(scene, camera);
else animate();
