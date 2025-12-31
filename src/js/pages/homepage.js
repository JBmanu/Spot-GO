import {refreshHorizontalCarousel, refreshVerticalCarousel} from "../common/carousels.js";
import {initializeBookmarks, syncBookmarksUI} from "../common/bookmark.js";
import {initializeSpotClickHandlers} from "./spotDetail.js";
import {populateSavedSpots} from "./populateSavedSpots.js";
import {populateNearbySpots} from "./populateNearbySpots.js";
import {populateTopratedSpots} from "./populateTopratedCards.js";
import {initFitText} from "../common/fitText.js";
import {loadHomepageSections} from "../common/homepageSectionsLoader.js";
import {
    setupCategoryFilter, resetCategoryFilter, filterSpotsByCategory, getActiveCategories,
} from "../common/categoryFilter.js";
import {loadViewAllSaved} from "./viewAllSaved.js";

const HOST_ID = "main";

const HOME = {
    categoriesId: "home-categories-container",
    savedRootId: "home-saved-container",
    nearbySectionId: "home-nearby-section",
    nearbyCarouselRootId: "home-nearby-container",
    topratedRootId: "home-toprated-carousel",
    savedCardSelector: ".spot-card-saved",
    nearbyCardSelector: ".spot-card-nearby",
    topratedCardSelector: ".spot-card-toprated",
};

const $ = (id) => document.getElementById(id);
const nearbyRoot = () => $(HOME.nearbyCarouselRootId) || $(HOME.nearbySectionId);

let homeBuiltOnce = false;
let categoryFilterAttached = false;
let spotHandlersAttached = false;
let bookmarkChangedListenerAttached = false;

function ensureSeeAllSavedButtonBound() {
    const btn = document.getElementById("home-saved-see-all");
    if (!btn) return;

    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        loadViewAllSaved("homepage").catch(() => {
        });
    });
}

function ensureBookmarkChangedListener() {
    if (bookmarkChangedListenerAttached) return;
    bookmarkChangedListenerAttached = true;

    document.addEventListener("bookmark:changed", (e) => {
        const {spotId, isSaved} = e.detail || {};
        if (!spotId) return;

        const hostEl = $(HOST_ID);
        if (!hostEl) return;

        const buttons = hostEl.querySelectorAll("[data-bookmark-button]");
        buttons.forEach((btn) => {
            const card = btn.closest('[role="listitem"]');
            if (!card) return;

            const cardSpotId = card.getAttribute("data-spot-id");
            if (String(cardSpotId) !== String(spotId)) return;

            btn.dataset.saved = isSaved ? "true" : "false";
            initializeBookmarks(card);

            if (!isSaved) {
                const savedContainer = document.getElementById("home-saved-container");
                if (savedContainer && savedContainer.contains(card)) {
                    card.remove();
                    refreshHorizontalCarousel(savedContainer, {cardSelector: ".spot-card-saved"});
                }
            }
        });
    });
}

async function buildHomeOnce(hostEl) {
    const categoryContainer = $(HOME.categoriesId);
    if (!categoryContainer) return;

    resetCategoryFilter(categoryContainer);

    await loadHomepageSections({
        onSavedLoaded: async () => {
            await populateSavedSpots({containerId: HOME.savedRootId});

            initFitText(".spot-card--saved .spot-card-title", `#${HOME.savedRootId}`, 2, 10.5);

            const root = $(HOME.savedRootId);
            if (root) refreshHorizontalCarousel(root, {cardSelector: HOME.savedCardSelector});

            filterSpotsByCategory(getActiveCategories(), hostEl);
        },

        onNearbyLoaded: async () => {
            await populateNearbySpots({containerId: HOME.nearbyCarouselRootId});

            const root = $(HOME.nearbyCarouselRootId);
            if (root) refreshHorizontalCarousel(root, {cardSelector: HOME.nearbyCardSelector});

            filterSpotsByCategory(getActiveCategories(), root || hostEl);
        },

        onTopRatedLoaded: async () => {
            await populateTopratedSpots({containerId: HOME.topratedRootId, limit: 10});

            const root = $(HOME.topratedRootId);
            if (root) refreshVerticalCarousel(root, {cardSelector: HOME.topratedCardSelector});

            filterSpotsByCategory(getActiveCategories(), hostEl);
        },
    });

    if (!categoryFilterAttached) {
        setupCategoryFilter(categoryContainer, {
            scopeEl: hostEl, onChange: () => {
                const savedRoot = $(HOME.savedRootId);
                if (savedRoot) refreshHorizontalCarousel(savedRoot, {cardSelector: HOME.savedCardSelector});

                const nearbyEl = nearbyRoot();
                if (nearbyEl) refreshHorizontalCarousel(nearbyEl, {cardSelector: HOME.nearbyCardSelector});

                const topratedRoot = $(HOME.topratedRootId);
                if (topratedRoot) refreshVerticalCarousel(topratedRoot, {cardSelector: HOME.topratedCardSelector});
            },
        });
        categoryFilterAttached = true;
    }

    if (!spotHandlersAttached) {
        initializeSpotClickHandlers(hostEl);
        spotHandlersAttached = true;
    }

    initializeBookmarks(hostEl);
    await syncBookmarksUI(hostEl);

    ensureBookmarkChangedListener();

    filterSpotsByCategory(getActiveCategories(), hostEl);

    ensureSeeAllSavedButtonBound();

    homeBuiltOnce = true;
}

export async function initializeHomepageFilters() {
    const hostEl = $(HOST_ID);
    if (!hostEl) return;

    if (homeBuiltOnce) {
        initializeBookmarks(hostEl);
        await syncBookmarksUI(hostEl);
        filterSpotsByCategory(getActiveCategories(), hostEl);

        ensureSeeAllSavedButtonBound();

        ensureBookmarkChangedListener();

        return;
    }

    await buildHomeOnce(hostEl);
}

export async function rehydrateHomepageUI() {
    await initializeHomepageFilters();
}
