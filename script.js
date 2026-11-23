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
    web: { label: "Web", cpu: 12, memory: 8, storage: 2 },
    database: { label: "Database", cpu: 18, memory: 16, storage: 8 },
    storage: { label: "Storage", cpu: 8, memory: 8, storage: 20 },
    backup: { label: "Backup", cpu: 6, memory: 4, storage: 25 },
    auth: { label: "Auth", cpu: 10, memory: 8, storage: 3 }
};

const elements = {
    rackArea: document.getElementById("rackArea"),
    rackCount: document.getElementById("rackCount"),
    serverType: document.getElementById("serverType"),
    cooling: document.getElementById("coolingToggle"),
    ups: document.getElementById("upsToggle"),
    firewall: document.getElementById("firewallToggle"),
    cpuValue: document.getElementById("cpuValue"),
    memoryValue: document.getElementById("memoryValue"),
    storageValue: document.getElementById("storageValue"),
    customersValue: document.getElementById("customersValue"),
    cpuMeter: document.getElementById("cpuMeter"),
    memoryMeter: document.getElementById("memoryMeter"),
    storageMeter: document.getElementById("storageMeter"),
    customersMeter: document.getElementById("customersMeter"),
    systemStatus: document.getElementById("systemStatus"),
    serviceStatus: document.getElementById("serviceStatus"),
    deployMessage: document.getElementById("deployMessage"),
    attackStatus: document.getElementById("attackStatus"),
    threatLevel: document.getElementById("threatLevel"),
    eventLog: document.getElementById("eventLog")
};

function timeStamp() {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function addLog(message) {
    const entry = document.createElement("p");
    entry.innerHTML = `<span>${timeStamp()}</span> ${message}`;
    elements.eventLog.appendChild(entry);
    elements.eventLog.scrollTop = elements.eventLog.scrollHeight;
}

function addRack() {
    state.racks++;

    if (elements.rackArea.querySelector(".empty-rack-state")) {
        elements.rackArea.innerHTML = "";
    }

    const rack = document.createElement("div");
    rack.className = "rack";
    rack.dataset.rack = String(state.racks);
    rack.setAttribute("aria-label", `Server rack ${state.racks}`);
    elements.rackArea.appendChild(rack);

    elements.rackCount.textContent = `${state.racks} RACK${state.racks === 1 ? "" : "S"}`;
    addLog(`Rack ${state.racks} mounted in facility A-01.`);
    updateDashboard();
}

function installServer() {
    if (state.racks === 0) {
        addLog("Hardware rejected: add a rack first.");
        elements.deployMessage.textContent = "Build a rack before installing hardware.";
        return;
    }

    const racks = elements.rackArea.querySelectorAll(".rack");
    if (!racks.length) return;

    const type = elements.serverType.value;
    const server = document.createElement("div");
    server.className = `server ${type}`;
    server.title = `${serverProfiles[type].label} Server`;

    let targetRack = racks[0];
    let smallestCount = targetRack.querySelectorAll(".server").length;

    racks.forEach((rack) => {
        const count = rack.querySelectorAll(".server").length;
        if (count < smallestCount) {
            smallestCount = count;
            targetRack = rack;
        }
    });

    if (smallestCount >= 9) {
        addLog("Rack capacity reached. Add another rack.");
        return;
    }

    targetRack.appendChild(server);
    state.servers.push(type);
    addLog(`${serverProfiles[type].label} server installed.`);
    updateDashboard();
}

function updateDashboard() {
    const totals = state.servers.reduce((sum, type) => {
        const profile = serverProfiles[type];
        sum.cpu += profile.cpu;
        sum.memory += profile.memory;
        sum.storage += profile.storage;
        return sum;
    }, { cpu: 0, memory: 0, storage: 0 });

    const cpu = Math.min(totals.cpu, 100);
    const memory = Math.min(totals.memory, 128);
    const storage = totals.storage;
    const customers = state.deployed ? 1000 + state.servers.length * 250 : 0;

    elements.cpuValue.textContent = `${cpu}%`;
    elements.memoryValue.textContent = `${memory} GB`;
    elements.storageValue.textContent = `${storage} TB`;
    elements.customersValue.textContent = customers.toLocaleString();

    elements.cpuMeter.style.width = `${cpu}%`;
    elements.memoryMeter.style.width = `${(memory / 128) * 100}%`;
    elements.storageMeter.style.width = `${Math.min(storage * 2, 100)}%`;
    elements.customersMeter.style.width = `${Math.min(customers / 50, 100)}%`;

    if (state.cooling) {
        elements.deployMessage.textContent = "Cooling active. Temperature nominal.";
    } else if (state.servers.length > 4) {
        elements.deployMessage.textContent = "Warning: cooling required for this load.";
    }

    const online = state.racks > 0 && state.servers.length > 0;
    elements.systemStatus.classList.toggle("online", online);
    elements.systemStatus.innerHTML = `<span class="status-dot"></span>${online ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}`;
}

function deployWebsite() {
    if (state.servers.length < 2) {
        elements.deployMessage.textContent = "Deployment denied: at least 2 servers required.";
        addLog("Deployment denied: minimum server count not met.");
        return;
    }

    const hasWebServer = state.servers.includes("web");
    if (!hasWebServer) {
        elements.deployMessage.textContent = "Deployment denied: install a web server.";
        addLog("Deployment denied: web server profile missing.");
        return;
    }

    state.deployed = true;
    elements.serviceStatus.textContent = "ONLINE";
    elements.serviceStatus.classList.add("online");
    elements.deployMessage.textContent = "Website deployed across the compute cluster.";
    addLog("Website deployed successfully.");
    updateDashboard();
}

function runBackup() {
    if (!state.servers.includes("backup")) {
        elements.deployMessage.textContent = "Backup denied: install a backup server.";
        addLog("Backup denied: no backup server detected.");
        return;
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
        addLog("ALERT: DDoS attack penetrated network defenses.");
        updateDashboard();
    } else {
        elements.attackStatus.innerHTML = "<span class='success'>Attack blocked by firewall.</span>";
        elements.threatLevel.textContent = "BLOCKED";
        elements.threatLevel.className = "threat-level";
        addLog("Firewall blocked simulated DDoS traffic.");
    }
}

document.getElementById("addRackBtn").addEventListener("click", addRack);
document.getElementById("installServerBtn").addEventListener("click", installServer);
document.getElementById("deployBtn").addEventListener("click", deployWebsite);
document.getElementById("backupBtn").addEventListener("click", runBackup);
document.getElementById("attackBtn").addEventListener("click", simulateAttack);

elements.cooling.addEventListener("change", () => {
    state.cooling = elements.cooling.checked;
    addLog(state.cooling ? "Cooling systems activated." : "Cooling systems disabled.");
    updateDashboard();
});

elements.ups.addEventListener("change", () => {
    state.ups = elements.ups.checked;
    addLog(state.ups ? "UPS backup power enabled." : "UPS backup power disabled.");
});

elements.firewall.addEventListener("change", () => {
    state.firewall = elements.firewall.checked;
    addLog(state.firewall ? "Firewall rules activated." : "Firewall rules disabled.");
});

document.getElementById("clearLogBtn").addEventListener("click", () => {
    elements.eventLog.innerHTML = "";
    addLog("Operations log cleared.");
});
