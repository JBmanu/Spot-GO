import { PATHS } from "../paths.js";
import {
    activateToolbar,
    resetHeaderBaseForSection,
    closeOverlayAndReveal,
} from "../common/back.js";

const SECTION_CONFIG = {
    homepage: { title: "Spot & Go", content: PATHS.html.homepage },
    map: { title: "Mappa", content: PATHS.html.map },
    community: { title: "Community", content: PATHS.html.community },
    goals: { title: "Missioni", content: PATHS.html.goals },
    profile: { title: "Il mio Profilo", content: PATHS.html.profile },
};

let loadProfileOverview, initializeHomepageFilters, initializeMap;

Promise.all([
    import("./profile.js").then((m) => (loadProfileOverview = m.loadProfileOverview)),
    import("./homepage.js").then((m) => (initializeHomepageFilters = m.initializeHomepageFilters)),
    import("../map.js").then((m) => (initializeMap = m.initializeMap)),
]).catch(() => {});

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
    Array.from(newHeader.attributes).forEach((attr) =>
        header.setAttribute(attr.name, attr.value)
    );
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
    Array.from(newToolbar.attributes).forEach((attr) =>
        toolbar.setAttribute(attr.name, attr.value)
    );
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    await loadToolbar();

    const main = document.getElementById("main");
    const toolbar = document.querySelector(".app-toolbar");
    const titleEl = document.getElementById("header-title");

    if (!main || !toolbar) return;

    const sectionState = new Map();
    let currentSection = null;
    let isNavigating = false;

    toolbar.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-section]");
        if (!btn) return;

        if (btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true") return;

        e.preventDefault();

        const next = (btn.dataset.section || "").trim();
        if (!next) return;

        const overlay = main.querySelector("[data-overlay-view]");
        if (overlay) closeOverlayAndReveal({ overlay });

        currentSection = getVisibleSectionKey(main) || currentSection;

        if (next === currentSection) return;

        await navigateTo(next);
    });

    document.addEventListener("section:revealed", async (e) => {
        const shown = e?.detail?.section;
        if (!shown) return;

        currentSection = shown;

        if (shown === "homepage") {
            try {
                const mod = await import("./homepage.js");
                const homeWrapper = main.querySelector('[data-section-view="homepage"]');
                await mod.rehydrateHomepageUI?.(homeWrapper || document);
            } catch (_) {}
        }

        if (shown === "map") {
            try { await initializeMap?.(); } catch (_) {}
        }

        if (shown === "profile") {
            try {
                const profileWrapper = main.querySelector('[data-section-view="profile"]');
                if (profileWrapper) await loadProfileOverview?.(profileWrapper);
            } catch (_) {}
        }
    });

    await navigateTo("homepage");

    async function navigateTo(section) {
        if (isNavigating) return;
        isNavigating = true;

        try {
            const cfg = SECTION_CONFIG[section];
            if (!cfg) return;

            const overlay = main.querySelector("[data-overlay-view]");
            if (overlay) closeOverlayAndReveal({ overlay });

            updateHeader(section, cfg);

            await mountSection(section, cfg);
            currentSection = section;

            main.scrollTop = 0;
        } finally {
            isNavigating = false;
        }
    }

    window.navigateToSection = navigateTo;

    function updateHeader(section, cfg) {
        resetHeaderBaseForSection(section);

        const isHome = section === "homepage";
        if (!isHome && titleEl) titleEl.textContent = cfg.title;
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
        sectionState.set(section, { el: wrapper, initialized: false });

        showOnly(section);

        await initSectionOnce(section, cfg, wrapper);

        const st = sectionState.get(section);
        if (st) st.initialized = true;
    }

    function showOnly(activeSection) {
        for (const [section, { el }] of sectionState.entries()) {
            el.hidden = section !== activeSection;
        }
        activateToolbar(activeSection);
    }

    async function initSectionOnce(section, cfg, wrapperEl) {
        const st = sectionState.get(section);
        if (!st || st.initialized) return;

        if (cfg.content.includes("map.html")) await initializeMap?.();

        if (cfg.content.includes("homepage.html")) {
            await initializeHomepageFilters?.(wrapperEl);
        }

        if (cfg.content.includes("profile.html")) {
            await loadProfileOverviewWrapper(wrapperEl);
        }
    }

    async function loadProfileOverviewWrapper(wrapper) {
        if (!loadProfileOverview) return;
        await loadProfileOverview(wrapper);
        wrapper.dataset.sectionView = "profile";
    }

    function getVisibleSectionKey(mainEl) {
        const visible = mainEl.querySelector('[data-section-view]:not([hidden])');
        return visible?.dataset?.sectionView || null;
    }

    window.rebuildSectionState = () => {
        sectionState.clear();
        Array.from(main.children).forEach((el) => {
            if (!el?.hasAttribute?.("data-section-view")) return;
            const section = el.dataset.sectionView;
            if (!section) return;
            sectionState.set(section, { el, initialized: true });
        });

        currentSection = getVisibleSectionKey(main) || null;
    };
});
