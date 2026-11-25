import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const container = document.getElementById("serverRoom");
const loading = document.getElementById("roomLoading");
const rackArea = document.getElementById("rackArea");
const roomHardware = document.getElementById("roomHardware");
const roomDescription = document.getElementById("roomDescription");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#05090e");
scene.fog = new THREE.Fog("#05090e", 20, 46);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(9, 8, 12);

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
    console.error("Could not initialize the 3D server room:", error);
    window.showRoomFallback("WEBGL UNAVAILABLE — SHOWING 2D RACKS");
    throw error;
}

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
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 5;
controls.maxDistance = 24;
controls.maxPolarAngle = Math.PI * 0.48;

scene.add(new THREE.HemisphereLight(0x9bdcff, 0x101722, 1.65));
const keyLight = new THREE.DirectionalLight(0xb5e7ff, 3.7);
keyLight.position.set(-5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x13bde0, 18, 18, 2);
fillLight.position.set(-5, 3.5, 1);
scene.add(fillLight);
const warningLight = new THREE.PointLight(0xff5b43, 8, 12, 2);
warningLight.position.set(6, 3, -4);
scene.add(warningLight);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 24),
    new THREE.MeshStandardMaterial({ color: 0x111a22, roughness: 0.68, metalness: 0.32 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.035;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(32, 48, 0x246079, 0x172c39);
grid.position.y = -0.022;
scene.add(grid);

const racksGroup = new THREE.Group();
scene.add(racksGroup);
const equipmentGroup = new THREE.Group();
scene.add(equipmentGroup);
const packetGroup = new THREE.Group();
scene.add(packetGroup);
const roomDetails = new THREE.Group();
scene.add(roomDetails);

const materials = {
    frame: new THREE.MeshStandardMaterial({ color: 0x354858, metalness: 0.84, roughness: 0.27 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0a1118, metalness: 0.62, roughness: 0.42 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x88a9bb, metalness: 0.78, roughness: 0.23 }),
    web: new THREE.MeshStandardMaterial({ color: 0x56d9ef, emissive: 0x087d98, emissiveIntensity: 0.8, metalness: 0.42, roughness: 0.3 }),
    database: new THREE.MeshStandardMaterial({ color: 0xffb86c, emissive: 0x80450b, emissiveIntensity: 0.72, metalness: 0.36, roughness: 0.3 }),
    storage: new THREE.MeshStandardMaterial({ color: 0xa78bfa, emissive: 0x5733a4, emissiveIntensity: 0.72, metalness: 0.36, roughness: 0.3 }),
    backup: new THREE.MeshStandardMaterial({ color: 0x88ffcc, emissive: 0x127047, emissiveIntensity: 0.72, metalness: 0.38, roughness: 0.3 }),
    auth: new THREE.MeshStandardMaterial({ color: 0xf0a6ca, emissive: 0x8a315b, emissiveIntensity: 0.72, metalness: 0.35, roughness: 0.3 })
};

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const roomMaterials = {
    wall: new THREE.MeshStandardMaterial({ color: 0x101923, metalness: 0.54, roughness: 0.62 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x1a2834, metalness: 0.72, roughness: 0.4 }),
    glow: new THREE.MeshBasicMaterial({ color: 0x2ad9ff }),
    hazard: new THREE.MeshStandardMaterial({ color: 0xc98a2d, metalness: 0.42, roughness: 0.56 })
};

function addBox(parent, material, x, y, z, width, height, depth, castShadow = true) {
    const mesh = new THREE.Mesh(boxGeometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function buildRoomDetails() {
    addBox(roomDetails, roomMaterials.wall, 0, 2.5, -7, 18, 5, 0.35, false);
    addBox(roomDetails, roomMaterials.wall, -9, 2.5, -0.5, 0.35, 5, 13, false);
    addBox(roomDetails, roomMaterials.wall, 9, 2.5, -0.5, 0.35, 5, 13, false);

    for (let x = -8; x <= 8; x += 2) {
        addBox(roomDetails, materials.frame, x, 2.5, -6.79, 0.055, 4.75, 0.06, false);
        addBox(roomDetails, roomMaterials.panel, x + 0.82, 2.45, -6.78, 1.45, 2.8, 0.035, false);
        addBox(roomDetails, roomMaterials.glow, x + 0.25, 4.3, -6.74, 0.28, 0.035, 0.025, false);
    }

    for (let x = -6; x <= 6; x += 4) {
        addBox(roomDetails, materials.frame, x, 4.45, -0.2, 0.12, 0.12, 12, false);
        addBox(roomDetails, roomMaterials.glow, x, 4.38, -0.2, 0.045, 0.025, 8.5, false);
    }

    for (let index = 0; index < 12; index++) {
        const stripe = addBox(roomDetails, roomMaterials.hazard, -5.5 + index * 1, 0.012, 5.6, 0.46, 0.025, 0.12, false);
        stripe.rotation.y = Math.PI / 5;
    }
}

function clearGroup(group) {
    while (group.children.length) {
        const child = group.children.pop();
        if (child) group.remove(child);
    }
}

function buildRack(x, z, servers, index) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    racksGroup.add(group);
    const width = 1.12;
    const height = 2.72;
    const depth = 0.82;

    // Four uprights and top/bottom braces make the rack silhouette.
    [-width / 2, width / 2].forEach((sideX) => {
        [-depth / 2, depth / 2].forEach((sideZ) => {
            addBox(group, materials.frame, sideX, height / 2, sideZ, 0.075, height, 0.075);
        });
    });
    [-depth / 2, depth / 2].forEach((sideZ) => {
        addBox(group, materials.trim, 0, height - 0.045, sideZ, width + 0.05, 0.09, 0.09);
        addBox(group, materials.frame, 0, 0.045, sideZ, width + 0.05, 0.09, 0.09);
    });
    addBox(group, materials.dark, 0, height / 2, -depth / 2 + 0.045, width - 0.1, height - 0.2, 0.045, false);
    addBox(group, materials.dark, 0, height / 2, depth / 2 - 0.005, width - 0.12, height - 0.18, 0.035, false);

    const serverHeight = 0.205;
    const serverGap = 0.055;
    servers.forEach((type, serverIndex) => {
        const y = 0.2 + serverIndex * (serverHeight + serverGap);
        const frontZ = depth / 2 + 0.01;
        addBox(group, materials[type] || materials.web, 0, y, frontZ, width - 0.17, serverHeight, 0.11);
        addBox(group, materials.dark, -0.14, y, frontZ + 0.061, 0.27, 0.095, 0.012, false);
        addBox(group, materials.dark, 0.21, y, frontZ + 0.061, 0.31, 0.095, 0.012, false);
        for (let vent = 0; vent < 3; vent++) {
            addBox(group, materials.trim, -0.14, y - 0.03 + vent * 0.027, frontZ + 0.07, 0.19, 0.008, 0.008, false);
        }
        addBox(group, materials.backup, width * 0.34, y, frontZ + 0.07, 0.035, 0.035, 0.012, false);
    });

    // Rack number plaque.
    const plaque = addBox(group, materials.dark, 0, height + 0.1, 0, 0.72, 0.18, 0.045, false);
    plaque.userData.rackNumber = index + 1;
    addBox(group, roomMaterials.glow, -0.25, height + 0.1, 0.03, 0.12, 0.025, 0.012, false);
}

function buildCoolingUnits(active) {
    clearGroup(equipmentGroup);
    if (!active) return;
    const fanMaterial = new THREE.MeshStandardMaterial({ color: 0x42c8e8, emissive: 0x0c4854, emissiveIntensity: 0.7, metalness: 0.35, roughness: 0.4 });
    for (let x = -3; x <= 3; x += 2) {
        const unit = new THREE.Group();
        unit.position.set(x, 0, -3.1);
        equipmentGroup.add(unit);
        addBox(unit, materials.frame, 0, 1.35, 0, 1.05, 2.7, 0.6);
        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), fanMaterial);
        fan.rotation.x = Math.PI / 2;
        fan.position.set(0, 1.7, 0.34);
        unit.add(fan);
        for (let vent = 0; vent < 5; vent++) {
            addBox(unit, materials.trim, 0, 0.35 + vent * 0.12, 0.32, 0.7, 0.035, 0.04, false);
        }
    }
}

function buildPowerUnit(active) {
    if (!active) return;
    const unit = new THREE.Group();
    unit.position.set(4.4, 0, 1.2);
    equipmentGroup.add(unit);
    addBox(unit, materials.frame, 0, 0.72, 0, 0.9, 1.44, 0.82);
    addBox(unit, materials.backup, 0, 1.05, 0.43, 0.32, 0.08, 0.035, false);
}

function syncRoom() {
    const rackNodes = [...rackArea.querySelectorAll(":scope > .rack")];
    const racks = rackNodes.map((rack) => [...rack.querySelectorAll(":scope > .server")].map((server) => {
        const profile = [...server.classList].find((name) => Object.hasOwn(materials, name));
        return profile || "web";
    }));

    clearGroup(racksGroup);
    const columns = Math.min(4, Math.max(1, racks.length));
    const rows = Math.max(1, Math.ceil(racks.length / columns));
    racks.forEach((servers, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const x = (column - (columns - 1) / 2) * 2.15;
        const z = (row - (rows - 1) / 2) * 2.05;
        buildRack(x, z, servers, index);
    });

    const coolingActive = document.getElementById("coolingToggle").checked;
    const upsActive = document.getElementById("upsToggle").checked;
    buildCoolingUnits(coolingActive);
    if (upsActive) buildPowerUnit(true);

    const serverCount = racks.reduce((total, rack) => total + rack.length, 0);
    roomHardware.textContent = `${racks.length} RACK${racks.length === 1 ? "" : "S"} · ${serverCount} SERVER${serverCount === 1 ? "" : "S"}`;
    container.setAttribute("aria-label", `Interactive 3D data center with ${racks.length} racks and ${serverCount} servers. Drag to orbit and scroll to zoom.`);
    roomDescription.textContent = racks.length
        ? `${racks.length} rack${racks.length === 1 ? "" : "s"} · ${serverCount} server${serverCount === 1 ? "" : "s"}. ${coolingActive ? "Cooling is active." : "Cooling is off."} ${upsActive ? "Backup power is installed." : "No backup power installed."}`
        : "Your data center is empty. Add a rack to start building.";

    if (!racks.length) {
        controls.target.set(0, 1.15, 0);
    } else {
        controls.target.set(0, 1.2, 0);
    }
}

function buildPackets() {
    clearGroup(packetGroup);
    const packetMaterial = new THREE.MeshBasicMaterial({ color: 0x5de4ff });
    for (let index = 0; index < 8; index++) {
        const packet = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), packetMaterial);
        packet.userData.phase = index / 8;
        packetGroup.add(packet);
    }
}

buildPackets();
buildRoomDetails();
syncRoom();
loading?.remove();

const observer = new MutationObserver(syncRoom);
observer.observe(rackArea, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
["coolingToggle", "upsToggle"].forEach((id) => document.getElementById(id).addEventListener("change", syncRoom));

document.getElementById("roomResetView").addEventListener("click", () => {
    camera.position.set(9, 8, 12);
    controls.target.set(0, 1.15, 0);
    controls.update();
});

function resizeRenderer() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}
new ResizeObserver(resizeRenderer).observe(container);
resizeRenderer();

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    if (!reducedMotion) {
        packetGroup.children.forEach((packet) => {
            const progress = (time * 0.12 + packet.userData.phase) % 1;
            packet.position.set(-5 + progress * 10, 0.35 + Math.sin(progress * Math.PI * 2) * 0.08, 1.25);
            packet.visible = document.getElementById("serviceStatus").classList.contains("online");
        });
        equipmentGroup.children.forEach((unit) => {
            const fan = unit.children.find((child) => child.geometry?.type === "CylinderGeometry");
            if (fan) fan.rotation.z += 0.025;
        });
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();
