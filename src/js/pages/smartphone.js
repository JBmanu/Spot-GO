import {PATHS} from "../paths.js";
import {activateToolbar} from "../common/back.js";

const SECTION_CONFIG = {
    homepage: {title: "Spot & Go", content: PATHS.html.homepage},
    map: {title: "Mappa", content: PATHS.html.map},
    community: {title: "Community", content: PATHS.html.community},
    goals: {title: "Missioni", content: PATHS.html.goals},
    profile: {title: "Il mio Profilo", content: PATHS.html.profile},
};

let loadProfileOverview, initializeHomepageFilters, initializeMap;

Promise.all([
    import("./profile.js").then((m) => (loadProfileOverview = m.loadProfileOverview)),
    import("./homepage.js").then((m) => (initializeHomepageFilters = m.initializeHomepageFilters)),
    import("../map.js").then((m) => (initializeMap = m.initializeMap)),
]).catch(() => {
});

async function loadHeader() {
    const response = await fetch(PATHS.html.header);
    if (!response.ok) return;

    const html = await response.text();
    const header = document.querySelector("header.app-header");
    if (!header) return;

    const parsed = new DOMParser().parseFromString(html, "text/html");
    const newHeader = parsed.querySelector("header");
    if (!newHeader) return;

    header.innerHTML = newHeader.innerHTML;
    Array.from(newHeader.attributes).forEach((attr) => header.setAttribute(attr.name, attr.value));
}

async function loadToolbar() {
    const response = await fetch(PATHS.html.toolbar);
    if (!response.ok) return;

    const html = await response.text();
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;

    const parsed = new DOMParser().parseFromString(html, "text/html");
    const newToolbar = parsed.querySelector("nav");
    if (!newToolbar) return;

    toolbar.innerHTML = newToolbar.innerHTML;
    Array.from(newToolbar.attributes).forEach((attr) => toolbar.setAttribute(attr.name, attr.value));
}

function closeAnyOverlay(main) {
    if (!main) return;

    main.querySelectorAll("[data-overlay-view]").forEach((el) => el.remove());

    main.querySelectorAll("[data-section-view]").forEach((el) => (el.hidden = false));
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    await loadToolbar();

    const main = document.getElementById("main");
    const toolbar = document.querySelector(".app-toolbar");
    const titleEl = document.getElementById("header-title");
    const logoTextEl = document.getElementById("header-logo-text");

    if (!main || !toolbar) return;

    const sectionState = new Map();

    let currentSection = null;
    let isNavigating = false;

    toolbar.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-section]");
        if (!btn) return;

        if (btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true") return;

        e.preventDefault();

        const next = btn.dataset.section;
        if (!next || next === currentSection) return;

        await navigateTo(next);
    });

    await navigateTo("homepage");

    async function navigateTo(section) {
        if (isNavigating) return;
        isNavigating = true;

        try {
            const cfg = SECTION_CONFIG[section];
            if (!cfg) return;

            closeAnyOverlay(main);

            updateHeader(section, cfg);

            await mountSection(section, cfg);
            currentSection = section;

            main.scrollTop = 0;
        } finally {
            isNavigating = false;
        }
    }

    function updateHeader(section, cfg) {
        if (!titleEl || !logoTextEl) return;

        const headerLeftLogo = document.querySelector(".header-left-logo");
        const isHome = section === "homepage";

        logoTextEl.style.display = isHome ? "" : "none";
        titleEl.classList.toggle("hidden", isHome);

        if (!isHome) titleEl.textContent = cfg.title;

        if (headerLeftLogo?.querySelector("#header-back-button")) {
            headerLeftLogo.innerHTML = `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
        }
    }

    async function mountSection(section, cfg) {
        if (sectionState.has(section)) {
            showOnly(section);
            return;
        }

        const res = await fetch(cfg.content);
        if (!res.ok) {
            main.innerHTML = `<div class="p-4">Errore caricamento</div>`;
            sectionState.clear();
            return;
        }

        const html = await res.text();

        const wrapper = document.createElement("div");
        wrapper.dataset.sectionView = section;
        wrapper.hidden = true;
        wrapper.innerHTML = html;

        main.appendChild(wrapper);
        sectionState.set(section, {el: wrapper, initialized: false});

        showOnly(section);

        await initSectionOnce(section, cfg);

        const st = sectionState.get(section);
        if (st) st.initialized = true;
    }

    function showOnly(activeSection) {
        for (const [section, {el}] of sectionState.entries()) {
            el.hidden = section !== activeSection;
        }

        activateToolbar(activeSection);
    }

    async function initSectionOnce(section, cfg) {
        const st = sectionState.get(section);
        if (!st || st.initialized) return;

        if (cfg.content.includes("map.html")) await initializeMap?.();
        if (cfg.content.includes("profile.html")) await loadProfileOverviewWrapper(st.el);
        if (cfg.content.includes("homepage.html")) await initializeHomepageFilters?.();
    }

    async function loadProfileOverviewWrapper(wrapper) {
        await loadProfileOverview(wrapper);
        wrapper.setAttribute("data-section-view", "profile");
    }
});
