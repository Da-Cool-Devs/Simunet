const root = document.documentElement;
const storagePrefix = "simunet.accessibility.";
const defaults = {
    theme: "dark",
    fontSize: "normal",
    reducedMotion: "false",
    underlineLinks: "false"
};
const allowedValues = {
    theme: ["dark", "light", "high-contrast"],
    fontSize: ["normal", "large", "larger"],
    reducedMotion: ["true", "false"],
    underlineLinks: ["true", "false"]
};

const preferences = {};
for (const [key, values] of Object.entries(allowedValues)) {
    const storedValue = localStorage.getItem(`${storagePrefix}${key}`);
    preferences[key] = values.includes(storedValue) ? storedValue : defaults[key];
}

function applyPreferences() {
    root.dataset.theme = preferences.theme;
    root.dataset.fontSize = preferences.fontSize;
    root.dataset.reducedMotion = preferences.reducedMotion;
    root.dataset.underlineLinks = preferences.underlineLinks;
}

function storePreference(key, value) {
    preferences[key] = value;
    localStorage.setItem(`${storagePrefix}${key}`, value);
    applyPreferences();
}

applyPreferences();

document.addEventListener("DOMContentLoaded", () => {
    const themeSelect = document.getElementById("themePreference");
    const fontSizeSelect = document.getElementById("fontSizePreference");
    const reducedMotionCheckbox = document.getElementById("reducedMotionPreference");
    const underlineLinksCheckbox = document.getElementById("underlineLinksPreference");
    const status = document.getElementById("accessibilityStatus");
    const resetButton = document.getElementById("resetAccessibility");

    if (!themeSelect) return;

    themeSelect.value = preferences.theme;
    fontSizeSelect.value = preferences.fontSize;
    reducedMotionCheckbox.checked = preferences.reducedMotion === "true";
    underlineLinksCheckbox.checked = preferences.underlineLinks === "true";

    themeSelect.addEventListener("change", () => {
        storePreference("theme", themeSelect.value);
        status.textContent = "Color theme updated and saved.";
    });
    fontSizeSelect.addEventListener("change", () => {
        storePreference("fontSize", fontSizeSelect.value);
        status.textContent = "Text size updated and saved.";
    });
    reducedMotionCheckbox.addEventListener("change", () => {
        const value = String(reducedMotionCheckbox.checked);
        storePreference("reducedMotion", value);
        status.textContent = "Motion preference updated and saved.";
    });
    underlineLinksCheckbox.addEventListener("change", () => {
        const value = String(underlineLinksCheckbox.checked);
        storePreference("underlineLinks", value);
        status.textContent = "Link appearance updated and saved.";
    });
    resetButton.addEventListener("click", () => {
        for (const [key, value] of Object.entries(defaults)) {
            storePreference(key, value);
        }
        themeSelect.value = defaults.theme;
        fontSizeSelect.value = defaults.fontSize;
        reducedMotionCheckbox.checked = false;
        underlineLinksCheckbox.checked = false;
        status.textContent = "Preferences reset to defaults.";
    });
});
