const state = {
    racks: 0, cooling: false, ups: false, firewall: false, deployed: false,
    paused: false, tick: 0, temp: 22, health: 100, customers: 0,
    liveTicks: 0, upTicks: 0, downUntil: 0, lastBackupTick: null,
    incidents: 0, handled: 0, spikeUntil: 0, nextIncidentTick: 0, capacityAlert: null
};
const TICK_MS = 2000;
const BACKUP_FRESH_TICKS = 30;
const profiles = {
    web: { label: "Web server", cpu: 12, memory: 8, storage: 2, kind: "server", kw: 0.5 },
    database: { label: "Database server", cpu: 18, memory: 16, storage: 8, kind: "server", kw: 0.5 },
    storage: { label: "Storage server", cpu: 8, memory: 8, storage: 20, kind: "server", kw: 0.5 },
    backup: { label: "Backup server", cpu: 6, memory: 4, storage: 25, kind: "server", kw: 0.5 },
    auth: { label: "Authentication server", cpu: 10, memory: 8, storage: 3, kind: "server", kw: 0.5 },
    gpu: { label: "GPU accelerator", cpu: 0, memory: 16, storage: 0, kind: "accelerator", kw: 0.7 },
    switch: { label: "Network switch", cpu: 0, memory: 0, storage: 0, kind: "network", kw: 0.15 },
    router: { label: "Router", cpu: 0, memory: 0, storage: 0, kind: "network", kw: 0.15 },
    loadbalancer: { label: "Load balancer", cpu: 2, memory: 2, storage: 0, kind: "network", kw: 0.2 }
};
const stock = { web: 6, database: 4, storage: 4, backup: 3, auth: 3, gpu: 4, switch: 3, router: 2, loadbalancer: 2 };
const racks = { standard: { label: "Standard", slots: 9 }, gpu: { label: "GPU-ready", slots: 9 }, dense: { label: "High-density", slots: 12 } };
const $ = id => document.getElementById(id);
const rackArea = $("rackArea");
const inventory = $("partInventory");
const buildMessage = $("buildMessage");
let selectedPart = null;
let draggedPart = null;

function log(message, tone = "") {
    const logArea = $("eventLog");
    if (!logArea) return;
    const line = document.createElement("p");
    if (tone) line.className = `log-${tone}`;
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
function installedParts() {
    return [...rackArea.querySelectorAll(".rack-slot > .server")].map(part => part.dataset.part).filter(type => profiles[type]);
}
function countOf(parts, type) { return parts.filter(part => part === type).length; }
function serverParts(parts) { return parts.filter(type => profiles[type].kind === "server"); }
function meetsDeployRequirements(parts) {
    const servers = serverParts(parts);
    return servers.length >= 2 && servers.includes("web");
}
function rackOverhead() { return Math.max(0, state.racks - 3) * 10; }
function itLoadKw(parts) { return parts.reduce((sum, type) => sum + profiles[type].kw, 0); }
function powerDrawKw(parts) {
    const it = itLoadKw(parts);
    const cooling = state.cooling ? it * 0.3 : 0;
    return (it + cooling) * (1 + rackOverhead() / 100);
}
// Customers one cluster can serve: web servers do the serving, databases and
// load balancers raise how much each web server can handle.
function capacity(parts) {
    const web = countOf(parts, "web");
    if (!web) return 0;
    const dbBoost = 1 + Math.min(countOf(parts, "database"), 2) * 0.25;
    const lbBoost = countOf(parts, "loadbalancer") && web >= 2 ? 1.4 : 1;
    return Math.round(web * 900 * dbBoost * lbBoost);
}
function isDown() { return state.tick < state.downUntil; }
function setTone(element, tone) {
    element.classList.remove("is-good", "is-warning", "is-danger");
    if (tone) element.classList.add(`is-${tone}`);
}
function setBanner(message, tone = "") {
    const banner = $("incidentBanner");
    banner.textContent = message;
    setTone(banner, tone);
}

function updateDashboard() {
    if (!rackArea) return;
    const parts = installedParts();
    const servers = serverParts(parts);
    const total = parts.reduce((sum, type) => {
        const profile = profiles[type];
        sum.cpu += profile.cpu; sum.memory += profile.memory; sum.storage += profile.storage;
        return sum;
    }, { cpu: 0, memory: 0, storage: 0 });

    // Taking away required hardware takes the site offline.
    if (state.deployed && !meetsDeployRequirements(parts)) {
        state.deployed = false;
        state.customers = 0;
        $("serviceStatus").textContent = "OFFLINE";
        $("serviceStatus").classList.remove("online");
        $("deployMessage").textContent = "Website went offline: it needs a Web server and another server.";
        setBanner("Service offline. Reinstall the required servers and deploy again.", "danger");
        log("Website offline: required servers were removed.", "danger");
    }

    const cap = capacity(parts);
    const idleCpu = Math.min(total.cpu, 100);
    const load = state.deployed && cap ? state.customers / cap : 0;
    const cpu = state.deployed ? Math.min(100, Math.round(10 + load * 85)) : idleCpu;
    const memory = Math.min(total.memory, 128);
    $("cpuValue").textContent = `${cpu}%`;
    $("memoryValue").textContent = `${memory} GB`;
    $("storageValue").textContent = `${total.storage} TB`;
    $("customersValue").textContent = state.customers.toLocaleString();
    $("cpuMeter").style.width = `${cpu}%`;
    $("cpuMeter").className = cpu >= 95 ? "is-danger" : cpu >= 80 ? "is-warning" : "";
    $("memoryMeter").style.width = `${memory / 128 * 100}%`;
    $("storageMeter").style.width = `${Math.min(total.storage * 2, 100)}%`;
    $("customersMeter").style.width = `${Math.min(state.customers / 100, 100)}%`;

    const temp = Math.round(state.temp);
    const tempTone = temp >= 42 ? "danger" : temp >= 35 ? "warning" : "";
    $("tempValue").textContent = `${temp}°C`;
    $("tempMeter").style.width = `${Math.min(Math.max((temp - 18) / 32 * 100, 0), 100)}%`;
    $("tempMeter").className = tempTone ? `is-${tempTone}` : "";
    setTone($("tempPanel"), tempTone);
    $("tempNote").textContent = tempTone === "danger" ? "Overheating! Servers are failing. Turn on cooling."
        : tempTone === "warning" ? "Running hot. Cooling is recommended."
        : state.cooling ? "Cooling active. Temperature nominal." : "Safe range is below 35°C.";

    const overhead = rackOverhead();
    const kw = powerDrawKw(parts);
    $("powerValue").textContent = `${kw.toFixed(1)} kW`;
    $("powerMeter").style.width = `${Math.min(kw / 15 * 100, 100)}%`;
    $("powerMeter").className = overhead ? "is-warning" : "";
    setTone($("powerPanel"), overhead ? "warning" : "");
    $("powerNote").textContent = overhead
        ? `+${overhead}% rack overhead from ${state.racks} racks. Remove unused racks to save power.`
        : `${state.racks} rack${state.racks === 1 ? "" : "s"}. Each rack after three adds 10% overhead.`;

    const online = state.deployed && !isDown();
    const status = $("systemStatus");
    const degraded = online && (state.health < 60 || tempTone === "danger" || cpu >= 95);
    status.classList.toggle("online", online);
    status.innerHTML = `<span class="status-dot"></span>${!state.deployed ? (servers.length ? "SYSTEM STANDBY" : "SYSTEM OFFLINE") : isDown() ? "SERVICE DOWN" : degraded ? "SYSTEM DEGRADED" : "SYSTEM ONLINE"}`;
    $("serviceStatus").textContent = !state.deployed ? "OFFLINE" : isDown() ? "DOWN" : "ONLINE";
    $("serviceStatus").classList.toggle("online", online);

    const health = $("healthValue");
    health.textContent = state.deployed ? `${Math.round(state.health)}%` : "—";
    setTone(health, !state.deployed ? "" : state.health < 40 ? "danger" : state.health < 70 ? "warning" : "good");
    $("uptimeValue").textContent = state.liveTicks ? `${(state.upTicks / state.liveTicks * 100).toFixed(1)}%` : "—";
    $("incidentsValue").textContent = `${state.handled} / ${state.incidents}`;
    $("backupValue").textContent = state.lastBackupTick === null ? "Never"
        : backupIsFresh() ? `${Math.round((state.tick - state.lastBackupTick) * TICK_MS / 1000)}s ago` : "Out of date";
    setTone($("backupValue"), state.lastBackupTick === null ? "" : backupIsFresh() ? "good" : "warning");

    updateMissions(parts);
}
function backupIsFresh() {
    return state.lastBackupTick !== null && state.tick - state.lastBackupTick <= BACKUP_FRESH_TICKS;
}

// ---------- Incidents ----------
function damage(amount, customerLoss, downTicks = 0) {
    state.health = Math.max(0, state.health - amount);
    state.customers = Math.round(state.customers * (1 - customerLoss));
    if (downTicks) state.downUntil = Math.max(state.downUntil, state.tick + downTicks);
}
function resolve(handled, message) {
    state.incidents++;
    if (handled) state.handled++;
    setBanner(message, handled ? "good" : "danger");
    log(message, handled ? "good" : "danger");
}
const incidents = {
    outage() {
        if (state.ups) return resolve(true, "Power outage! The UPS kept every server running until grid power returned.");
        damage(15, 0.1, 3);
        resolve(false, "Power outage! With no UPS, every server lost power. The site is down while it reboots. Enable UPS backup power.");
    },
    ddos() {
        const parts = installedParts();
        const lb = countOf(parts, "loadbalancer") > 0;
        if (state.firewall && lb) return resolve(true, "Traffic flood (DDoS) attack! The firewall dropped the bad traffic and the load balancer spread the rest.");
        if (state.firewall) { damage(5, 0.03); return resolve(true, "Traffic flood (DDoS) attack! The firewall blocked most of it, but some pages were slow. A load balancer would help."); }
        damage(20, 0.15, 2);
        resolve(false, "Traffic flood (DDoS) attack! With no firewall, the servers were overwhelmed and the site went down. Enable the firewall.");
    },
    bruteforce() {
        const auth = countOf(installedParts(), "auth") > 0;
        if (auth && state.firewall) return resolve(true, "Password attack! The Auth server locked the targeted accounts and the firewall blocked the attacker.");
        if (auth) { damage(4, 0.02); return resolve(true, "Password attack! The Auth server locked the targeted accounts. A firewall would block the attacker too."); }
        damage(12, 0.12);
        resolve(false, "Password attack! Without an Auth server, attackers guessed customer passwords. Install an Auth server.");
    },
    disk() {
        const hasBackup = countOf(installedParts(), "backup") > 0;
        if (hasBackup && backupIsFresh()) return resolve(true, "Disk failure! Data was restored from your recent backup. No customer data lost.");
        if (hasBackup) { damage(10, 0.06); return resolve(false, "Disk failure! Your backup was out of date, so recent data was lost. Run backups regularly."); }
        damage(18, 0.15);
        resolve(false, "Disk failure! There was no Backup server, so customer data was lost. Install one and run backups.");
    },
    spike() {
        state.spikeUntil = state.tick + 6;
        const lb = countOf(installedParts(), "loadbalancer") > 0;
        state.incidents++;
        state.handled++;
        const message = lb ? "Viral traffic spike! The load balancer is spreading thousands of new visitors across your web servers."
            : "Viral traffic spike! Thousands of new visitors are arriving. Watch CPU, and add web servers or a load balancer.";
        setBanner(message, "warning");
        log(message, "warning");
    }
};
function triggerIncident(type) {
    if (!state.deployed) {
        setBanner("Deploy your website before running a drill.", "warning");
        return;
    }
    incidents[type]();
    updateDashboard();
}

// ---------- Simulation loop ----------
function simulate() {
    if (state.paused) return;
    state.tick++;
    const parts = installedParts();
    const it = itLoadKw(parts);
    const target = 22 + it * (state.cooling ? 1.2 : 6);
    state.temp += (target - state.temp) * 0.25;

    if (state.deployed) {
        state.liveTicks++;
        const cap = capacity(parts);
        if (!isDown()) {
            state.upTicks++;
            const growth = 60 + Math.random() * 120 + (state.tick < state.spikeUntil ? 900 : 0);
            state.customers += Math.round(growth * (state.health / 100));
        }
        if (state.temp >= 42) {
            damage(5, 0.02);
            if (state.tick % 5 === 0) log(`Overheating at ${Math.round(state.temp)}°C. Servers are throttling. Turn on cooling.`, "danger");
        }
        let overloaded = false;
        if (cap && state.customers > cap) {
            // A sudden surge well past capacity hurts; otherwise growth just stalls.
            overloaded = state.customers > cap * 1.1;
            if (overloaded) state.health = Math.max(0, state.health - 3);
            state.customers = cap;
            const level = overloaded ? "overloaded" : "full";
            if (state.capacityAlert !== level) log(overloaded ? "Overloaded: pages are timing out and visitors are leaving. Add Web servers or a Load balancer." : "At capacity: no room for new customers. Add Web servers, a Database, or a Load balancer to grow.", "warning");
            state.capacityAlert = level;
        } else {
            state.capacityAlert = null;
        }
        if (state.temp < 35 && !overloaded && !isDown()) state.health = Math.min(100, state.health + 1);
        if (state.tick >= state.nextIncidentTick) {
            const types = Object.keys(incidents);
            incidents[types[Math.floor(Math.random() * types.length)]]();
            state.nextIncidentTick = state.tick + 12 + Math.floor(Math.random() * 12);
        }
        if (state.health <= 0) {
            state.deployed = false;
            state.customers = 0;
            state.health = 100;
            $("deployMessage").textContent = "The service crashed after too much damage. Fix the weak spots and deploy again.";
            setBanner("Service crashed. Check the operations log to see what went wrong, then redeploy.", "danger");
            log("Service crashed: health reached 0%.", "danger");
        }
    }
    updateDashboard();
}

// ---------- Missions ----------
const missions = [
    { id: "rack", title: "Build a rack", detail: "Choose a frame and build it.", check: () => state.racks > 0 },
    { id: "servers", title: "Install the essentials", detail: "A Web server plus one more server.", check: parts => meetsDeployRequirements(parts) },
    { id: "deploy", title: "Go live", detail: "Deploy your website.", check: () => state.deployed },
    { id: "cool", title: "Stay cool", detail: "Run 3+ servers with cooling below 35°C.", check: parts => serverParts(parts).length >= 3 && state.cooling && state.temp < 35 },
    { id: "protect", title: "Lock it down", detail: "Enable UPS and the firewall, and install an Auth server.", check: parts => state.ups && state.firewall && parts.includes("auth") },
    { id: "backup", title: "Plan for disaster", detail: "Install a Backup server and run a backup.", check: () => state.lastBackupTick !== null },
    { id: "survive", title: "Weather a storm", detail: "Successfully handle 3 incidents.", check: () => state.handled >= 3 },
    { id: "scale", title: "Scale up", detail: "Serve 5,000 customers at once.", check: () => state.customers >= 5000 }
];
const completedMissions = new Set();
function renderMissions() {
    $("missionList").replaceChildren(...missions.map(mission => {
        const item = document.createElement("li");
        item.dataset.mission = mission.id;
        const title = document.createElement("strong");
        title.textContent = mission.title;
        const wrapper = document.createElement("span");
        wrapper.append(title, document.createTextNode(mission.detail));
        item.append(wrapper);
        return item;
    }));
}
function updateMissions(parts) {
    missions.forEach(mission => {
        if (completedMissions.has(mission.id) || !mission.check(parts)) return;
        completedMissions.add(mission.id);
        log(`Mission complete: ${mission.title}.`, "good");
        if (completedMissions.size === missions.length) log("All missions complete. You're running a resilient cloud!", "good");
    });
    missions.forEach(mission => {
        const item = $("missionList").querySelector(`[data-mission="${mission.id}"]`);
        const done = completedMissions.has(mission.id);
        item.classList.toggle("done", done);
        item.setAttribute("aria-label", `${mission.title}: ${mission.detail} ${done ? "Complete." : "Not complete."}`);
    });
    $("missionProgress").textContent = `${completedMissions.size} / ${missions.length} COMPLETE`;
}

// ---------- Controls ----------
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
    const parts = installedParts();
    const servers = serverParts(parts);
    if (!meetsDeployRequirements(parts)) {
        $("deployMessage").textContent = servers.includes("web") ? "Install at least one more server before deployment." : "Install a Web server and another server before deployment.";
        log("Deployment requirements are not met.", "warning");
        return;
    }
    if (state.deployed) {
        $("deployMessage").textContent = "Your website is already live. Keep it healthy!";
        return;
    }
    state.deployed = true;
    state.health = 100;
    state.customers = 200;
    state.downUntil = 0;
    state.nextIncidentTick = state.tick + 8;
    $("deployMessage").textContent = "Website deployed across your server cluster. Customers are arriving.";
    setBanner("Live! Customers are arriving. Watch temperature and capacity, and be ready for incidents.", "good");
    log("Website deployed successfully.", "good");
    updateDashboard();
});
$("backupBtn").addEventListener("click", () => {
    if (!rackArea.querySelector('.server[data-part="backup"]')) {
        $("deployMessage").textContent = "Install a Backup server first.";
        return;
    }
    state.lastBackupTick = state.tick;
    $("deployMessage").textContent = "Backup snapshot completed successfully.";
    log("Disaster recovery snapshot completed.", "good");
    updateDashboard();
});
$("pauseBtn").addEventListener("click", () => {
    state.paused = !state.paused;
    $("pauseBtn").textContent = state.paused ? "RESUME" : "PAUSE";
    $("pauseBtn").setAttribute("aria-pressed", String(state.paused));
    log(state.paused ? "Simulation paused." : "Simulation resumed.");
});
$("drillBtn").addEventListener("click", () => triggerIncident($("drillType").value));
$("clearLogBtn").addEventListener("click", () => { $("eventLog").replaceChildren(); log("Operations log cleared."); });
$("coolingToggle").addEventListener("change", event => { state.cooling = event.target.checked; log(state.cooling ? "Cooling systems activated." : "Cooling systems disabled."); updateDashboard(); notifyRoom(); });
$("upsToggle").addEventListener("change", event => { state.ups = event.target.checked; log(state.ups ? "UPS backup power enabled." : "UPS backup power disabled."); updateDashboard(); notifyRoom(); });
$("firewallToggle").addEventListener("change", event => { state.firewall = event.target.checked; log(state.firewall ? "Firewall enabled." : "Firewall disabled."); updateDashboard(); });

renderMissions();
refreshInventory();
updateDashboard();
setInterval(simulate, TICK_MS);
