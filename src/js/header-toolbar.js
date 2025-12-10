const SECTION_CONFIG = {
    home: {
        title: "Spot & Go",
        content: "home.html",
        icon: {
            active: "../assets/icons/filled/HomePageFill.svg",
            inactive: "../assets/icons/empty/HomePage.svg",
        },
    },
    map: {
        title: "Mappa",
        content: "map.html",
        icon: {
            active: "../assets/icons/filled/MapFill.svg",
            inactive: "../assets/icons/empty/Map.svg",
        },
    },
    social: {
        title: "Community",
        content: "community.html",
        icon: {
            active: "../assets/icons/filled/UserGroupsFill.svg",
            inactive: "../assets/icons/empty/UserGroups.svg",
        },
    },
    missions: {
        title: "Missioni",
        content: "goals.html",
        icon: {
            active: "../assets/icons/filled/GoalFill.svg",
            inactive: "../assets/icons/empty/Goal.svg",
        },
    },
    profile: {
        title: "Il mio Profilo",
        content: "profile.html",
        icon: {
            active: "../assets/icons/filled/CustomerFill.svg",
            inactive: "../assets/icons/empty/Customer.svg",
        },
    },
};

document.addEventListener("DOMContentLoaded", () => {
    Promise.all([loadHeader(), loadToolbar()]).then(() => {
        setupToolbarListeners();
        setActiveSection("home");
    });
});

function loadHeader() {
    return fetch("header.html")
        .then((response) => response.text())
        .then((html) => {
            document.getElementById("header-container").innerHTML = html;
        })
        .catch((error) => {
            console.error("Errore nel caricamento dell’header:", error);
        });
}

function loadToolbar() {
    return fetch("toolbar.html")
        .then((response) => response.text())
        .then((html) => {
            document.getElementById("toolbar-container").innerHTML = html;
        })
        .catch((error) => {
            console.error("Errore nel caricamento della toolbar:", error);
        });
}

function setupToolbarListeners() {
    const buttons = document.querySelectorAll(
        "#toolbar-container button[data-section]"
    );

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const section = button.getAttribute("data-section");
            setActiveSection(section);
        });
    });
}

function setActiveSection(section) {
    if (!SECTION_CONFIG[section]) {
        console.warn("Sezione non configurata:", section);
        return;
    }

    updateHeader(section);
    updateToolbar(section);
    loadContent(section);
}

function updateHeader(section) {
    const cfg = SECTION_CONFIG[section];

    const titleEl = document.getElementById("header-title");
    const logoTextEl = document.getElementById("header-logo-text");

    if (!titleEl || !logoTextEl) return;

    if (section === "home") {
        // Home
        logoTextEl.classList.remove("hidden");
        titleEl.classList.add("hidden");
    } else {
        // Mappa - Community - Missioni - Profilo
        logoTextEl.classList.add("hidden");
        titleEl.classList.remove("hidden");
        titleEl.textContent = cfg.title;
    }
}


function updateToolbar(activeSection) {
    const buttons = document.querySelectorAll(
        "#toolbar-container button[data-section]"
    );

    buttons.forEach((button) => {
        const section = button.getAttribute("data-section");
        const img = button.querySelector("img[data-role='icon']");

        if (!img || !SECTION_CONFIG[section]) return;

        const {icon} = SECTION_CONFIG[section];

        if (section === activeSection) {
            button.classList.remove("text-toolbarText");
            button.classList.add("text-spotPrimary");
            img.src = icon.active;
        } else {
            button.classList.remove("text-spotPrimary");
            button.classList.add("text-toolbarText");
            img.src = icon.inactive;
        }
    });
}

function loadContent(section) {
    const cfg = SECTION_CONFIG[section];
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    fetch(cfg.content)
        .then((response) => response.text())
        .then((html) => {
            mainEl.innerHTML = html;
        })
        .catch((error) => {
            console.error("Errore nel caricamento del contenuto:", error);
        });
}
