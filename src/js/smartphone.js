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

// Importa le funzioni del profilo
import {loadProfileOverview} from "./profile.js";

async function loadHeader() {
    const response = await fetch("./html/header.html");
    if (!response.ok) {
        console.error(`Errore caricamento header: ${response.statusText}`);
        return;
    }

    const html = await response.text();
    const header = document.querySelector("header.app-header");
    if (header) {
        header.replaceWith(new DOMParser().parseFromString(html, "text/html").querySelector("header"));
    }
    console.log("✓ Header caricato");
}

async function loadToolbar() {
    const response = await fetch("./html/toolbar.html");
    if (!response.ok) {
        console.error(`Errore caricamento toolbar: ${response.statusText}`);
        return;
    }

    const html = await response.text();
    const toolbar = document.querySelector(".app-toolbar");
    if (toolbar) {
        toolbar.replaceWith(new DOMParser().parseFromString(html, "text/html").querySelector("nav"));
    }
    console.log("✓ Toolbar caricata");
}

document.addEventListener("DOMContentLoaded", async () => {
    // Carica header e toolbar da file HTML separati
    await loadHeader();
    await loadToolbar();

    const main = document.getElementById("main");
    const toolbar = document.querySelector(".app-toolbar");
    const titleEl = document.getElementById("header-title");
    const logoTextEl = document.getElementById("header-logo-text");

    if (!main || !toolbar) {
        console.error("main o toolbar non trovati");
        return;
    }

    toolbar.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-section]");
        if (!btn) return;
        navigateTo(btn.dataset.section);
    });

    // Homepage di default
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

        const isHome = section === "homepage";
        logoTextEl.classList.toggle("hidden", !isHome);
        titleEl.classList.toggle("hidden", isHome);

        if (!isHome) titleEl.textContent = cfg.title;
    }

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

    async function loadMainContent(cfg) {
        const res = await fetch(cfg.content, {cache: "no-store"});
        if (!res.ok) {
            console.error(`Errore caricamento contenuto: ${res.statusText}`);
            main.innerHTML = `<div class="p-4">Errore caricamento</div>`;
            return;
        }

        main.innerHTML = await res.text();

        // Se è la pagina del profilo, carica da profile.js
        if (cfg.content.includes('profile.html')) {
            await loadProfileOverview();
        }

        main.scrollTop = 0;
    }
});

export {};
