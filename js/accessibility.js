const root = document.documentElement;
const storagePrefix = "simunet.accessibility.";
const defaults = {
    theme: "dark",
    fontSize: "normal",
    fontFamily: "mono",
    reducedMotion: "false",
    underlineLinks: "false"
};
const allowedValues = {
    theme: ["dark", "light", "high-contrast"],
    fontSize: ["normal", "large", "larger"],
    fontFamily: ["mono", "arial", "system"],
    reducedMotion: ["true", "false"],
    underlineLinks: ["true", "false"]
};

const preferences = {};
for (const [key, values] of Object.entries(allowedValues)) {
    const storedValue = localStorage.getItem(`${storagePrefix}${key}`);
    preferences[key] = values.includes(storedValue) ? storedValue : defaults[key];
}
const draftPreferences = { ...preferences };

function applyPreferences() {
    root.dataset.theme = preferences.theme;
    root.dataset.fontSize = preferences.fontSize;
    root.dataset.fontFamily = preferences.fontFamily;
    root.dataset.reducedMotion = preferences.reducedMotion;
    root.dataset.underlineLinks = preferences.underlineLinks;
}

applyPreferences();

document.addEventListener("DOMContentLoaded", () => {
    const themeSelect = document.getElementById("themePreference");
    const fontSizeSelect = document.getElementById("fontSizePreference");
    const fontFamilySelect = document.getElementById("fontFamilyPreference");
    const reducedMotionCheckbox = document.getElementById("reducedMotionPreference");
    const underlineLinksCheckbox = document.getElementById("underlineLinksPreference");
    const status = document.getElementById("accessibilityStatus");
    const saveButton = document.getElementById("saveAccessibility");
    const resetButton = document.getElementById("resetAccessibility");

    if (!themeSelect) return;

    function syncControls() {
        themeSelect.value = draftPreferences.theme;
        fontSizeSelect.value = draftPreferences.fontSize;
        fontFamilySelect.value = draftPreferences.fontFamily;
        reducedMotionCheckbox.checked = draftPreferences.reducedMotion === "true";
        underlineLinksCheckbox.checked = draftPreferences.underlineLinks === "true";
    }

    function updateDraft(key, value) {
        draftPreferences[key] = value;
        status.textContent = "Unsaved changes. Select Save preferences to apply them.";
    }

    function savePreferences() {
        for (const [key, value] of Object.entries(draftPreferences)) {
            preferences[key] = value;
            localStorage.setItem(`${storagePrefix}${key}`, value);
        }
        applyPreferences();
    }

    syncControls();
    themeSelect.addEventListener("change", () => updateDraft("theme", themeSelect.value));
    fontSizeSelect.addEventListener("change", () => updateDraft("fontSize", fontSizeSelect.value));
    fontFamilySelect.addEventListener("change", () => updateDraft("fontFamily", fontFamilySelect.value));
    reducedMotionCheckbox.addEventListener("change", () => updateDraft("reducedMotion", String(reducedMotionCheckbox.checked)));
    underlineLinksCheckbox.addEventListener("change", () => updateDraft("underlineLinks", String(underlineLinksCheckbox.checked)));
    saveButton.addEventListener("click", () => {
        savePreferences();
        status.textContent = "Preferences saved and applied.";
    });
    resetButton.addEventListener("click", () => {
        Object.assign(draftPreferences, defaults);
        syncControls();
        savePreferences();
        status.textContent = "Preferences reset and saved.";
    });
});

// Keep the site's card grids and simulator columns aligned across screen sizes.
document.addEventListener("DOMContentLoaded", () => {
    const layoutStyle = document.createElement("style");
    layoutStyle.textContent = `
        .about-grid, .manual-server-grid, .manual-columns, .metrics-grid {
            align-items: stretch;
            grid-auto-rows: 1fr;
        }
        .about-card, .manual-server-card, .manual-info-card, .metric-panel {
            min-width: 0;
            height: 100%;
        }
        @media (min-width: 901px) {
            .dashboard { grid-template-columns: minmax(270px, .82fr) minmax(0, 2fr); align-items: start; }
            .sidebar { align-content: start; }
        }
        .rack-cost-note { margin: 8px 0 0; color: var(--muted); font-size: .66rem; line-height: 1.5; }
        .rack-cost-warning { color: var(--orange, #ffb86b) !important; }
        .firewall-attacker-panel {
            display: grid;
            gap: 12px;
            margin: 18px 0;
            padding: 18px;
            border: 1px solid var(--panel-edge, #354550);
            background: rgba(5, 10, 15, .55);
        }
        .firewall-attacker-panel h3 { margin: 0; color: var(--text, #edf7ff); font-size: .9rem; text-transform: uppercase; }
        .firewall-attacker-panel p { margin: 0; color: var(--muted, #a4b2bd); font-size: .76rem; line-height: 1.6; }
        .firewall-attacker-panel label { color: var(--muted, #a4b2bd); font-size: .72rem; }
        .firewall-attacker-panel select { margin: 0; }
        .firewall-attacker-panel button { width: fit-content; }
        .firewall-attacker-panel [role="status"] { min-height: 1.3em; }
        .firewall-visual.is-threat-blocked .threat-node { border-color: var(--lime, #88ffcc); box-shadow: 0 0 16px rgba(136, 255, 204, .2); }
        .firewall-visual.is-threat-passed .threat-node { border-color: #ff7777; box-shadow: 0 0 16px rgba(255, 90, 90, .22); }
        @media (max-width: 680px) {
            .dashboard { grid-template-columns: minmax(0, 1fr); }
            .sidebar { grid-template-columns: minmax(0, 1fr); }
            .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .metrics-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; width: min(100%, 360px); justify-self: center; }
            .about-grid, .manual-server-grid, .manual-columns { grid-template-columns: minmax(0, 1fr); }
        }
    `;
    document.head.append(layoutStyle);

    initializeRackOverhead();
    initializeFirewallExercise();
});

function initializeRackOverhead() {
    const rackArea = document.getElementById("rackArea");
    const rackButton = document.getElementById("addRackBtn");
    const metrics = document.querySelector(".metrics-grid");
    if (!rackArea || !rackButton || !metrics) return;

    const card = document.createElement("article");
    card.className = "metric-panel rack-cost-panel";
    card.innerHTML = '<div class="metric-label"><span>POWER OVERHEAD</span><strong id="rackOverheadValue">0%</strong></div><div class="meter"><span id="rackOverheadMeter"></span></div><p class="rack-cost-note" id="rackOverheadNote">No extra rack overhead. Each rack after three adds 10% to estimated facility power use.</p>';
    metrics.append(card);

    const updateOverhead = () => {
        const count = rackArea.querySelectorAll(":scope > .rack").length;
        const overhead = Math.max(0, count - 3) * 10;
        const value = document.getElementById("rackOverheadValue");
        const meter = document.getElementById("rackOverheadMeter");
        const note = document.getElementById("rackOverheadNote");
        if (!value || !meter || !note) return;
        value.textContent = `${overhead}%`;
        meter.style.width = `${Math.min(overhead, 100)}%`;
        meter.style.background = overhead ? "var(--orange, #ffb86b)" : "var(--cyan, #66d9ef)";
        note.classList.toggle("rack-cost-warning", overhead > 0);
        note.textContent = overhead
            ? `${count} racks built. Estimated facility power overhead is +${overhead}%. Consider removing unused racks or enabling cooling. Each rack after three adds 10%.`
            : `${count} rack${count === 1 ? "" : "s"} built. No extra rack overhead yet; each rack after three adds 10% to estimated facility power use.`;
    };
    rackButton.addEventListener("click", updateOverhead);
    rackArea.addEventListener("click", event => {
        if (event.target.closest(".remove-part")) updateOverhead();
    });
    updateOverhead();
}

function initializeFirewallExercise() {
    const stage = document.getElementById("journeyStage5");
    const visual = document.getElementById("firewallVisual");
    const firewallButton = document.getElementById("firewallAction");
    const feedback = document.getElementById("firewallFeedback");
    const gateStatus = document.getElementById("firewallGateStatus");
    if (!stage || !visual || !firewallButton || !feedback || !gateStatus) return;

    const exercise = document.createElement("section");
    exercise.className = "firewall-attacker-panel";
    exercise.setAttribute("aria-labelledby", "attackerViewTitle");
    exercise.innerHTML = `
        <h3 id="attackerViewTitle">Try the firewall from both sides</h3>
        <p>Attacker's view: choose a fictional test and see whether it gets past the gate. These actions only change this lesson; they do not send network traffic.</p>
        <label for="firewallScenario">Choose a simulated attempt</label>
        <select id="firewallScenario">
            <option value="unknown">Try an unknown connection</option>
            <option value="repeat">Send a burst of repeated requests</option>
            <option value="restricted">Ask for a restricted page</option>
        </select>
        <button id="firewallAttempt" class="secondary-button" type="button">Send simulated attempt</button>
        <p id="firewallAttackerFeedback" role="status" aria-live="polite">The service is waiting for a test attempt.</p>`;
    visual.insertAdjacentElement("afterend", exercise);

    // Replace the lesson's original one-click action so learners can test both states.
    const toggle = firewallButton.cloneNode(true);
    toggle.textContent = "Enable firewall";
    firewallButton.replaceWith(toggle);
    let enabled = false;
    let testedWithFirewall = false;
    const scenarioSelect = exercise.querySelector("#firewallScenario");
    const attemptButton = exercise.querySelector("#firewallAttempt");
    const attackerFeedback = exercise.querySelector("#firewallAttackerFeedback");
    const scenarioText = {
        unknown: "an unknown connection",
        repeat: "a burst of repeated requests",
        restricted: "a request for a restricted page"
    };

    toggle.addEventListener("click", () => {
        enabled = !enabled;
        visual.classList.toggle("is-secure", enabled);
        gateStatus.textContent = enabled ? "ON" : "INACTIVE";
        toggle.textContent = enabled ? "Disable firewall" : "Enable firewall";
        feedback.textContent = enabled
            ? "Firewall enabled. Send the same simulated attempt again to see what changes."
            : "Firewall disabled. The next simulated attempt can reach the service.";
        attackerFeedback.textContent = enabled
            ? "Defender's view: the firewall is checking incoming test traffic."
            : "Attacker's view: the gate is open in this simplified scene.";
    });

    attemptButton.addEventListener("click", () => {
        const attempt = scenarioText[scenarioSelect.value] || scenarioText.unknown;
        visual.classList.remove("is-threat-blocked", "is-threat-passed");
        if (enabled) {
            visual.classList.add("is-threat-blocked");
            gateStatus.textContent = "ON · BLOCKED";
            attackerFeedback.textContent = `Blocked: ${attempt} did not reach the service. Try turning the firewall off to compare.`;
            feedback.textContent = "The firewall stopped the simulated attempt before it reached the cloud service.";
            if (!testedWithFirewall) {
                testedWithFirewall = true;
                const complete = document.createEvent("Event");
                complete.initEvent("simunet:firewall-lesson-complete", true, true);
                stage.dispatchEvent(complete);
                // The journey's normal completion handler is intentionally invoked through its existing control.
                const continueButton = document.getElementById("journeyNext");
                if (continueButton) {
                    continueButton.hidden = false;
                    document.getElementById("journeyAnnouncement").textContent = "Firewall test complete. Continue when you're ready.";
                }
            }
        } else {
            visual.classList.add("is-threat-passed");
            gateStatus.textContent = "INACTIVE · PASSED";
            attackerFeedback.textContent = `Reached the service: ${attempt} got through because the firewall is off.`;
            feedback.textContent = "The test reached the service. Enable the firewall and repeat the test to block it.";
        }
    });

    const restart = document.getElementById("journeyRestart");
    if (restart) restart.addEventListener("click", () => {
        enabled = false;
        testedWithFirewall = false;
        toggle.textContent = "Enable firewall";
        gateStatus.textContent = "INACTIVE";
        attackerFeedback.textContent = "The service is waiting for a test attempt.";
        visual.classList.remove("is-secure", "is-threat-blocked", "is-threat-passed");
    });
}
