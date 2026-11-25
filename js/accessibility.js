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
    let storedValue = null;
    try { storedValue = localStorage.getItem(`${storagePrefix}${key}`); } catch {}
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
            try { localStorage.setItem(`${storagePrefix}${key}`, value); } catch {}
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
