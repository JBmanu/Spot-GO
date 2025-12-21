// Gestisce i filtri categoria per mostrare/nascondere gli spot in base alla categoria selezionata

import { initializeCarousel } from "./carousel.js";
import { initializeBookmarks } from "./bookmark.js";
import { initializeSavedBookmarks } from "./savedBookmarks.js";

let activeCategories = new Set();

// Inizializza i filtri categoria e carica le sezioni
export function initializeHomepageFilters() {
    const categoryContainer = document.getElementById("home-categories-container");

    if (!categoryContainer) {
        return;
    }

    // Carica le sezioni
    loadSavedSpotsSection();
    loadNearbySpotsSection();
    loadVerticalCarouselSection();

    // Gestisci i click sui filtri categoria
    categoryContainer.addEventListener("click", (e) => {
        const button = e.target.closest(".home-chip");
        if (!button) return;

        const category = button.dataset.category;

        // Toggle categoria attiva
        if (activeCategories.has(category)) {
            deactivateCategory(categoryContainer, category);
        } else {
            activateCategory(categoryContainer, category);
        }

        // Filtra gli spot in base alle categorie selezionate
        loadContentByCategories(Array.from(activeCategories));
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

// Attiva una categoria e aggiorna lo stile del bottone
function activateCategory(container, category) {
    activeCategories.add(category);

    const button = container.querySelector(`[data-category="${category}"]`);
    if (button) {
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
    }
}

// Disattiva una categoria e aggiorna lo stile del bottone
function deactivateCategory(container, category) {
    activeCategories.delete(category);

    const button = container.querySelector(`[data-category="${category}"]`);
    if (button) {
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
    }
}

// Filtra gli spot in base alle categorie selezionate
async function loadContentByCategories(categories) {
    filterSpotsByCategory(categories);
}

// Mostra/nasconde i card in base alle categorie selezionate
function filterSpotsByCategory(categories) {
    const allSpotCards = document.querySelectorAll('[role="listitem"][data-spot-id]');

    allSpotCards.forEach(card => {
        const spotCategory = card.querySelector('[data-field="category"]');
        if (!spotCategory) return;

        const categoryText = spotCategory.textContent.trim().toLowerCase();
        const normalizedCategory = normalizeCategoryName(categoryText);

        // Se nessuna categoria è selezionata, mostra tutti
        if (categories.length === 0) {
            card.style.display = '';
            return;
        }

        // Mostra solo se la categoria corrisponde
        const isInSelectedCategories = categories.some(cat =>
            normalizeCategoryName(cat) === normalizedCategory
        );

        card.style.display = isInSelectedCategories ? '' : 'none';
    });
}

// Normalizza i nomi delle categorie per il confronto
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

async function loadViewAllSaved() {
    try {
        const response = await fetch("../html/homepage-pages/view-all/view-all-saved.html");
        if (!response.ok) return;

        const html = await response.text();
        const main = document.getElementById("main");

        if (main) {
            main.innerHTML = html;
            initializeCarousel(".vertical-carousel-track");
            initializeSavedBookmarks();

            const backButton = main.querySelector("#view-all-saved-back");
            if (backButton) {
                backButton.addEventListener("click", () => {
                    initializeHomepageFilters();
                });
            }
        }
    } catch (err) {
        console.error("Errore nel caricamento view-all-saved:", err);
    }
}

export { activeCategories };

