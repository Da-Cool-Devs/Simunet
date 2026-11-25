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
let motionAnimations = [];

function playMotion(element, keyframes, options = {}) {
    if (!element || !settings.ambientMotion || !element.animate || document.documentElement.dataset.reducedMotion === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const speed = settings.speed === "fast" ? 0.75 : settings.speed === "slow" ? 1.25 : 1;
    const animation = element.animate(keyframes, {
        duration: (options.duration || 400) * speed,
        delay: (options.delay || 0) * speed,
        easing: options.easing || "cubic-bezier(0.2, 0.7, 0.2, 1)",
        fill: "both"
    });
    motionAnimations.push(animation);
    animation.onfinish = () => {
        animation.cancel();
        motionAnimations = motionAnimations.filter(item => item !== animation);
    };
}

function animateStage(stage) {
    motionAnimations.forEach(animation => animation.cancel());
    motionAnimations = [];
    [...stage.children].forEach((element, index) => {
        playMotion(element, [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "translateY(0)" }
        ], { delay: index * 55, duration: 380 });
    });
}

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
            <div class="defense-traffic defense-trusted"><span class="traffic-symbol" aria-hidden="true">OK</span><strong>Trusted request</strong><small>Allowed visitor</small></div>
            <div class="defense-server"><span class="server-shield" aria-hidden="true">SERVER</span><strong>WEB SERVER</strong><small class="server-check-status" id="serverCheckStatus">Waiting for requests</small><div class="server-indicators" aria-hidden="true"><i></i><i></i><i></i></div></div>
            <div class="defense-result defense-blocked" id="blockedResult"><span aria-hidden="true">×</span><strong>BLOCKED</strong></div>
            <div class="defense-result defense-served" id="servedResult"><span aria-hidden="true">OK</span><strong>SERVICE REACHED</strong></div>
        </div>
        <button id="routeAction" class="primary-button" type="button">Check incoming requests</button>
        <p id="routeFeedback" class="journey-feedback" role="status"></p>`;
    if (journeySteps[2]) journeySteps[2].innerHTML = "<span>03</span> Server defense";
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
    if (stages[currentStep]) animateStage(stages[currentStep]);
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
    playMotion(uploadVisual, [{ transform: "scale(0.97)" }, { transform: "scale(1)" }]);
    uploadVisual.classList.remove("is-uploaded");
    void uploadVisual.offsetWidth;
    uploadVisual.classList.add("is-uploaded");
    completeStep(document.getElementById("uploadFeedback"), "Upload complete. Your file has reached the cloud data center.");
});
document.getElementById("packetAction").addEventListener("click", () => {
    const visual = document.getElementById("packetVisual");
    playMotion(visual, [{ transform: "scale(0.97)" }, { transform: "scale(1)" }]);
    visual.classList.add("is-split");
    completeStep(document.getElementById("packetFeedback"), "The file is now represented as packets ready to travel across the network.");
});
document.getElementById("routeAction").addEventListener("click", () => {
    const defenseScene = document.getElementById("serverCheckStatus");
    if (defenseScene) {
        const route = document.getElementById("networkRoute");
        playMotion(route, [{ transform: "translateX(-5px)" }, { transform: "translateX(0)" }]);
        route.classList.add("is-routed");
        defenseScene.textContent = "Suspicious request blocked · trusted request served";
        completeStep(document.getElementById("routeFeedback"), "The server rejected the suspicious request and continued serving the trusted visitor.");
        return;
    }
    const route = document.getElementById("networkRoute");
    playMotion(route, [{ transform: "translateX(-5px)" }, { transform: "translateX(0)" }]);
    route.classList.add("is-routed");
    completeStep(document.getElementById("routeFeedback"), "The packets reached the cloud data center by passing through network devices.");
});
document.getElementById("encryptAction").addEventListener("click", () => {
    const visual = document.getElementById("encryptionVisual");
    playMotion(visual, [{ transform: "rotateY(0deg)" }, { transform: "rotateY(360deg)" }], { duration: 700 });
    visual.classList.add("is-encrypted");
    document.getElementById("encryptionLabel").textContent = "PROTECTED • 8F3A-21C7";
    completeStep(document.getElementById("encryptFeedback"), "The sample file is now shown as protected data.");
});
const firewall = {
    enabled: false,
    lessonDone: false,
    visual: document.getElementById("firewallVisual"),
    toggle: document.getElementById("firewallAction"),
    gate: document.getElementById("firewallGateStatus"),
    feedback: document.getElementById("firewallFeedback"),
    attackerFeedback: document.getElementById("firewallAttackerFeedback"),
    scenario: document.getElementById("firewallScenario")
};
const firewallScenarios = {
    unknown: "an unknown connection",
    repeat: "a burst of repeated requests",
    restricted: "a request for a restricted page"
};
function resetFirewallLesson() {
    firewall.enabled = false;
    firewall.lessonDone = false;
    firewall.toggle.textContent = "Enable firewall";
    firewall.gate.textContent = "INACTIVE";
    firewall.attackerFeedback.textContent = "The service is waiting for a test attempt.";
    firewall.visual.classList.remove("is-secure", "is-threat-blocked", "is-threat-passed");
}
firewall.toggle.addEventListener("click", () => {
    firewall.enabled = !firewall.enabled;
    playMotion(firewall.visual, [{ transform: "scale(0.96)" }, { transform: "scale(1)" }]);
    firewall.visual.classList.toggle("is-secure", firewall.enabled);
    firewall.visual.classList.remove("is-threat-blocked", "is-threat-passed");
    firewall.gate.textContent = firewall.enabled ? "ON" : "INACTIVE";
    firewall.toggle.textContent = firewall.enabled ? "Disable firewall" : "Enable firewall";
    firewall.feedback.textContent = firewall.enabled
        ? "Firewall enabled. Send a simulated attempt to see what changes."
        : "Firewall disabled. The next simulated attempt can reach the service.";
    firewall.attackerFeedback.textContent = firewall.enabled
        ? "Defender's view: the firewall is checking incoming test traffic."
        : "Attacker's view: the gate is open in this simplified scene.";
});
document.getElementById("firewallAttempt").addEventListener("click", () => {
    const attempt = firewallScenarios[firewall.scenario.value] || firewallScenarios.unknown;
    firewall.visual.classList.remove("is-threat-blocked", "is-threat-passed");
    if (!firewall.enabled) {
        firewall.visual.classList.add("is-threat-passed");
        firewall.gate.textContent = "INACTIVE · PASSED";
        firewall.attackerFeedback.textContent = `Reached the service: ${attempt} got through because the firewall is off.`;
        firewall.feedback.textContent = "The test reached the service. Enable the firewall and repeat the test to block it.";
        return;
    }
    firewall.visual.classList.add("is-threat-blocked");
    firewall.gate.textContent = "ON · BLOCKED";
    firewall.attackerFeedback.textContent = `Blocked: ${attempt} did not reach the service. Try turning the firewall off to compare.`;
    const message = "Firewall on. The simulated attempt was blocked before it reached the cloud service.";
    if (firewall.lessonDone) { firewall.feedback.textContent = message; return; }
    firewall.lessonDone = true;
    completeStep(firewall.feedback, message);
});
document.getElementById("replicaAction").addEventListener("click", () => {
    const visual = document.getElementById("replicaVisual");
    playMotion(visual, [{ opacity: 0.6, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }]);
    visual.classList.add("is-replicated");
    document.querySelectorAll("#replicaVisual .replica-node small").forEach((status, index) => { status.textContent = index === 0 ? "MAIN COPY" : "COPY READY"; });
    completeStep(document.getElementById("replicaFeedback"), "Copies are ready on separate servers. Now test what happens if one server fails.");
});
document.querySelectorAll("[data-recovery-choice]").forEach(choice => {
    choice.addEventListener("click", () => {
        const feedback = document.getElementById("recoveryFeedback");
        if (choice.dataset.recoveryChoice === "correct") {
            const visual = document.querySelector(".failure-visual");
            playMotion(visual, [{ transform: "scale(0.96)" }, { transform: "scale(1)" }]);
            visual.classList.add("is-recovered");
            completeStep(feedback, "Correct. The service can recover the file from another server's replica.");
        } else {
            feedback.textContent = "Not quite. A copy on a different server can be used to recover the file.";
            announcement.textContent = feedback.textContent;
        }
    });
});
document.getElementById("downloadAction").addEventListener("click", () => {
    const visual = document.getElementById("downloadVisual");
    playMotion(visual, [{ transform: "translateY(8px)", opacity: 0.65 }, { transform: "translateY(0)", opacity: 1 }]);
    visual.classList.add("is-delivered");
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
    resetFirewallLesson();
    const checkStatus = document.getElementById("serverCheckStatus");
    if (checkStatus) checkStatus.textContent = "Waiting for requests";
    document.querySelectorAll("#replicaVisual .replica-node small").forEach(status => { status.textContent = "Waiting"; });
    document.querySelectorAll(".journey-feedback").forEach(feedback => { feedback.textContent = ""; });
    showStep(0);
});

// ---------- End-of-journey knowledge check ----------
const quizForm = document.getElementById("journeyQuiz");
const quizExplanations = {
    q1: "Networks move data in small packets; they are reassembled at the destination.",
    q2: "A firewall filters traffic, blocking unwanted connections before they reach the service.",
    q3: "Replicas on separate servers let the service recover when one server fails."
};
function resetQuiz() {
    quizForm.reset();
    quizForm.querySelectorAll("fieldset").forEach(set => set.classList.remove("is-correct", "is-wrong"));
    quizForm.querySelectorAll(".quiz-feedback").forEach(feedback => { feedback.textContent = ""; });
    document.getElementById("quizScore").textContent = "";
}
quizForm.addEventListener("submit", event => {
    event.preventDefault();
    let correct = 0;
    const sets = [...quizForm.querySelectorAll("fieldset")];
    sets.forEach(set => {
        const chosen = set.querySelector("input:checked");
        const name = set.querySelector("input").name;
        const right = Boolean(chosen && chosen.hasAttribute("data-correct"));
        if (right) correct++;
        set.classList.toggle("is-correct", right);
        set.classList.toggle("is-wrong", !right);
        set.querySelector(".quiz-feedback").textContent = !chosen ? "Pick an answer." : right ? `Correct! ${quizExplanations[name]}` : `Not quite. ${quizExplanations[name]}`;
    });
    const message = correct === sets.length
        ? `${correct} / ${sets.length}: perfect! You're ready to build your own cloud in the simulator.`
        : `${correct} / ${sets.length}. Read the explanations, then try again or replay the journey.`;
    document.getElementById("quizScore").textContent = message;
    announcement.textContent = message;
});
document.getElementById("journeyRestart").addEventListener("click", resetQuiz);

saveSettings();
showStep(0);
