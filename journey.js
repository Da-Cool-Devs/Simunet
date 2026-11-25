const stages = [...document.querySelectorAll(".journey-stage")];
const journeySteps = [...document.querySelectorAll("[data-journey-step]")];
const progress = document.getElementById("journeyProgress");
const progressBar = document.getElementById("journeyProgressBar");
const stepLabel = document.getElementById("journeyStepLabel");
const announcement = document.getElementById("journeyAnnouncement");
const backButton = document.getElementById("journeyBack");
const nextButton = document.getElementById("journeyNext");
const uploadVisual = document.getElementById("uploadVisual");
const settingStorageKey = "simunet.journey.settings";
const settings = { speed: "normal", autoAdvance: true, ambientMotion: true, labels: true };
let currentStep = 0;
let isAdvancing = false;
let advanceTimer = null;

// Scene 3 demonstrates server-side defense: the server checks incoming requests,
// rejects suspicious traffic, and continues serving legitimate requests.
const defenseStage = stages[2];
if (defenseStage) {
    defenseStage.innerHTML = `
        <p class="section-code">SERVER / DEFENSE</p>
        <h2 id="journeyStageTitle3">3. See how a server stops hackers</h2>
        <p>A server checks incoming requests. Suspicious traffic is rejected, while legitimate visitors can still reach the service. Scene 5 shows how a firewall adds another layer of protection.</p>
        <div class="server-defense" id="networkRoute" aria-label="A server blocks suspicious traffic and lets a trusted request through">
            <div class="defense-traffic defense-suspicious"><span class="traffic-symbol" aria-hidden="true">!</span><strong>Suspicious request</strong><small>Unknown source</small></div>
            <div class="defense-traffic defense-trusted"><span class="traffic-symbol" aria-hidden="true">✓</span><strong>Trusted request</strong><small>Allowed visitor</small></div>
            <div class="defense-server"><span class="server-shield" aria-hidden="true">⬡</span><strong>WEB SERVER</strong><small class="server-check-status" id="serverCheckStatus">Waiting for requests</small><div class="server-indicators" aria-hidden="true"><i></i><i></i><i></i></div></div>
            <div class="defense-result defense-blocked" id="blockedResult"><span aria-hidden="true">×</span><strong>BLOCKED</strong></div>
            <div class="defense-result defense-served" id="servedResult"><span aria-hidden="true">✓</span><strong>SERVICE REACHED</strong></div>
        </div>
        <button id="routeAction" class="primary-button" type="button">Check incoming requests</button>
        <p id="routeFeedback" class="journey-feedback" role="status"></p>`;
    if (journeySteps[2]) journeySteps[2].innerHTML = "<span>03</span> Server defense";
    const defenseStyles = document.createElement("link");
    defenseStyles.rel = "stylesheet";
    defenseStyles.href = "css/journey-defense.css";
    document.head.append(defenseStyles);
}

try {
    const saved = JSON.parse(localStorage.getItem(settingStorageKey) || "{}");
    if (["slow", "normal", "fast"].includes(saved.speed)) settings.speed = saved.speed;
    for (const key of ["autoAdvance", "ambientMotion", "labels"]) {
        if (typeof saved[key] === "boolean") settings[key] = saved[key];
    }
} catch (_) { /* Use defaults if local storage is unavailable or invalid. */ }

const speedControl = document.getElementById("journeySpeed");
const autoAdvanceControl = document.getElementById("journeyAutoAdvance");
const ambientMotionControl = document.getElementById("journeyAmbientMotion");
const labelsControl = document.getElementById("journeyLabels");

function saveSettings() {
    try { localStorage.setItem(settingStorageKey, JSON.stringify(settings)); } catch (_) { /* Settings still work for this visit. */ }
    if (speedControl) speedControl.value = settings.speed;
    if (autoAdvanceControl) autoAdvanceControl.checked = settings.autoAdvance;
    if (ambientMotionControl) ambientMotionControl.checked = settings.ambientMotion;
    if (labelsControl) labelsControl.checked = settings.labels;
    if (uploadVisual) {
        uploadVisual.dataset.speed = settings.speed;
        uploadVisual.classList.toggle("motion-paused", !settings.ambientMotion);
        uploadVisual.classList.toggle("labels-hidden", !settings.labels);
    }
}

function showStep(step) {
    currentStep = Math.max(0, Math.min(step, stages.length - 1));
    stages.forEach((stage, index) => { stage.hidden = index !== currentStep; });
    journeySteps.forEach((item, index) => {
        item.classList.toggle("is-current", index === currentStep);
        item.classList.toggle("is-complete", index < currentStep);
        if (index === currentStep) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
    });
    const percent = Math.round((Math.min(currentStep, 8) / 8) * 100);
    progressBar.style.width = `${percent}%`;
    progress.setAttribute("aria-valuenow", String(percent));
    progress.setAttribute("aria-valuetext", currentStep === 8 ? "Journey complete" : `Step ${currentStep + 1} of 8`);
    stepLabel.textContent = currentStep === 8 ? "COMPLETE" : `STEP ${currentStep + 1} / 8`;
    backButton.disabled = currentStep === 0;
    nextButton.hidden = true;
    announcement.textContent = currentStep === 8
        ? "Journey complete. You can try it again or explore the system simulator."
        : `Step ${currentStep + 1} of 8: ${stages[currentStep].querySelector("h2").textContent}`;
}

function completeStep(feedbackElement, message) {
    if (isAdvancing) return;
    feedbackElement.textContent = message;
    announcement.textContent = message;
    if (!settings.autoAdvance) {
        nextButton.hidden = false;
        announcement.textContent = `${message} Select Continue when you are ready.`;
        return;
    }
    isAdvancing = true;
    const reducedMotion = document.documentElement.dataset.reducedMotion === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    advanceTimer = window.setTimeout(() => {
        isAdvancing = false;
        advanceTimer = null;
        showStep(currentStep + 1);
    }, reducedMotion ? 0 : 650);
}

if (speedControl) speedControl.addEventListener("change", () => { settings.speed = speedControl.value; saveSettings(); });
if (autoAdvanceControl) autoAdvanceControl.addEventListener("change", () => { settings.autoAdvance = autoAdvanceControl.checked; saveSettings(); });
if (ambientMotionControl) ambientMotionControl.addEventListener("change", () => { settings.ambientMotion = ambientMotionControl.checked; saveSettings(); });
if (labelsControl) labelsControl.addEventListener("change", () => { settings.labels = labelsControl.checked; saveSettings(); });

document.getElementById("uploadAction").addEventListener("click", () => {
    uploadVisual.classList.remove("is-uploaded");
    void uploadVisual.offsetWidth;
    uploadVisual.classList.add("is-uploaded");
    completeStep(document.getElementById("uploadFeedback"), "Upload complete. Your file has reached the cloud data center.");
});
document.getElementById("packetAction").addEventListener("click", () => {
    document.getElementById("packetVisual").classList.add("is-split");
    completeStep(document.getElementById("packetFeedback"), "The file is now represented as packets ready to travel across the network.");
});
document.getElementById("routeAction").addEventListener("click", () => {
    const defenseScene = document.getElementById("serverCheckStatus");
    if (defenseScene) {
        document.getElementById("networkRoute").classList.add("is-routed");
        defenseScene.textContent = "Suspicious request blocked · trusted request served";
        completeStep(document.getElementById("routeFeedback"), "The server rejected the suspicious request and continued serving the trusted visitor.");
        return;
    }
    document.getElementById("networkRoute").classList.add("is-routed");
    completeStep(document.getElementById("routeFeedback"), "The packets reached the cloud data center by passing through network devices.");
});
document.getElementById("encryptAction").addEventListener("click", () => {
    document.getElementById("encryptionVisual").classList.add("is-encrypted");
    document.getElementById("encryptionLabel").textContent = "PROTECTED • 8F3A-21C7";
    completeStep(document.getElementById("encryptFeedback"), "The sample file is now shown as protected data.");
});
document.getElementById("firewallAction").addEventListener("click", () => {
    document.getElementById("firewallVisual").classList.add("is-secure");
    document.getElementById("firewallGateStatus").textContent = "ON";
    completeStep(document.getElementById("firewallFeedback"), "Firewall on. Suspicious traffic is blocked before it reaches the cloud service.");
});
document.getElementById("replicaAction").addEventListener("click", () => {
    document.getElementById("replicaVisual").classList.add("is-replicated");
    document.querySelectorAll("#replicaVisual .replica-node small").forEach((status, index) => { status.textContent = index === 0 ? "MAIN COPY" : "COPY READY"; });
    completeStep(document.getElementById("replicaFeedback"), "Copies are ready on separate servers. Now test what happens if one server fails.");
});
document.querySelectorAll("[data-recovery-choice]").forEach(choice => {
    choice.addEventListener("click", () => {
        const feedback = document.getElementById("recoveryFeedback");
        if (choice.dataset.recoveryChoice === "correct") {
            document.querySelector(".failure-visual").classList.add("is-recovered");
            completeStep(feedback, "Correct. The service can recover the file from another server's replica.");
        } else {
            feedback.textContent = "Not quite. A copy on a different server can be used to recover the file.";
            announcement.textContent = feedback.textContent;
        }
    });
});
document.getElementById("downloadAction").addEventListener("click", () => {
    document.getElementById("downloadVisual").classList.add("is-delivered");
    completeStep(document.getElementById("downloadFeedback"), "Download complete. Your file made it back to your device.");
});
backButton.addEventListener("click", () => {
    if (advanceTimer) window.clearTimeout(advanceTimer);
    advanceTimer = null;
    isAdvancing = false;
    showStep(currentStep - 1);
});
nextButton.addEventListener("click", () => { if (!isAdvancing) showStep(currentStep + 1); });
document.getElementById("journeyRestart").addEventListener("click", () => {
    if (advanceTimer) window.clearTimeout(advanceTimer);
    advanceTimer = null;
    isAdvancing = false;
    document.querySelectorAll(".journey-visual, .packet-visual, .network-route, .encryption-visual, .firewall-visual, .replica-visual, .failure-visual, .download-visual").forEach(visual => {
        visual.classList.remove("is-uploaded", "is-split", "is-routed", "is-encrypted", "is-secure", "is-replicated", "is-recovered", "is-delivered");
    });
    document.getElementById("encryptionLabel").textContent = "project-report.pdf";
    document.getElementById("firewallGateStatus").textContent = "INACTIVE";
    const checkStatus = document.getElementById("serverCheckStatus");
    if (checkStatus) checkStatus.textContent = "Waiting for requests";
    document.querySelectorAll("#replicaVisual .replica-node small").forEach(status => { status.textContent = "Waiting"; });
    document.querySelectorAll(".journey-feedback").forEach(feedback => { feedback.textContent = ""; });
    showStep(0);
});

saveSettings();
showStep(0);
