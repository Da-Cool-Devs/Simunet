// Site-wide behavior: mobile navigation menu.
(() => {
    const header = document.querySelector(".site-header");
    const toggle = header && header.querySelector(".nav-toggle");
    if (!toggle) return;
    const setOpen = open => {
        header.classList.toggle("nav-open", open);
        toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", event => { if (!header.contains(event.target)) setOpen(false); });
    window.matchMedia("(min-width: 821px)").addEventListener("change", event => { if (event.matches) setOpen(false); });
})();
