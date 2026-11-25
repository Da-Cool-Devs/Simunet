const state = { racks: 0, cooling: false, ups: false, deployed: false };
const profiles = {
    web: { label: "Web server", cpu: 12, memory: 8, storage: 2, kind: "server" },
    database: { label: "Database server", cpu: 18, memory: 16, storage: 8, kind: "server" },
    storage: { label: "Storage server", cpu: 8, memory: 8, storage: 20, kind: "server" },
    backup: { label: "Backup server", cpu: 6, memory: 4, storage: 25, kind: "server" },
    auth: { label: "Authentication server", cpu: 10, memory: 8, storage: 3, kind: "server" },
    gpu: { label: "GPU accelerator", cpu: 0, memory: 16, storage: 0, kind: "accelerator" },
    switch: { label: "Network switch", cpu: 0, memory: 0, storage: 0, kind: "network" },
    router: { label: "Router", cpu: 0, memory: 0, storage: 0, kind: "network" },
    loadbalancer: { label: "Load balancer", cpu: 2, memory: 2, storage: 0, kind: "network" }
};
const stock = { web: 6, database: 4, storage: 4, backup: 3, auth: 3, gpu: 4, switch: 3, router: 2, loadbalancer: 2 };
const racks = { standard: { label: "Standard", slots: 9 }, gpu: { label: "GPU-ready", slots: 9 }, dense: { label: "High-density", slots: 12 } };
const $ = id => document.getElementById(id);
const rackArea = $("rackArea");
const inventory = $("partInventory");
const buildMessage = $("buildMessage");
let selectedPart = null;
let draggedPart = null;

function log(message) {
    const logArea = $("eventLog");
    if (!logArea) return;
    const line = document.createElement("p");
    const time = document.createElement("span");
    time.textContent = new Date().toLocaleTimeString("en-US", { hour12: false });
    line.append(time, document.createTextNode(` ${message}`));
    logArea.append(line);
    logArea.scrollTop = logArea.scrollHeight;
}
function refreshInventory() {
    Object.entries(stock).forEach(([type, count]) => {
        const countLabel = document.querySelector(`[data-count="${type}"]`);
        const card = document.querySelector(`.part-card[data-part="${type}"]`);
        if (countLabel) countLabel.textContent = `× ${count}`;
        if (card) card.disabled = count < 1;
    });
}
function selectPart(type) {
    if (!profiles[type] || stock[type] < 1) return;
    selectedPart = type;
    document.querySelectorAll(".part-card").forEach(card => card.setAttribute("aria-pressed", String(card.dataset.part === type)));
    buildMessage.textContent = `${profiles[type].label} selected. Click or tap an empty bay to install it, or drag it into a bay.`;
}
function notifyRoom() { window.dispatchEvent(new CustomEvent("simunet:hardware-change")); }
function drawRack() {
    const selected = $("rackType").value;
    const profile = racks[selected] || racks.standard;
    if (rackArea.querySelector(".empty-rack-state")) rackArea.replaceChildren();
    const index = rackArea.querySelectorAll(":scope > .rack").length + 1;
    const rack = document.createElement("div");
    rack.className = `rack rack-${selected}`;
    rack.dataset.rackType = selected;
    rack.dataset.rackIndex = String(index);
    const heading = document.createElement("div");
    heading.className = "rack-label";
    heading.innerHTML = `<strong>RACK ${String(index).padStart(2, "0")}</strong><span>${profile.label} · ${profile.slots} bays</span>`;
    rack.append(heading);
    for (let slot = 0; slot < profile.slots; slot++) {
        const bay = document.createElement("div");
        bay.className = "rack-slot";
        bay.dataset.slot = String(slot);
        bay.setAttribute("role", "button");
        bay.tabIndex = 0;
        bay.setAttribute("aria-label", `Rack ${index}, bay ${slot + 1}, empty. Select a part and activate this bay, or drag a part here.`);
        bay.innerHTML = `<span class="slot-number">${String(slot + 1).padStart(2, "0")}</span><span class="slot-prompt">ADD PART</span>`;
        rack.append(bay);
    }
    rackArea.append(rack);
    state.racks = rackArea.querySelectorAll(":scope > .rack").length;
    $("rackCount").textContent = `${state.racks} RACK${state.racks === 1 ? "" : "S"}`;
    buildMessage.textContent = `Rack ${index} built. Select hardware and choose an empty bay.`;
    log(`${profile.label} rack ${index} built.`);
    notifyRoom();
    updateDashboard();
}
function installPart(type, bay) {
    if (!profiles[type] || stock[type] < 1) {
        buildMessage.textContent = "That part is out of stock. Choose another inventory item.";
        return false;
    }
    if (!bay || bay.querySelector(":scope > .server")) {
        buildMessage.textContent = "That bay is occupied. Choose an empty bay.";
        return false;
    }
    const rack = bay.closest(".rack");
    if (!rack) return false;
    const part = document.createElement("div");
    part.className = `server part-${type}`;
    part.dataset.part = type;
    const label = document.createElement("span");
    label.className = "part-label";
    label.textContent = profiles[type].label;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-part";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${profiles[type].label} from rack`);
    part.append(label, remove);
    bay.replaceChildren(part);
    bay.classList.add("occupied");
    bay.classList.remove("drag-over");
    bay.setAttribute("aria-label", `Rack ${rack.dataset.rackIndex}, bay ${Number(bay.dataset.slot) + 1}, ${profiles[type].label}.`);
    stock[type]--;
    selectedPart = null;
    draggedPart = null;
    document.querySelectorAll(".part-card").forEach(card => card.setAttribute("aria-pressed", "false"));
    buildMessage.textContent = `${profiles[type].label} installed in Rack ${rack.dataset.rackIndex}, bay ${Number(bay.dataset.slot) + 1}.`;
    log(`${profiles[type].label} installed in Rack ${rack.dataset.rackIndex}.`);
    refreshInventory();
    notifyRoom();
    updateDashboard();
    return true;
}
function removePart(part) {
    const type = part.dataset.part;
    const bay = part.closest(".rack-slot");
    if (!type || !bay) return;
    stock[type]++;
    bay.innerHTML = `<span class="slot-number">${String(Number(bay.dataset.slot) + 1).padStart(2, "0")}</span><span class="slot-prompt">ADD PART</span>`;
    bay.classList.remove("occupied");
    bay.setAttribute("aria-label", `Rack ${bay.closest(".rack").dataset.rackIndex}, bay ${Number(bay.dataset.slot) + 1}, empty. Select a part and activate this bay, or drag a part here.`);
    buildMessage.textContent = `${profiles[type].label} removed. Select it from inventory to install it again.`;
    log(`${profiles[type].label} removed.`);
    refreshInventory();
    notifyRoom();
    updateDashboard();
}
function updateDashboard() {
    if (!rackArea) return;
    const installed = [...rackArea.querySelectorAll(".rack-slot > .server")];
    const total = installed.reduce((sum, part) => {
        const profile = profiles[part.dataset.part];
        if (profile) { sum.cpu += profile.cpu; sum.memory += profile.memory; sum.storage += profile.storage; }
        return sum;
    }, { cpu: 0, memory: 0, storage: 0 });
    const servers = installed.filter(part => profiles[part.dataset.part]?.kind === "server");
    const cpu = Math.min(total.cpu, 100);
    const memory = Math.min(total.memory, 128);
    const customers = state.deployed ? 1000 + servers.length * 250 : 0;
    $("cpuValue").textContent = `${cpu}%`;
    $("memoryValue").textContent = `${memory} GB`;
    $("storageValue").textContent = `${total.storage} TB`;
    $("customersValue").textContent = customers.toLocaleString();
    $("cpuMeter").style.width = `${cpu}%`;
    $("memoryMeter").style.width = `${memory / 128 * 100}%`;
    $("storageMeter").style.width = `${Math.min(total.storage * 2, 100)}%`;
    $("customersMeter").style.width = `${Math.min(customers / 50, 100)}%`;
    const online = state.racks > 0 && servers.length > 0;
    $("systemStatus").classList.toggle("online", online);
    $("systemStatus").innerHTML = `<span class="status-dot"></span>${online ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}`;
    if (state.cooling) $("deployMessage").textContent = "Cooling active. Temperature nominal.";
    else if (servers.length > 4) $("deployMessage").textContent = "Cooling is recommended for this server load.";
}

$("addRackBtn").addEventListener("click", drawRack);
$("rackType").addEventListener("change", () => {
    const descriptions = { standard: "A balanced rack for general-purpose servers.", gpu: "Reinforced power and cooling for GPU accelerators.", dense: "A taller rack with extra bays for more equipment." };
    $("rackTypeHelp").textContent = descriptions[$("rackType").value];
});
inventory.addEventListener("click", event => {
    const card = event.target.closest(".part-card");
    if (card && !card.disabled) selectPart(card.dataset.part);
});
inventory.addEventListener("dragstart", event => {
    const card = event.target.closest(".part-card");
    if (!card || card.disabled || !event.dataTransfer) { event.preventDefault(); return; }
    draggedPart = card.dataset.part;
    selectPart(draggedPart);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", draggedPart);
    try { event.dataTransfer.setData("application/x-simunet-part", draggedPart); } catch {}
});
inventory.addEventListener("dragend", () => {
    draggedPart = null;
    rackArea.querySelectorAll(".drag-over").forEach(bay => bay.classList.remove("drag-over"));
});
rackArea.addEventListener("dragover", event => {
    const bay = event.target.closest(".rack-slot");
    if (!bay || bay.querySelector(":scope > .server")) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    bay.classList.add("drag-over");
});
rackArea.addEventListener("dragleave", event => {
    const bay = event.target.closest(".rack-slot");
    if (bay && !bay.contains(event.relatedTarget)) bay.classList.remove("drag-over");
});
rackArea.addEventListener("drop", event => {
    const bay = event.target.closest(".rack-slot");
    if (!bay) return;
    event.preventDefault();
    event.stopPropagation();
    bay.classList.remove("drag-over");
    let type = draggedPart || selectedPart;
    if (event.dataTransfer) {
        try { type = event.dataTransfer.getData("application/x-simunet-part") || event.dataTransfer.getData("text/plain") || type; } catch {}
    }
    if (type) installPart(type, bay);
});
rackArea.addEventListener("click", event => {
    const remove = event.target.closest(".remove-part");
    if (remove) return removePart(remove.closest(".server"));
    const bay = event.target.closest(".rack-slot");
    if (bay && selectedPart) installPart(selectedPart, bay);
});
rackArea.addEventListener("keydown", event => {
    const bay = event.target.closest(".rack-slot");
    if (bay && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        if (selectedPart) installPart(selectedPart, bay);
    }
});
$("deployBtn").addEventListener("click", () => {
    const servers = [...rackArea.querySelectorAll(".server")].map(part => part.dataset.part).filter(type => profiles[type]?.kind === "server");
    if (servers.length < 2 || !servers.includes("web")) {
        $("deployMessage").textContent = servers.includes("web") ? "Install at least one more server before deployment." : "Install a Web server and another server before deployment.";
        log("Deployment requirements are not met.");
        return;
    }
    state.deployed = true;
    $("serviceStatus").textContent = "ONLINE";
    $("serviceStatus").classList.add("online");
    $("deployMessage").textContent = "Website deployed across your server cluster.";
    log("Website deployed successfully.");
    updateDashboard();
});
const backupButton = $("backupBtn");
if (backupButton) backupButton.addEventListener("click", () => {
    if (!rackArea.querySelector('.server[data-part="backup"]')) {
        $("deployMessage").textContent = "Install a Backup server first.";
        return;
    }
    $("deployMessage").textContent = "Backup snapshot completed successfully.";
    log("Disaster recovery snapshot completed.");
});
$("clearLogBtn").addEventListener("click", () => { $("eventLog").replaceChildren(); log("Operations log cleared."); });
$("coolingToggle").addEventListener("change", event => { state.cooling = event.target.checked; log(state.cooling ? "Cooling systems activated." : "Cooling systems disabled."); updateDashboard(); notifyRoom(); });
$("upsToggle").addEventListener("change", event => { state.ups = event.target.checked; log(state.ups ? "UPS backup power enabled." : "UPS backup power disabled."); notifyRoom(); });
window.addEventListener("simunet:hardware-change", () => {});
refreshInventory();
updateDashboard();
