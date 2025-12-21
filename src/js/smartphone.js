// Gestisce la navigazione tra sezioni della app e il caricamento dei contenuti

const SECTION_CONFIG = {
    homepage: {
        title: "Spot & Go",
        content: "./html/homepage.html",
        icon: {
            active: "./assets/icons/filled/HomePageFill.svg",
            inactive: "./assets/icons/empty/HomePage.svg",
        },
    },
    map: {
        title: "Mappa",
        content: "./html/map.html",
        icon: {
            active: "./assets/icons/filled/MapFill.svg",
            inactive: "./assets/icons/empty/Map.svg",
        },
    },
    community: {
        title: "Community",
        content: "./html/community.html",
        icon: {
            active: "./assets/icons/filled/UserGroupsFill.svg",
            inactive: "./assets/icons/empty/UserGroups.svg",
        },
    },
    goals: {
        title: "Missioni",
        content: "./html/goals.html",
        icon: {
            active: "./assets/icons/filled/GoalFill.svg",
            inactive: "./assets/icons/empty/Goal.svg",
        },
    },
    profile: {
        title: "Il mio Profilo",
        content: "./html/profile.html",
        icon: {
            active: "./assets/icons/filled/CustomerFill.svg",
            inactive: "./assets/icons/empty/Customer.svg",
        },
    },
};

import { loadProfileOverview } from "./profile.js";
import { initializeHomepageFilters } from "./homepage.js";
import { initializeMap } from "./map.js";

// Carica l'header da file separato
async function loadHeader() {
    const response = await fetch("../html/header.html");
    if (!response.ok) return;

    const html = await response.text();
    const header = document.querySelector("header.app-header");
    if (header) {
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const newHeader = parsed.querySelector("header");
        if (newHeader) {
            header.innerHTML = newHeader.innerHTML;
            // Copia gli attributi
            Array.from(newHeader.attributes).forEach(attr => {
                header.setAttribute(attr.name, attr.value);
            });
        }
    }
}

// Carica la toolbar da file separato
async function loadToolbar() {
    const response = await fetch("../html/toolbar.html");
    if (!response.ok) return;

    const html = await response.text();
    const toolbar = document.querySelector(".app-toolbar");
    if (toolbar) {
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const newToolbar = parsed.querySelector("nav");
        if (newToolbar) {
            toolbar.innerHTML = newToolbar.innerHTML;
            // Copia gli attributi
            Array.from(newToolbar.attributes).forEach(attr => {
                toolbar.setAttribute(attr.name, attr.value);
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    await loadToolbar();

    const main = document.getElementById("main");
    const toolbar = document.querySelector(".app-toolbar");
    const titleEl = document.getElementById("header-title");
    const logoTextEl = document.getElementById("header-logo-text");

    if (!main || !toolbar) return;

    toolbar.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-section]");
        if (!btn) return;
        navigateTo(btn.dataset.section);
    });

    navigateTo("homepage");

    // Naviga verso una sezione
    async function navigateTo(section) {
        const cfg = SECTION_CONFIG[section];
        if (!cfg) return;

        updateHeader(section, cfg);
        updateToolbar(section);
        await loadMainContent(cfg);
    }

    // Aggiorna l'header in base alla sezione attiva
    function updateHeader(section, cfg) {
        if (!titleEl || !logoTextEl) return;

        const headerLeftLogo = document.querySelector(".header-left-logo");
        const isHome = section === "homepage";

        logoTextEl.classList.toggle("hidden", !isHome);
        logoTextEl.style.display = isHome ? "" : "none";
        titleEl.classList.toggle("hidden", isHome);

        if (!isHome) titleEl.textContent = cfg.title;

        if (headerLeftLogo && headerLeftLogo.querySelector("#header-back-button")) {
            headerLeftLogo.innerHTML = `<img src="../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
        }
    }

    // Aggiorna gli stili della toolbar in base alla sezione attiva
    function updateToolbar(activeSection) {
        toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
            const section = btn.dataset.section;
            const cfg = SECTION_CONFIG[section];
            const icon = btn.querySelector("[data-role='icon']");
            if (!cfg || !icon) return;

            const active = section === activeSection;
            btn.classList.toggle("text-spotPrimary", active);
            btn.classList.toggle("text-toolbarText", !active);
            icon.src = active ? cfg.icon.active : cfg.icon.inactive;
        });
    }

    // Carica il contenuto principale della sezione
    async function loadMainContent(cfg) {
        const res = await fetch(cfg.content, { cache: "no-store" });
        if (!res.ok) {
            main.innerHTML = `<div class="p-4">Errore caricamento</div>`;
            return;
        }

        main.innerHTML = await res.text();

        if (cfg.content.includes('map.html')) {
            await initializeMap();
        }

        if (cfg.content.includes('profile.html')) {
            await loadProfileOverview();
        }

        if (cfg.content.includes('homepage.html')) {
            initializeHomepageFilters();
        }

        main.scrollTop = 0;
    }
});

export {};
