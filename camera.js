(() => {
    const scenes = [
        {
            name: "Mountain lake at sunrise",
            filename: "mountain-lake.jpg",
            colors: ["#17334b", "#e69569", "#f6c982"],
            art: '<circle cx="440" cy="112" r="48" fill="#ffd990" opacity=".95"/><path d="M0 245 126 116l90 95 112-142 146 176Z" fill="#395e68"/><path d="m175 207 153-138 146 176H229Z" fill="#688b85"/><path d="m278 113 51-44 51 62-37-15-23 23-19-20Z" fill="#d6e0d1"/><path d="M0 245q135-23 248 0t246 0v115H0Z" fill="#397d89"/><path d="M0 284q120-20 247 2t247-1" fill="none" stroke="#9fd4cf" stroke-width="4" opacity=".7"/><path d="M0 0h494v360H0Z" fill="url(#shade)" opacity=".12"/>'
        },
        {
            name: "City skyline at blue hour",
            filename: "city-skyline.jpg",
            colors: ["#152448", "#563c70", "#f39b76"],
            art: '<circle cx="386" cy="95" r="37" fill="#ffcb9c" opacity=".9"/><path d="M0 266h494v94H0Z" fill="#121c35"/><path d="M22 182h56v84H22zm70-67h78v151H92zm91 43h53v108h-53zm68-91h87v199h-87zm99 68h51v131h-51zm67-39h55v170h-55z" fill="#273858"/><path d="M37 200h9v12h-9zm20 0h9v12h-9zm48-57h12v14h-12zm25 0h12v14h-12zm-25 28h12v14h-12zm93 16h10v13h-10zm85-69h12v15h-12zm26 0h12v15h-12zm-26 31h12v15h-12zm77 28h10v13h-10zm70-48h11v14h-11zm0 28h11v14h-11z" fill="#ffc77f"/><path d="M0 266h494" stroke="#56d9ef" stroke-width="3" opacity=".7"/>'
        },
        {
            name: "Ocean cliffs on a clear day",
            filename: "ocean-cliffs.jpg",
            colors: ["#267b9b", "#89c8c0", "#f6d69a"],
            art: '<circle cx="395" cy="92" r="43" fill="#fff0bb"/><path d="M0 196q111-27 228 3t266-6v167H0Z" fill="#247e9d"/><path d="M0 243q112-22 236 4t258-4" fill="none" stroke="#a5e1d8" stroke-width="6" opacity=".75"/><path d="M0 0h494v212L390 189l-74 35-96-60-79 35-61-32L0 182Z" fill="#537b6f"/><path d="m180 199 58-112 57 53 24 74-70-31-39 24Z" fill="#829b79"/><path d="m236 87 28-17 31 34-28-10-13 13Z" fill="#edf0d0"/><path d="M0 0h494v360H0Z" fill="url(#shade)" opacity=".1"/>'
        }
    ];

    const $ = id => document.getElementById(id);
    const viewfinderImage = $("viewfinderImage");
    const gallery = $("photoGallery");
    const storeButton = $("storePhoto");
    const travelingPhoto = $("travelingPhoto");
    let sceneIndex = 0;
    let capturedPhotos = [];
    let selectedPhotoId = null;
    let storedPhotoIds = new Set();
    let transferInProgress = false;

    function makePhoto(scene, index) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 494 360"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${scene.colors[0]}"/><stop offset=".68" stop-color="${scene.colors[1]}"/><stop offset="1" stop-color="${scene.colors[2]}"/></linearGradient><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#07111c" stop-opacity=".2"/><stop offset="1" stop-color="#07111c" stop-opacity=".6"/></linearGradient></defs><rect width="494" height="360" fill="url(#sky)"/>${scene.art}<rect x="12" y="12" width="470" height="336" rx="8" fill="none" stroke="#e9fbff" stroke-opacity=".55" stroke-width="2"/><text x="24" y="329" fill="#fff" font-family="Arial,sans-serif" font-size="14" letter-spacing="2">SIMUNET CAM · ${String(index + 1).padStart(2, "0")}</text></svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function showScene() {
        const scene = scenes[sceneIndex];
        viewfinderImage.src = makePhoto(scene, sceneIndex);
        viewfinderImage.alt = `Camera preview: ${scene.name}`;
        $("sceneLabel").textContent = `SCENE ${String(sceneIndex + 1).padStart(2, "0")}`;
        $("cameraMode").textContent = "LIVE PREVIEW";
    }

    function renderGallery() {
        gallery.replaceChildren();
        if (!capturedPhotos.length) {
            const empty = document.createElement("p");
            empty.className = "gallery-empty";
            empty.textContent = "No photos yet. Take a picture with the camera first.";
            gallery.append(empty);
        }
        capturedPhotos.forEach(photo => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = `photo-card${photo.id === selectedPhotoId ? " is-selected" : ""}`;
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
                storeButton.disabled = transferInProgress;
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
        const scene = scenes[sceneIndex];
        const photo = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: scene.filename,
            sceneName: scene.name,
            src: makePhoto(scene, capturedPhotos.length)
        };
        capturedPhotos.unshift(photo);
        selectedPhotoId = photo.id;
        $("sourcePhoto").src = photo.src;
        $("sourcePhoto").alt = `Original photo ${photo.name}`;
        $("cameraMode").textContent = "PHOTO CAPTURED";
        $("cameraFeedback").textContent = `${scene.name} captured. The original is saved in your gallery.`;
        storeButton.disabled = false;
        renderGallery();
    }

    function wait(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
    }

    async function animateTransfer(photo) {
        const sceneRect = $("transferScene").getBoundingClientRect();
        const originRect = document.querySelector(`[aria-label="${CSS.escape(photo.name)}"] img`)?.getBoundingClientRect()
            || $("sourcePhoto").getBoundingClientRect();
        const destinations = [$("networkNode"), $("rackNode"), $("driveNode")].map(node => {
            const rect = node.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        });
        const origin = { x: originRect.left + originRect.width / 2, y: originRect.top + originRect.height / 2 };
        travelingPhoto.src = photo.src;
        travelingPhoto.hidden = false;
        travelingPhoto.style.left = `${origin.x}px`;
        travelingPhoto.style.top = `${origin.y}px`;
        travelingPhoto.style.transform = "translate(-50%, -50%) scale(1)";
        const nodes = [$("deviceNode"), $("networkNode"), $("rackNode"), $("driveNode")];
        $("transferStatus").textContent = "UPLOADING";
        $("storeFeedback").textContent = "Uploading a copy… your original photo stays in the gallery.";

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            for (let index = 1; index < nodes.length; index++) {
                nodes[index].classList.add("is-active");
                $("driveCapacityBar").style.width = `${index / (nodes.length - 1) * 100}%`;
            }
        } else {
            for (let index = 0; index < destinations.length; index++) {
                const target = destinations[index];
                const dx = target.x - origin.x;
                const dy = target.y - origin.y;
                const animation = travelingPhoto.animate([
                    { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
                    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.48)`, opacity: .98 }
                ], { duration: 780, easing: "cubic-bezier(.22,.75,.3,1)", fill: "forwards" });
                try { await animation.finished; } catch (_) { /* animation was interrupted */ }
                origin.x = target.x;
                origin.y = target.y;
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
        storeButton.disabled = false;
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

    $("previousScene").addEventListener("click", () => {
        sceneIndex = (sceneIndex - 1 + scenes.length) % scenes.length;
        showScene();
    });
    $("nextScene").addEventListener("click", () => {
        sceneIndex = (sceneIndex + 1) % scenes.length;
        showScene();
    });
    $("capturePhoto").addEventListener("click", capturePhoto);
    storeButton.addEventListener("click", async () => {
        if (transferInProgress || !selectedPhotoId) return;
        const photo = capturedPhotos.find(item => item.id === selectedPhotoId);
        if (!photo || storedPhotoIds.has(photo.id)) {
            $("storeFeedback").textContent = "Select a photo that has not been stored yet.";
            return;
        }
        transferInProgress = true;
        storeButton.disabled = true;
        await animateTransfer(photo);
    });

    showScene();
})();
