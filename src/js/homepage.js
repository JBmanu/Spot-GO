import { initializeCarousel } from "./carousel.js";
import { initializeBookmarks, syncAllBookmarks } from "./bookmark.js";
import {
    initializeSpotClickHandlers,
    populateSpotCards,
    populateSavedSpots,
} from "./spotDetail.js";

let activeCategories = new Set();
let previousPage = "homepage";

/**
 * Configura filtri e carica le sezioni principali della homepage.
 * Inizializza card, bookmark e sincronizzazione iniziale.
 */
export function initializeHomepageFilters() {
    const categoryContainer = document.getElementById("home-categories-container");
    if (!categoryContainer) return;

    loadSavedSpotsSection();
    loadNearbySpotsSection();
    loadVerticalCarouselSection();

    (async () => {
        await populateSpotCards();
        initializeSpotClickHandlers();
        initializeBookmarks();
        await syncAllBookmarks();
    })().catch((err) => console.error("Errore init homepage:", err));

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

/**
 * Carica la sezione "Saved Spots" e la popola.
 */
async function loadSavedSpotsSection() {
    try {
        const response = await fetch("../html/homepage-pages/saved-spots-section.html");
        if (!response.ok) return;

        const container = document.getElementById("home-saved-section");
        if (!container) return;

        container.innerHTML = await response.text();

        initializeCarousel(".saved-swipe-track");
        initializeBookmarks();

        await populateSavedSpots();
        initializeBookmarks();
        await syncAllBookmarks();

        const seeAllButton = container.querySelector("#home-saved-see-all");
        if (seeAllButton) {
            seeAllButton.addEventListener("click", async () => {
                await loadViewAllSaved();
            });
        }
    } catch (err) {
        console.error("Errore loadSavedSpotsSection:", err);
    }
}

/**
 * Carica la sezione "Nearby".
 */
async function loadNearbySpotsSection() {
    try {
        const response = await fetch("../html/homepage-pages/nearby-spots-section.html");
        if (!response.ok) return;

        const container = document.getElementById("home-nearby-section");
        if (!container) return;

        container.innerHTML = await response.text();

        initializeCarousel(".nearby-swipe-track");
        initializeBookmarks();
    } catch (err) {
        console.error("Errore loadNearbySpotsSection:", err);
    }
}

/**
 * Carica la sezione "Top Rated".
 */
async function loadVerticalCarouselSection() {
    try {
        const response = await fetch("../html/homepage-pages/toprated-carousel-section.html");
        if (!response.ok) return;

        const container = document.getElementById("home-vertical-section");
        if (!container) return;

        container.innerHTML = await response.text();

        initializeCarousel(".vertical-carousel-track");
        initializeBookmarks();
    } catch (err) {
        console.error("Errore loadVerticalCarouselSection:", err);
    }
}

/**
 * Filtra le card degli spot in base alle categorie selezionate.
 */
function filterSpotsByCategory(categories) {
    const allSpotCards = document.querySelectorAll('[role="listitem"][data-spot-id]');

    allSpotCards.forEach((card) => {
        let categoryText = card.getAttribute("data-category");

        if (!categoryText) {
            const spotCategory = card.querySelector('[data-field="category"]');
            if (!spotCategory) return;
            categoryText = spotCategory.textContent.trim().toLowerCase();
        } else {
            categoryText = categoryText.toLowerCase();
        }

        const normalizedCategory = normalizeCategoryName(categoryText);

        if (categories.length === 0) {
            card.style.display = "";
            return;
        }

        const isInSelectedCategories = categories.some(
            (cat) => normalizeCategoryName(cat) === normalizedCategory
        );

        card.style.display = isInSelectedCategories ? "" : "none";
    });
}

/**
 * Normalizza il nome della categoria dall'italiano all'identificatore interno.
 * Restituisce la chiave standard (es. 'food','culture').
 */
function normalizeCategoryName(categoryName) {
    const categoryMap = {
        cibo: "food",
        cultura: "culture",
        natura: "nature",
        mistero: "mystery",
        food: "food",
        culture: "culture",
        nature: "nature",
        mystery: "mystery",
    };

    return categoryMap[categoryName.toLowerCase()] || categoryName.toLowerCase();
}

/**
 * Disattiva lo stato visuale della toolbar (rimuove classi attive).
 */
function deactivateAllToolbarButtons() {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;

    toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
        btn.classList.remove("active");
        const text = btn.querySelector("span");
        const icon = btn.querySelector("[data-role='icon']");
        if (text) {
            text.classList.remove("font-bold");
            text.classList.add("font-normal");
        }
        if (icon) {
            icon.classList.remove("scale-125");
        }
    });
}

/**
 * Mostra la pagina "View All Saved".
 */
async function loadViewAllSaved(fromPage = "homepage") {
    try {
        previousPage = fromPage;

        const response = await fetch("../html/homepage-pages/view-all/view-all-saved.html");
        if (!response.ok) return;

        const main = document.getElementById("main");
        const headerLeftLogo = document.querySelector(".header-left-logo");
        const headerLogoText = document.getElementById("header-logo-text");
        const headerTitle = document.getElementById("header-title");

        if (!main) return;

        main.innerHTML = await response.text();

        requestAnimationFrame(() => {
            main.classList.add("view-all-saved-enter");
        });

        headerLeftLogo.innerHTML = `
      <button type="button" id="header-back-button" aria-label="Torna indietro" class="flex items-center justify-center w-10 h-10">
        <img src="../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
      </button>
    `;
        headerLogoText.style.display = "none";
        headerTitle.textContent = "I tuoi Spot Salvati";
        headerTitle.classList.remove("hidden");

        deactivateAllToolbarButtons();

        initializeCarousel(".vertical-carousel-track");
        initializeBookmarks();

        (async () => {
            await populateSpotCards();
            initializeSpotClickHandlers();
            initializeBookmarks();
            await syncAllBookmarks();
        })().catch((err) => console.error("Errore init view-all-saved:", err));

        const backButton = document.getElementById("header-back-button");
        if (backButton) {
            backButton.addEventListener("click", async () => {
                main.classList.remove("view-all-saved-enter");
                main.classList.add("view-all-saved-exit");

                await new Promise((resolve) => setTimeout(resolve, 300));
                main.classList.remove("view-all-saved-exit");

                if (previousPage === "profile") {
                    await goToProfile();
                } else {
                    await goToHomepage();
                }
            });
        }
    } catch (err) {
        console.error("Errore nel caricamento view-all-saved:", err);
    }
}

async function goToHomepage() {
    const main = document.getElementById("main");
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    headerLeftLogo.innerHTML = `<img src="../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
    headerLogoText.style.display = "";
    headerTitle.classList.add("hidden");

    try {
        const response = await fetch("../html/homepage.html");
        if (!response.ok) return;

        main.innerHTML = await response.text();

        initializeHomepageFilters();

        const toolbar = document.querySelector(".app-toolbar");
        if (toolbar) {
            toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
                const section = btn.dataset.section;
                const isActive = section === "homepage";
                btn.classList.toggle("active", isActive);

                const text = btn.querySelector("span");
                const icon = btn.querySelector("[data-role='icon']");
                if (text) {
                    text.classList.toggle("font-bold", isActive);
                    text.classList.toggle("font-normal", !isActive);
                }
                if (icon) {
                    icon.classList.toggle("scale-125", isActive);
                }
            });
        }
    } catch (err) {
        console.error("Errore nel caricamento homepage:", err);
    }
}

async function goToProfile() {
    const main = document.getElementById("main");
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    headerLeftLogo.innerHTML = `<img src="../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
    headerLogoText.style.display = "none";
    headerTitle.classList.remove("hidden");
    headerTitle.textContent = "Il mio profilo";

    try {
        const response = await fetch("../html/profile.html");
        if (!response.ok) return;

        main.innerHTML = await response.text();

        const toolbar = document.querySelector(".app-toolbar");
        if (toolbar) {
            toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
                const section = btn.dataset.section;
                const isActive = section === "profile";
                btn.classList.toggle("active", isActive);

                const text = btn.querySelector("span");
                const icon = btn.querySelector("[data-role='icon']");
                if (text) {
                    text.classList.toggle("font-bold", isActive);
                    text.classList.toggle("font-normal", !isActive);
                }
                if (icon) {
                    icon.classList.toggle("scale-125", isActive);
                }
            });
        }

        const { loadProfileOverview } = await import("./profile.js");
        await loadProfileOverview();
    } catch (err) {
        console.error("Errore nel caricamento profilo:", err);
    }
}

export { activeCategories, loadViewAllSaved };
