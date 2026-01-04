import {initializeHorizontalCarousel, initializeVerticalCarousel} from "../../common/carousels.js";
import {initializeBookmarks, syncBookmarksUI} from "../../common/bookmark.js";
import {initializeSpotClickHandlers} from "../spotDetail.js";
import {populateSavedSpots} from "../populateSavedSpots.js";
import {populateNearbySpots} from "../populateNearbySpots.js";
import {populateTopratedSpots} from "../populateTopratedCards.js";
import {initFitText} from "../../common/fitText.js";
import {setupHomeSections} from "./homepage-sections-loader.js";
import {
    filterSpotsByCategory, getActiveCategories, resetCategoryFilter, setupCategoryFilter,
} from "../../common/categoryFilter.js";
import {loadViewAllSaved} from "../viewAllSaved.js";

const HOME_ELEMENTS = {
    categoriesId: "home-categories-container",
    savedRootId: "home-saved-container",
    nearbySectionId: "home-nearby-section",
    nearbyCarouselRootId: "home-nearby-container",
    topratedRootId: "home-toprated-carousel",

    savedCardSelector: ".spot-card-saved",
    nearbyCardSelector: ".spot-card-nearby",
    topratedCardSelector: ".spot-card-toprated",
};

let isHomepageBuilt = false;
let isCategoryFilterAttached = false;
let areSpotClickHandlersAttached = false;
let isBookmarkChangeListenerAttached = false;

const $findElementById = (root, id) => root?.querySelector(`#${CSS.escape(id)}`) || null;

const getHomepageWrapper = () => document.querySelector('[data-section-view="homepage"]') || null;
const getNearbyCarouselRoot = (homepageRoot) => $findElementById(homepageRoot, HOME_ELEMENTS.nearbyCarouselRootId) || $findElementById(homepageRoot, HOME_ELEMENTS.nearbySectionId);

function ensureSeeAllSavedButtonBound(homepageRoot) {
    const btn = homepageRoot?.querySelector("#home-saved-see-all");
    if (!btn) return;
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadViewAllSaved("homepage").catch((err) => console.warn("Error loading view all saved:", err));
    });
}

function attachBookmarkChangeListener() {
    if (isBookmarkChangeListenerAttached) return;
    isBookmarkChangeListenerAttached = true;

    document.addEventListener("bookmark:changed", (e) => {
        const {spotId, isSaved} = e.detail || {};
        if (!spotId) return;
        const main = document.getElementById("main");
        if (!main) return;
        const buttons = main.querySelectorAll("[data-bookmark-button]");
        buttons.forEach((btn) => {
            const card = btn.closest('[role="listitem"]');
            if (!card) return;
            const cardSpotId = card.getAttribute("data-spot-id");
            if (String(cardSpotId) !== String(spotId)) return;
            btn.dataset.saved = isSaved ? "true" : "false";
            initializeBookmarks(card);
            if (!isSaved) {
                const savedContainer = main.querySelector('[data-section-view="homepage"] #home-saved-container') || main.querySelector("#home-saved-container");

                if (savedContainer && savedContainer.contains(card)) {
                    card.remove();
                    initializeHorizontalCarousel(savedContainer, {cardSelector: HOME_ELEMENTS.savedCardSelector});
                }
            }
        });
    });
}

/**
 * Costruisce il contenuto della homepage una volta, inclusi caricamento delle sezioni, popolamento dei dati e configurazione delle interazioni.
 * @param {HTMLElement} homepageRoot - L'elemento radice della sezione homepage.
 */
async function buildHomepageOnce(homepageRoot) {
    const categoryContainer = $findElementById(homepageRoot, HOME_ELEMENTS.categoriesId);
    if (!categoryContainer) return;

    resetCategoryFilter(categoryContainer);

    await setupHomeSections({
        onSavedLoaded: async () => {
            await populateSavedSpots({containerId: HOME_ELEMENTS.savedRootId});
            initFitText(".spot-card--saved .spot-card-title", `#${HOME_ELEMENTS.savedRootId}`, 2, 10.5);
            const root = $findElementById(homepageRoot, HOME_ELEMENTS.savedRootId);
            if (root) initializeHorizontalCarousel(root, {cardSelector: HOME_ELEMENTS.savedCardSelector});
            filterSpotsByCategory(getActiveCategories(), homepageRoot);
            ensureSeeAllSavedButtonBound(homepageRoot);
        },

        onNearbyLoaded: async () => {
            await populateNearbySpots({containerId: HOME_ELEMENTS.nearbyCarouselRootId});
            const root = $findElementById(homepageRoot, HOME_ELEMENTS.nearbyCarouselRootId);
            if (root) initializeHorizontalCarousel(root, {cardSelector: HOME_ELEMENTS.nearbyCardSelector});
            filterSpotsByCategory(getActiveCategories(), root || homepageRoot);
        },

        onTopRatedLoaded: async () => {
            await populateTopratedSpots({containerId: HOME_ELEMENTS.topratedRootId, limit: 10});
            const root = $findElementById(homepageRoot, HOME_ELEMENTS.topratedRootId);
            if (root) initializeVerticalCarousel(root, {cardSelector: HOME_ELEMENTS.topratedCardSelector});
            filterSpotsByCategory(getActiveCategories(), homepageRoot);
        },
    });

    if (!isCategoryFilterAttached) {
        setupCategoryFilter(categoryContainer, {
            scopeEl: homepageRoot, onChange: () => {
                updateCarouselsAfterFilterChange(homepageRoot);
            },
        });
        isCategoryFilterAttached = true;
    }

    if (!areSpotClickHandlersAttached) {
        initializeSpotClickHandlers(homepageRoot);
        areSpotClickHandlersAttached = true;
    }

    initializeBookmarks(homepageRoot);
    await syncBookmarksUI(homepageRoot).catch((err) => console.warn("Error syncing bookmarks:", err));

    attachBookmarkChangeListener();
    filterSpotsByCategory(getActiveCategories(), homepageRoot);
    ensureSeeAllSavedButtonBound(homepageRoot);

    isHomepageBuilt = true;
}

/**
 * Reinizializza i carousel quando cambia il filtro di categoria.
 * @param {HTMLElement} homepageRoot - L'elemento radice della sezione homepage.
 */
function updateCarouselsAfterFilterChange(homepageRoot) {
    const savedRoot = $findElementById(homepageRoot, HOME_ELEMENTS.savedRootId);
    if (savedRoot) initializeHorizontalCarousel(savedRoot, {cardSelector: HOME_ELEMENTS.savedCardSelector});
    const nearbyEl = getNearbyCarouselRoot(homepageRoot);
    if (nearbyEl) initializeHorizontalCarousel(nearbyEl, {cardSelector: HOME_ELEMENTS.nearbyCardSelector});
    const topratedRoot = $findElementById(homepageRoot, HOME_ELEMENTS.topratedRootId);
    if (topratedRoot) initializeVerticalCarousel(topratedRoot, {cardSelector: HOME_ELEMENTS.topratedCardSelector});
}

/**
 * Inizializza o reidrata i filtri e le interazioni della homepage.
 * @param {HTMLElement} [homepageElement] - Elemento radice opzionale; per default è il wrapper della homepage.
 */
export async function setupHomepageFilters(homepageElement) {
    const homepageRoot = homepageElement || getHomepageWrapper();
    if (!homepageRoot) return;

    if (isHomepageBuilt) {
        initializeBookmarks(homepageRoot);
        await syncBookmarksUI(homepageRoot).catch((err) => console.warn("Error syncing bookmarks:", err));
        filterSpotsByCategory(getActiveCategories(), homepageRoot);
        updateCarouselsAfterFilterChange(homepageRoot);
        ensureSeeAllSavedButtonBound(homepageRoot);
        attachBookmarkChangeListener();
        initializeSpotClickHandlers(homepageRoot);

        return;
    }

    await buildHomepageOnce(homepageRoot);
}

/**
 * Reidrata l'UI della homepage, tipicamente chiamata dopo la navigazione.
 * @param {HTMLElement} [homepageElement] - Elemento radice opzionale; per default è il wrapper della homepage.
 */
export async function restoreHomepageUI(homepageElement) {
    await setupHomepageFilters(homepageElement);
}
