import { initializeCarousel } from "./carousel.js";
import { initializeBookmarks } from "./bookmark.js";
import { initializeSavedBookmarks } from "./savedBookmarks.js";

let activeCategories = new Set();

const SECTION_CONFIG = {
    homepage: { icon: { inactive: "./assets/icons/empty/HomePage.svg", active: "./assets/icons/filled/HomePageFill.svg" } },
    map: { icon: { inactive: "./assets/icons/empty/Map.svg", active: "./assets/icons/filled/MapFill.svg" } },
    community: { icon: { inactive: "./assets/icons/empty/UserGroups.svg", active: "./assets/icons/filled/UserGroupsFill.svg" } },
    goals: { icon: { inactive: "./assets/icons/empty/Goal.svg", active: "./assets/icons/filled/GoalFill.svg" } },
    profile: { icon: { inactive: "./assets/icons/empty/Customer.svg", active: "./assets/icons/filled/CustomerFill.svg" } },
};

export function initializeHomepageFilters() {
    const categoryContainer = document.getElementById("home-categories-container");

    if (!categoryContainer) {
        return;
    }

    loadSavedSpotsSection();
    loadNearbySpotsSection();
    loadVerticalCarouselSection();

    categoryContainer.addEventListener("click", (e) => {
        const button = e.target.closest(".home-chip");
        if (!button) return;

        const category = button.dataset.category;
        const isActive = activeCategories.has(category);

        if (isActive) {
            activeCategories.delete(category);
            button.classList.remove("active");
            button.setAttribute("aria-pressed", "false");
        } else {
            activeCategories.add(category);
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");
        }

        filterSpotsByCategory(Array.from(activeCategories));
    });
}

// Carica la sezione "Spots salvati"
async function loadSavedSpotsSection() {
    try {
        const response = await fetch("../html/homepage-pages/saved-spots-section.html");
        if (!response.ok) return;

        const html = await response.text();
        const container = document.getElementById("home-saved-section");

        if (container) {
            container.innerHTML = html;
            initializeCarousel(".saved-swipe-track");
            initializeSavedBookmarks();

            const seeAllButton = container.querySelector("#home-saved-see-all");
            if (seeAllButton) {
                seeAllButton.addEventListener("click", async () => {
                    await loadViewAllSaved();
                });
            }
        }
    } catch (err) {
        // Errore nel caricamento
    }
}

// Carica la sezione "Spots vicino a te"
async function loadNearbySpotsSection() {
    try {
        const response = await fetch("../html/homepage-pages/nearby-spots-section.html");
        if (!response.ok) return;

        const html = await response.text();
        const container = document.getElementById("home-nearby-section");

        if (container) {
            container.innerHTML = html;
            initializeCarousel(".nearby-swipe-track");
            initializeBookmarks();
        }
    } catch (err) {
        // Errore nel caricamento
    }
}

// Carica il carosello verticale "Tendenze"
async function loadVerticalCarouselSection() {
    try {
        const response = await fetch("../html/homepage-pages/vertical-carousel-section.html");
        if (!response.ok) return;

        const html = await response.text();
        const container = document.getElementById("home-vertical-section");

        if (container) {
            container.innerHTML = html;
            initializeBookmarks();
        }
    } catch (err) {
        // Errore nel caricamento
    }
}

function filterSpotsByCategory(categories) {
    const allSpotCards = document.querySelectorAll('[role="listitem"][data-spot-id]');

    allSpotCards.forEach(card => {
        const spotCategory = card.querySelector('[data-field="category"]');
        if (!spotCategory) return;

        const categoryText = spotCategory.textContent.trim().toLowerCase();
        const normalizedCategory = normalizeCategoryName(categoryText);

        if (categories.length === 0) {
            card.style.display = '';
            return;
        }

        const isInSelectedCategories = categories.some(cat =>
            normalizeCategoryName(cat) === normalizedCategory
        );

        card.style.display = isInSelectedCategories ? '' : 'none';
    });
}

function normalizeCategoryName(categoryName) {
    const categoryMap = {
        'cibo': 'food',
        'cultura': 'culture',
        'natura': 'nature',
        'mistero': 'mystery',
        'food': 'food',
        'culture': 'culture',
        'nature': 'nature',
        'mystery': 'mystery'
    };

    return categoryMap[categoryName.toLowerCase()] || categoryName.toLowerCase();
}

function updateToolbarIcons(sections, activeSection = null) {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;

    toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
        const section = btn.dataset.section;
        const isActive = section === activeSection;

        btn.classList.toggle("text-spotPrimary", isActive);
        btn.classList.toggle("text-toolbarText", !isActive);

        const icon = btn.querySelector("[data-role='icon']");
        if (icon && SECTION_CONFIG[section]) {
            icon.src = isActive ? SECTION_CONFIG[section].icon.active : SECTION_CONFIG[section].icon.inactive;
        }
    });
}

async function loadViewAllSaved() {
    try {
        const response = await fetch("../html/homepage-pages/view-all/view-all-saved.html");
        if (!response.ok) return;

        const html = await response.text();
        const main = document.getElementById("main");
        const headerLeftLogo = document.querySelector(".header-left-logo");
        const headerLogoText = document.getElementById("header-logo-text");
        const headerTitle = document.getElementById("header-title");

        if (!main) return;

        main.innerHTML = html;

        headerLeftLogo.innerHTML = `<button type="button" id="header-back-button" aria-label="Torna indietro" class="flex items-center justify-center w-10 h-10">
            <img src="../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
        </button>`;
        headerLogoText.style.display = "none";
        headerTitle.textContent = "";
        headerTitle.classList.add("hidden");

        updateToolbarIcons(Object.keys(SECTION_CONFIG));

        initializeCarousel(".vertical-carousel-track");
        initializeSavedBookmarks();

        const backButton = document.getElementById("header-back-button");
        if (backButton) {
            backButton.addEventListener("click", async () => {
                headerLeftLogo.innerHTML = `<img src="../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
                headerLogoText.style.display = "";
                headerTitle.classList.add("hidden");
                updateToolbarIcons(Object.keys(SECTION_CONFIG), "homepage");

                try {
                    const response = await fetch("../html/homepage.html");
                    if (!response.ok) return;

                    const html = await response.text();
                    main.innerHTML = html;
                    initializeHomepageFilters();
                } catch (err) {
                    console.error("Errore nel caricamento homepage:", err);
                }
            });
        }
    } catch (err) {
        console.error("Errore nel caricamento view-all-saved:", err);
    }
}

export { activeCategories };

