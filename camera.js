(() => {
    const $ = id => document.getElementById(id);
    const cameraVideo = $("cameraVideo");
    const cameraPlaceholder = $("cameraPlaceholder");
    const cameraStatusLabel = $("cameraStatusLabel");
    const cameraMode = $("cameraMode");
    const cameraFeedback = $("cameraFeedback");
    const startButton = $("startCamera");
    const captureButton = $("capturePhoto");
    const stopButton = $("stopCamera");
    const gallery = $("photoGallery");
    const storeButton = $("storePhoto");
    const travelingPhoto = $("travelingPhoto");
    let cameraStream = null;
    let capturedPhotos = [];
    let selectedPhotoId = null;
    const storedPhotoIds = new Set();
    let transferInProgress = false;

    function releaseCamera() {
        cameraStream?.getTracks().forEach(track => track.stop());
        cameraStream = null;
        cameraVideo.srcObject = null;
        cameraVideo.hidden = true;
        cameraPlaceholder.hidden = false;
        captureButton.disabled = true;
        stopButton.disabled = true;
        startButton.disabled = false;
    }

    function cameraErrorMessage(error) {
        if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
            return "Camera permission was denied. Allow camera access in your browser settings, then try again.";
        }
        if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
            return "No compatible camera was found on this device.";
        }
        if (error?.name === "NotReadableError" || error?.name === "AbortError") {
            return "The camera is unavailable or being used by another app.";
        }
        return `Could not start the camera${error?.message ? `: ${error.message}` : ". Check browser permissions and try again."}`;
    }

    async function startCamera() {
        if (!navigator.mediaDevices?.getUserMedia) {
            cameraFeedback.textContent = "Camera access requires HTTPS and a browser that supports device cameras.";
            return;
        }

        startButton.disabled = true;
        cameraStatusLabel.textContent = "REQUESTING";
        cameraMode.textContent = "REQUESTING CAMERA";
        cameraFeedback.textContent = "Waiting for camera permission…";
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false
            });
            cameraVideo.srcObject = cameraStream;
            await cameraVideo.play();
            cameraVideo.hidden = false;
            cameraPlaceholder.hidden = true;
            captureButton.disabled = false;
            stopButton.disabled = false;
            cameraStatusLabel.textContent = "CAMERA READY";
            cameraMode.textContent = "LIVE CAMERA";
            cameraFeedback.textContent = "Camera is ready. Take a picture to add it to your gallery.";
        } catch (error) {
            releaseCamera();
            cameraStatusLabel.textContent = "CAMERA OFF";
            cameraMode.textContent = "CAMERA UNAVAILABLE";
            cameraFeedback.textContent = cameraErrorMessage(error);
        }
    }

    function stopCamera() {
        releaseCamera();
        cameraStatusLabel.textContent = "CAMERA OFF";
        cameraMode.textContent = "CAMERA OFF";
        cameraFeedback.textContent = "Camera stopped. Enable it again when you are ready to take a photo.";
    }

    function renderGallery() {
        gallery.replaceChildren();
        if (!capturedPhotos.length) {
            const empty = document.createElement("p");
            empty.className = "gallery-empty";
            empty.textContent = "No photos yet. Enable the camera and take a picture to begin.";
            gallery.append(empty);
        }
        capturedPhotos.forEach(photo => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = `photo-card${photo.id === selectedPhotoId ? " is-selected" : ""}`;
            card.dataset.photoId = photo.id;
            card.setAttribute("aria-pressed", String(photo.id === selectedPhotoId));
            card.setAttribute("aria-label", `${photo.name}${storedPhotoIds.has(photo.id) ? ", already stored in cloud" : ""}`);
            const image = document.createElement("img");
            image.src = photo.src;
            image.alt = "";
            const caption = document.createElement("span");
            caption.textContent = photo.name;
            const badge = document.createElement("small");
            badge.textContent = storedPhotoIds.has(photo.id) ? "CLOUD COPY SAVED" : "ORIGINAL PHOTO";
            card.append(image, caption, badge);
            card.addEventListener("click", () => {
                selectedPhotoId = photo.id;
                $("sourcePhoto").src = photo.src;
                $("sourcePhoto").alt = `Original photo ${photo.name}`;
                storeButton.disabled = transferInProgress || storedPhotoIds.has(photo.id);
                $("storeFeedback").textContent = storedPhotoIds.has(photo.id)
                    ? "This photo already has a cloud copy. The original remains in your gallery."
                    : "Original selected. Store a separate copy in the simulated cloud.";
                renderGallery();
            });
            gallery.append(card);
        });
        $("photoCount").textContent = `${capturedPhotos.length} PHOTO${capturedPhotos.length === 1 ? "" : "S"}`;
    }

    function capturePhoto() {
        if (!cameraStream || !cameraVideo.videoWidth || !cameraVideo.videoHeight) {
            cameraFeedback.textContent = "The camera preview is not ready yet. Wait for the live image, then try again.";
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = cameraVideo.videoWidth;
        canvas.height = cameraVideo.videoHeight;
        const context = canvas.getContext("2d");
        if (!context) {
            cameraFeedback.textContent = "Could not capture the photo in this browser.";
            return;
        }
        context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
        const photo = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: `simunet-photo-${capturedPhotos.length + 1}.jpg`,
            src: canvas.toDataURL("image/jpeg", 0.92)
        };
        capturedPhotos.unshift(photo);
        selectedPhotoId = photo.id;
        $("sourcePhoto").src = photo.src;
        $("sourcePhoto").alt = `Original photo ${photo.name}`;
        $("cameraMode").textContent = "PHOTO CAPTURED";
        cameraFeedback.textContent = `${photo.name} captured from your camera and added to your gallery.`;
        storeButton.disabled = false;
        renderGallery();
    }

    function wait(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
    }

    async function animateTransfer(photo) {
        const cardImage = gallery.querySelector(`[data-photo-id="${CSS.escape(photo.id)}"] img`);
        const originRect = (cardImage || cameraVideo).getBoundingClientRect();
        const start = { x: originRect.left + originRect.width / 2, y: originRect.top + originRect.height / 2 };
        const destinations = [$("networkNode"), $("rackNode"), $("driveNode")].map(node => {
            const rect = node.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        });
        const nodes = [$("deviceNode"), $("networkNode"), $("rackNode"), $("driveNode")];
        travelingPhoto.src = photo.src;
        travelingPhoto.hidden = false;
        travelingPhoto.style.left = `${start.x}px`;
        travelingPhoto.style.top = `${start.y}px`;
        travelingPhoto.style.transform = "translate(-50%, -50%) scale(1)";
        $("transferStatus").textContent = "SENDING";
        $("storeFeedback").textContent = "Sending a copy… your original photo stays in the gallery.";
        nodes.forEach(node => node.classList.remove("is-active", "is-stored"));
        nodes[0].classList.add("is-active");
        let current = start;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof travelingPhoto.animate !== "function") {
            destinations.forEach((target, index) => {
                nodes[index + 1].classList.add("is-active");
                $("driveCapacityBar").style.width = `${(index + 1) / destinations.length * 100}%`;
            });
        } else {
            for (let index = 0; index < destinations.length; index++) {
                const target = destinations[index];
                const fromX = current.x - start.x;
                const fromY = current.y - start.y;
                const toX = target.x - start.x;
                const toY = target.y - start.y;
                const animation = travelingPhoto.animate([
                    { transform: `translate(calc(-50% + ${fromX}px), calc(-50% + ${fromY}px)) scale(${index ? .48 : 1})`, opacity: 1 },
                    { transform: `translate(calc(-50% + ${toX}px), calc(-50% + ${toY}px)) scale(.48)`, opacity: 1 }
                ], { duration: 720, easing: "cubic-bezier(.22,.75,.3,1)", fill: "forwards" });
                try { await animation.finished; } catch (_) { /* animation was interrupted */ }
                current = target;
                nodes[index + 1].classList.add("is-active");
                $("driveCapacityBar").style.width = `${(index + 1) / destinations.length * 100}%`;
                if (index < destinations.length - 1) await wait(180);
            }
        }

        $("driveNode").classList.add("is-stored");
        $("driveStatus").textContent = "Photo copy saved";
        $("transferStatus").textContent = "STORED";
        travelingPhoto.hidden = true;
        travelingPhoto.getAnimations().forEach(animation => animation.cancel());
        storedPhotoIds.add(photo.id);
        renderGallery();
        renderCloudGallery(photo);
        updateCapacity();
        $("storeFeedback").textContent = `Cloud copy saved as ${photo.name}. Your original is still in the photo gallery.`;
        transferInProgress = false;
        storeButton.disabled = true;
    }

    function renderCloudGallery(photo) {
        if (document.querySelector(`[data-cloud-photo="${CSS.escape(photo.id)}"]`)) return;
        const item = document.createElement("figure");
        item.className = "cloud-photo";
        item.dataset.cloudPhoto = photo.id;
        const image = document.createElement("img");
        image.src = photo.src;
        image.alt = `Cloud copy of ${photo.name}`;
        const caption = document.createElement("figcaption");
        caption.textContent = `${photo.name} · stored copy`;
        item.append(image, caption);
        $("cloudGallery").append(item);
    }

    function updateCapacity() {
        const count = storedPhotoIds.size;
        $("driveCapacityLabel").textContent = `${count} photo${count === 1 ? "" : "s"} stored`;
        $("driveCapacityBar").style.width = `${Math.min(count * 20, 100)}%`;
    }

    startButton.addEventListener("click", startCamera);
    stopButton.addEventListener("click", stopCamera);
    captureButton.addEventListener("click", capturePhoto);
    window.addEventListener("pagehide", releaseCamera);
    storeButton.addEventListener("click", async () => {
        if (transferInProgress || !selectedPhotoId) return;
        const photo = capturedPhotos.find(item => item.id === selectedPhotoId);
        if (!photo || storedPhotoIds.has(photo.id)) return;
        transferInProgress = true;
        storeButton.disabled = true;
        await animateTransfer(photo);
    });

})();
