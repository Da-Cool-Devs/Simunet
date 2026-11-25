const stages = [...document.querySelectorAll(".journey-stage")];
const journeySteps = [...document.querySelectorAll("[data-journey-step]")];
const progress = document.getElementById("journeyProgress");
const progressBar = document.getElementById("journeyProgressBar");
const stepLabel = document.getElementById("journeyStepLabel");
const announcement = document.getElementById("journeyAnnouncement");
const backButton = document.getElementById("journeyBack");
let currentStep = 0;
let isAdvancing = false;

function showStep(step) {
    currentStep = Math.max(0, Math.min(step, stages.length - 1));
    stages.forEach((stage, index) => {
        stage.hidden = index !== currentStep;
    });

    journeySteps.forEach((item, index) => {
        item.classList.toggle("is-current", index === currentStep);
        item.classList.toggle("is-complete", index < currentStep);
        if (index === currentStep) {
            item.setAttribute("aria-current", "step");
        } else {
            item.removeAttribute("aria-current");
        }
    });

    const percent = Math.round((Math.min(currentStep, 8) / 8) * 100);
    progressBar.style.width = `${percent}%`;
    progress.setAttribute("aria-valuenow", String(percent));
    progress.setAttribute(
        "aria-valuetext",
        currentStep === 8 ? "Journey complete" : `Step ${currentStep + 1} of 8`
    );
    stepLabel.textContent = currentStep === 8 ? "COMPLETE" : `STEP ${currentStep + 1} / 8`;
    backButton.disabled = currentStep === 0;
    announcement.textContent = currentStep === 8
        ? "Journey complete. You can try it again or explore the infrastructure simulator."
        : `Step ${currentStep + 1} of 8: ${stages[currentStep].querySelector("h2").textContent}`;
}

function completeStep(feedbackElement, message) {
    if (isAdvancing) return;
    feedbackElement.textContent = message;
    announcement.textContent = message;
    isAdvancing = true;

    window.setTimeout(() => {
        isAdvancing = false;
        showStep(currentStep + 1);
    }, 650);
}

document.getElementById("uploadAction").addEventListener("click", () => {
    document.getElementById("uploadVisual").classList.add("is-uploaded");
    completeStep(
        document.getElementById("uploadFeedback"),
        "Upload complete. Your file has reached the cloud edge."
    );
});

document.getElementById("packetAction").addEventListener("click", () => {
    document.getElementById("packetVisual").classList.add("is-split");
    completeStep(
        document.getElementById("packetFeedback"),
        "The file is now represented as packets ready to travel across the network."
    );
});

document.getElementById("routeAction").addEventListener("click", () => {
    document.getElementById("networkRoute").classList.add("is-routed");
    completeStep(
        document.getElementById("routeFeedback"),
        "The packets reached the cloud data center by passing through network devices."
    );
});

document.getElementById("encryptAction").addEventListener("click", () => {
    document.getElementById("encryptionVisual").classList.add("is-encrypted");
    document.getElementById("encryptionLabel").textContent = "ENCRYPTED • 8F3A-21C7";
    completeStep(
        document.getElementById("encryptFeedback"),
        "The sample file is now shown as encrypted data."
    );
});

document.getElementById("firewallAction").addEventListener("click", () => {
    document.getElementById("firewallVisual").classList.add("is-secure");
    document.getElementById("firewallGateStatus").textContent = "ACTIVE";
    completeStep(
        document.getElementById("firewallFeedback"),
        "Firewall active. Untrusted traffic is blocked before it reaches the cloud service."
    );
});

document.getElementById("replicaAction").addEventListener("click", () => {
    document.getElementById("replicaVisual").classList.add("is-replicated");
    document.querySelectorAll("#replicaVisual .replica-node small").forEach((status, index) => {
        status.textContent = index === 0 ? "PRIMARY COPY" : "COPY READY";
    });
    completeStep(
        document.getElementById("replicaFeedback"),
        "Copies are ready on separate servers. Now test what happens if one server fails."
    );
});

document.querySelectorAll("[data-recovery-choice]").forEach((choice) => {
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
    completeStep(
        document.getElementById("downloadFeedback"),
        "Download complete. Your file made it back to your device."
    );
});

backButton.addEventListener("click", () => {
    if (!isAdvancing) showStep(currentStep - 1);
});

document.getElementById("journeyRestart").addEventListener("click", () => {
    if (isAdvancing) return;
    document.querySelectorAll(".journey-visual, .packet-visual, .network-route, .encryption-visual, .firewall-visual, .replica-visual, .failure-visual, .download-visual").forEach((visual) => {
        visual.classList.remove("is-uploaded", "is-split", "is-routed", "is-encrypted", "is-secure", "is-replicated", "is-recovered", "is-delivered");
    });
    document.getElementById("encryptionLabel").textContent = "project-report.pdf";
    document.getElementById("firewallGateStatus").textContent = "INACTIVE";
    document.querySelectorAll("#replicaVisual .replica-node small").forEach((status) => {
        status.textContent = "Waiting";
    });
    document.querySelectorAll(".journey-feedback").forEach((feedback) => {
        feedback.textContent = "";
    });
    showStep(0);
});

showStep(0);
