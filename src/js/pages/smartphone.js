import { PATHS } from "../paths.js";

const SECTION_CONFIG = {
    homepage: {
        title: "Spot & Go",
        content: PATHS.html.homepage,
    },
    map: {
        title: "Mappa",
        content: PATHS.html.map,
    },
    community: {
        title: "Community",
        content: PATHS.html.community,
    },
    goals: {
        title: "Missioni",
        content: PATHS.html.goals,
    },
    profile: {
        title: "Il mio Profilo",
        content: PATHS.html.profile,
    },
};

let loadProfileOverview, initializeHomepageFilters, initializeMap, initCommunity;

Promise.all([
    import("./profile.js").then(m => loadProfileOverview = m.loadProfileOverview),
    import("./homepage.js").then(m => initializeHomepageFilters = m.initializeHomepageFilters),
    import("../map.js").then(m => initializeMap = m.initializeMap),
    import("./community.js").then(m => initCommunity = m.loadCommunityData),
]).catch(err =>
    console.error("Errore nel caricamento dei moduli in smartphone.js:", err)
);

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
    Array.from(newHeader.attributes).forEach(attr =>
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
    Array.from(newToolbar.attributes).forEach(attr =>
        toolbar.setAttribute(attr.name, attr.value)
    );
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    await loadToolbar();

    const main = document.getElementById("main");
    const toolbar = document.querySelector(".app-toolbar");
    const titleEl = document.getElementById("header-title");
    const logoTextEl = document.getElementById("header-logo-text");

    if (!main || !toolbar) return;

    toolbar.addEventListener("click", e => {
        const btn = e.target.closest("button[data-section]");
        if (!btn) return;
        navigateTo(btn.dataset.section);
    });

    navigateTo("homepage");

    async function navigateTo(section) {
        const cfg = SECTION_CONFIG[section];
        if (!cfg) return;

        updateHeader(section, cfg);
        updateToolbar(section);
        await loadMainContent(cfg);
    }

    function updateHeader(section, cfg) {
        if (!titleEl || !logoTextEl) return;

        const headerLeftLogo = document.querySelector(".header-left-logo");
        const isHome = section === "homepage";

        logoTextEl.style.display = isHome ? "" : "none";
        titleEl.classList.toggle("hidden", isHome);

        if (!isHome) titleEl.textContent = cfg.title;

        if (headerLeftLogo?.querySelector("#header-back-button")) {
            headerLeftLogo.innerHTML =
                `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
        }
    }

    function updateToolbar(activeSection) {
        toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
            const isActive = btn.dataset.section === activeSection;
            if (isActive) btn.setAttribute("aria-current", "page");
            else btn.removeAttribute("aria-current");
        });
    }


    async function loadMainContent(cfg) {
        const res = await fetch(cfg.content, { cache: "no-store" });
        if (!res.ok) {
            main.innerHTML = `<div class="p-4">Errore caricamento</div>`;
            return;
        }

        main.innerHTML = await res.text();

        if (cfg.content.includes("map.html")) await initializeMap?.();
        if (cfg.content.includes("profile.html")) await loadProfileOverview?.();
        if (cfg.content.includes("homepage.html")) await initializeHomepageFilters?.();
        if (cfg.content.includes("community.html")) await initCommunity?.();
        
        main.scrollTop = 0;
    }
});

export {};
