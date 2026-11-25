const state = {
    racks: 0,
    servers: [],
    cooling: false,
    ups: false,
    firewall: false,
    deployed: false,
    backupComplete: false
};

const serverProfiles = {
    web: { label: "Web", description: "Hosts your website. Required to deploy.", cpu: 12, memory: 8, storage: 2, kind: "server" },
    database: { label: "Database", description: "Stores information used by your website.", cpu: 18, memory: 16, storage: 8, kind: "server" },
    storage: { label: "Storage", description: "Holds files and other cloud data.", cpu: 8, memory: 8, storage: 20, kind: "server" },
    backup: { label: "Backup", description: "Keeps recovery copies. Required to run a backup.", cpu: 6, memory: 4, storage: 25, kind: "server" },
    auth: { label: "Authentication", description: "Handles user sign-in and permissions.", cpu: 10, memory: 8, storage: 3, kind: "server" },
    gpu: { label: "GPU accelerator", description: "Adds parallel processing for AI and graphics workloads.", cpu: 0, memory: 16, storage: 0, kind: "accelerator" },
    switch: { label: "Network switch", description: "Connects devices inside the data-center network.", cpu: 0, memory: 0, storage: 0, kind: "network" },
    router: { label: "Router", description: "Routes traffic between networks.", cpu: 0, memory: 0, storage: 0, kind: "network" },
    loadbalancer: { label: "Load balancer", description: "Distributes incoming requests across servers.", cpu: 2, memory: 2, storage: 0, kind: "network" }
};
const partStock = { web: 6, database: 4, storage: 4, backup: 3, auth: 3, gpu: 4, switch: 3, router: 2, loadbalancer: 2 };
const partCosts = { web: 800, database: 1200, storage: 1000, backup: 900, auth: 850, gpu: 1500, switch: 500, router: 700, loadbalancer: 950 };
const rackProfiles = {
    standard: { label: "Standard", slots: 9, cost: 1200 },
    gpu: { label: "GPU-ready", slots: 9, cost: 1900 },
    dense: { label: "High-density", slots: 12, cost: 1700 }
};
const placedParts = { web: 0, database: 0, storage: 0, backup: 0, auth: 0, gpu: 0, switch: 0, router: 0, loadbalancer: 0 };
let selectedPart = null;

const elements = {
    rackArea: document.getElementById("rackArea"), rackCount: document.getElementById("rackCount"),
    rackType: document.getElementById("rackType"), rackTypeHelp: document.getElementById("rackTypeHelp"),
    partInventory: document.getElementById("partInventory"), buildMessage: document.getElementById("buildMessage"),
    cooling: document.getElementById("coolingToggle"), ups: document.getElementById("upsToggle"), firewall: document.getElementById("firewallToggle"),
    cpuValue: document.getElementById("cpuValue"), memoryValue: document.getElementById("memoryValue"), storageValue: document.getElementById("storageValue"), customersValue: document.getElementById("customersValue"),
    cpuMeter: document.getElementById("cpuMeter"), memoryMeter: document.getElementById("memoryMeter"), storageMeter: document.getElementById("storageMeter"), customersMeter: document.getElementById("customersMeter"),
    systemStatus: document.getElementById("systemStatus"), serviceStatus: document.getElementById("serviceStatus"), deployMessage: document.getElementById("deployMessage"),
    attackStatus: document.getElementById("attackStatus"), threatLevel: document.getElementById("threatLevel"), eventLog: document.getElementById("eventLog")
};

function timeStamp() { return new Date().toLocaleTimeString("en-US", { hour12: false }); }
function addLog(message) {
    const entry = document.createElement("p");
    const time = document.createElement("span");
    time.textContent = timeStamp();
    entry.append(time, document.createTextNode(` ${message}`));
    elements.eventLog.appendChild(entry);
    elements.eventLog.scrollTop = elements.eventLog.scrollHeight;
}
function notifyRoom() { window.dispatchEvent(new CustomEvent("simunet:hardware-change")); }
function serverParts() { return [...elements.rackArea.querySelectorAll(".server")].filter(part => serverProfiles[part.dataset.part]?.kind === "server"); }
function updateInventory() {
    Object.keys(partStock).forEach(type => {
        const count = document.querySelector(`[data-count="${type}"]`);
        if (count) count.textContent = `× ${partStock[type]}`;
        const card = document.querySelector(`[data-part="${type}"]`);
        if (card) card.disabled = partStock[type] <= 0;
    });
}
function selectPart(type) {
    if (!serverProfiles[type] || partStock[type] < 1) return;
    selectedPart = type;
    document.querySelectorAll(".part-card").forEach(card => card.setAttribute("aria-pressed", String(card.dataset.part === type)));
    elements.buildMessage.textContent = `${serverProfiles[type].label} selected. Choose an open rack bay to install it.`;
}
function renderRack(profileKey) {
    const profile = rackProfiles[profileKey] || rackProfiles.standard;
    const rackIndex = elements.rackArea.querySelectorAll(":scope > .rack").length + 1;
    const rack = document.createElement("div");
    rack.className = `rack rack-${profileKey}`;
    rack.dataset.rackType = profileKey;
    rack.dataset.rackIndex = String(rackIndex);
    const header = document.createElement("div");
    header.className = "rack-label";
    const title = document.createElement("strong");
    title.textContent = `RACK ${String(rackIndex).padStart(2, "0")}`;
    const subtitle = document.createElement("span");
    subtitle.textContent = `${profile.label} · ${profile.slots} bays`;
    header.append(title, subtitle);
    rack.append(header);
    for (let slot = 0; slot < profile.slots; slot++) {
        const bay = document.createElement("div");
        bay.className = "rack-slot";
        bay.dataset.slot = String(slot);
        bay.setAttribute("role", "button");
        bay.setAttribute("tabindex", "0");
        bay.setAttribute("aria-label", `Rack ${rackIndex}, bay ${slot + 1}, empty. Select a part or drag one here.`);
        const number = document.createElement("span");
        number.className = "slot-number";
        number.textContent = String(slot + 1).padStart(2, "0");
        const prompt = document.createElement("span");
        prompt.className = "slot-prompt";
        prompt.textContent = "DROP PART";
        bay.append(number, prompt);
        rack.append(bay);
    }
    elements.rackArea.append(rack);
    state.racks = elements.rackArea.querySelectorAll(":scope > .rack").length;
    elements.rackCount.textContent = `${state.racks} RACK${state.racks === 1 ? "" : "S"}`;
    addLog(`${profile.label} rack ${rackIndex} built with ${profile.slots} open bays.`);
    elements.buildMessage.textContent = `Rack ${rackIndex} is open. Drag parts from the inventory into a bay.`;
    notifyRoom();
    updateDashboard();
}
function addRack() {
    if (elements.rackArea.querySelector(".empty-rack-state")) elements.rackArea.replaceChildren();
    const type = elements.rackType.value;
    renderRack(type);
}
function installPart(type, bay) {
    if (!serverProfiles[type] || partStock[type] < 1) {
        elements.buildMessage.textContent = "That part is out of stock. Choose another inventory item.";
        return false;
    }
    if (!bay || bay.querySelector(".server")) {
        elements.buildMessage.textContent = "That bay is occupied. Choose an empty bay.";
        return false;
    }
    const rack = bay.closest(".rack");
    if (type === "gpu" && rack.dataset.rackType !== "gpu") {
        elements.buildMessage.textContent = "GPU accelerator needs a GPU-ready rack. Build one and drop the GPU there.";
        return false;
    }
    const part = document.createElement("div");
    part.className = `server part-${type}`;
    part.dataset.part = type;
    part.title = serverProfiles[type].label;
    part.setAttribute("aria-label", serverProfiles[type].label);
    const label = document.createElement("span");
    label.className = "part-label";
    label.textContent = serverProfiles[type].label;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-part";
    remove.textContent = "×";
    remove.title = `Remove ${serverProfiles[type].label}`;
    remove.setAttribute("aria-label", `Remove ${serverProfiles[type].label} from rack`);
    part.append(label, remove);
    bay.replaceChildren(part);
    bay.classList.add("occupied");
    bay.setAttribute("aria-label", `Rack ${rack.dataset.rackIndex}, bay ${Number(bay.dataset.slot) + 1}, ${serverProfiles[type].label}.`);
    partStock[type]--;
    placedParts[type]++;
    state.servers.push(type);
    elements.buildMessage.textContent = `${serverProfiles[type].label} installed in Rack ${rack.dataset.rackIndex}, bay ${Number(bay.dataset.slot) + 1}.`;
    addLog(`${serverProfiles[type].label} installed in Rack ${rack.dataset.rackIndex}.`);
    updateInventory();
    notifyRoom();
    updateDashboard();
    return true;
}
function removePart(part) {
    const type = part.dataset.part;
    const bay = part.closest(".rack-slot");
    if (!type || !bay) return;
    partStock[type]++;
    placedParts[type] = Math.max(0, placedParts[type] - 1);
    const index = state.servers.indexOf(type);
    if (index >= 0) state.servers.splice(index, 1);
    const number = document.createElement("span");
    number.className = "slot-number";
    number.textContent = String(Number(bay.dataset.slot) + 1).padStart(2, "0");
    const prompt = document.createElement("span");
    prompt.className = "slot-prompt";
    prompt.textContent = "DROP PART";
    bay.replaceChildren(number, prompt);
    bay.classList.remove("occupied");
    const rack = bay.closest(".rack");
    bay.setAttribute("aria-label", `Rack ${rack.dataset.rackIndex}, bay ${Number(bay.dataset.slot) + 1}, empty. Select a part or drag one here.`);
    addLog(`${serverProfiles[type].label} removed from Rack ${rack.dataset.rackIndex}.`);
    updateInventory();
    notifyRoom();
    updateDashboard();
}
function updateRackTypeHelp() {
    const descriptions = { standard: "A balanced rack for general-purpose servers.", gpu: "Reinforced power and cooling for GPU accelerators.", dense: "More bays in a taller frame; supports up to 12 parts." };
    document.getElementById("rackTypeHelp").textContent = descriptions[elements.rackType.value];
}
function updateDashboard() {
    const totals = state.servers.reduce((sum, type) => {
        const profile = serverProfiles[type];
        if (!profile) return sum;
        sum.cpu += profile.cpu; sum.memory += profile.memory; sum.storage += profile.storage;
        return sum;
    }, { cpu: 0, memory: 0, storage: 0 });
    const servers = serverParts();
    const cpu = Math.min(totals.cpu, 100), memory = Math.min(totals.memory, 128), storage = totals.storage;
    const customers = state.deployed ? 1000 + servers.length * 250 : 0;
    elements.cpuValue.textContent = `${cpu}%`;
    elements.memoryValue.textContent = `${memory} GB`;
    elements.storageValue.textContent = `${storage} TB`;
    elements.customersValue.textContent = customers.toLocaleString();
    elements.cpuMeter.style.width = `${cpu}%`;
    elements.memoryMeter.style.width = `${(memory / 128) * 100}%`;
    elements.storageMeter.style.width = `${Math.min(storage * 2, 100)}%`;
    elements.customersMeter.style.width = `${Math.min(customers / 50, 100)}%`;
    const online = state.racks > 0 && servers.length > 0;
    elements.systemStatus.classList.toggle("online", online);
    elements.systemStatus.innerHTML = `<span class="status-dot"></span>${online ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}`;
    if (state.cooling) elements.deployMessage.textContent = "Cooling active. Temperature nominal.";
    else if (servers.length > 4) elements.deployMessage.textContent = "Warning: cooling recommended for this server load.";
}
function deployWebsite() {
    const servers = serverParts().map(part => part.dataset.part);
    if (servers.length < 2) {
        elements.deployMessage.textContent = "Install at least 2 servers, including a Web server, before deployment.";
        addLog("Deployment denied: at least two servers are required."); return;
    }
    if (!servers.includes("web")) {
        elements.deployMessage.textContent = "Install a Web server to host your site.";
        addLog("Deployment denied: Web server missing."); return;
    }
    state.deployed = true;
    elements.serviceStatus.textContent = "ONLINE";
    elements.serviceStatus.classList.add("online");
    elements.deployMessage.textContent = "Website deployed across your server cluster.";
    addLog("Website deployed successfully."); updateDashboard();
}
function runBackup() {
    if (!serverParts().some(part => part.dataset.part === "backup")) {
        elements.deployMessage.textContent = "Backup denied: install a Backup server first.";
        addLog("Backup denied: no Backup server detected."); return;
    }
    state.backupComplete = true;
    elements.deployMessage.textContent = "Backup snapshot completed successfully.";
    addLog("Disaster recovery snapshot completed.");
}
function simulateAttack() {
    if (!state.firewall) {
        state.deployed = false;
        elements.serviceStatus.textContent = "COMPROMISED";
        elements.serviceStatus.classList.remove("online");
        elements.attackStatus.innerHTML = "<span class='danger'>DDoS attack succeeded.</span>";
        elements.threatLevel.textContent = "CRITICAL";
        elements.threatLevel.className = "threat-level danger";
        addLog("ALERT: simulated DDoS traffic overwhelmed defenses."); updateDashboard();
    } else {
        elements.attackStatus.innerHTML = "<span class='success'>Attack blocked by firewall.</span>";
        elements.threatLevel.textContent = "BLOCKED";
        elements.threatLevel.className = "threat-level";
        addLog("Firewall blocked simulated DDoS traffic.");
    }
}

document.getElementById("addRackBtn").addEventListener("click", addRack);
elements.rackType.addEventListener("change", updateRackTypeHelp);
document.getElementById("deployBtn").addEventListener("click", deployWebsite);
document.getElementById("backupBtn").addEventListener("click", runBackup);
document.getElementById("attackBtn").addEventListener("click", simulateAttack);

elements.partInventory.addEventListener("click", event => {
    const card = event.target.closest(".part-card");
    if (card) selectPart(card.dataset.part);
});
elements.partInventory.addEventListener("dragstart", event => {
    const card = event.target.closest(".part-card");
    if (!card || partStock[card.dataset.part] < 1) { event.preventDefault(); return; }
    event.dataTransfer.setData("application/x-simunet-part", card.dataset.part);
    event.dataTransfer.effectAllowed = "copy";
    selectPart(card.dataset.part);
});
elements.rackArea.addEventListener("dragover", event => {
    if (event.target.closest(".rack-slot")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }
});
elements.rackArea.addEventListener("drop", event => {
    const bay = event.target.closest(".rack-slot");
    if (!bay) return;
    event.preventDefault();
    const type = event.dataTransfer.getData("application/x-simunet-part") || selectedPart;
    if (type) installPart(type, bay);
});
elements.rackArea.addEventListener("click", event => {
    const remove = event.target.closest(".remove-part");
    if (remove) { removePart(remove.closest(".server")); return; }
    const bay = event.target.closest(".rack-slot");
    if (!bay) return;
    if (selectedPart) installPart(selectedPart, bay);
    else if (bay.querySelector(".server")) elements.buildMessage.textContent = "Select a hardware part, or use × to remove the installed part.";
});
elements.rackArea.addEventListener("keydown", event => {
    const bay = event.target.closest(".rack-slot");
    if (bay && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); if (selectedPart) installPart(selectedPart, bay); }
});
elements.cooling.addEventListener("change", () => { state.cooling = elements.cooling.checked; addLog(state.cooling ? "Cooling systems activated." : "Cooling systems disabled."); updateDashboard(); notifyRoom(); });
elements.ups.addEventListener("change", () => { state.ups = elements.ups.checked; addLog(state.ups ? "UPS backup power enabled." : "UPS backup power disabled."); notifyRoom(); });
elements.firewall.addEventListener("change", () => { state.firewall = elements.firewall.checked; addLog(state.firewall ? "Firewall rules activated." : "Firewall rules disabled."); });
document.getElementById("clearLogBtn").addEventListener("click", () => { elements.eventLog.replaceChildren(); addLog("Operations log cleared."); });
window.addEventListener("simunet:hardware-change", () => { /* event hook for the 3D room module */ });
updateRackTypeHelp(); updateInventory(); updateDashboard();
