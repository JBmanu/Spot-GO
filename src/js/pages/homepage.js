import {initializeHorizontalCarousel, initializeVerticalCarousel} from "../common/carousels.js";
import {initializeBookmarks, syncBookmarksUI} from "../common/bookmark.js";
import {initializeSpotClickHandlers} from "./spotDetail.js";
import {populateSavedSpots} from "./populateSavedSpots.js";
import {populateNearbySpots} from "./populateNearbySpots.js";
import {populateTopratedSpots} from "./populateTopratedCards.js";
import {initFitText} from "../common/fitText.js";
import {loadHomepageSections} from "../common/homepageSectionsLoader.js";
import {
    setupCategoryFilter,
    resetCategoryFilter,
    filterSpotsByCategory,
    getActiveCategories,
} from "../common/categoryFilter.js";
import {loadViewAllSaved} from "./viewAllSaved.js";

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

let homeBuiltOnce = false;
let categoryFilterAttached = false;
let spotHandlersAttached = false;
let bookmarkChangedListenerAttached = false;

const $in = (root, id) => root?.querySelector(`#${CSS.escape(id)}`) || null;

const getHomepageWrapper = () =>
    document.querySelector('[data-section-view="homepage"]') || null;

const nearbyRoot = (hostEl) =>
    $in(hostEl, HOME.nearbyCarouselRootId) || $in(hostEl, HOME.nearbySectionId);

function ensureSeeAllSavedButtonBound(hostEl) {
    const btn = hostEl?.querySelector("#home-saved-see-all");
    if (!btn) return;

    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
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
                const savedContainer =
                    main.querySelector('[data-section-view="homepage"] #home-saved-container') ||
                    main.querySelector("#home-saved-container");

                if (savedContainer && savedContainer.contains(card)) {
                    card.remove();
                    initializeHorizontalCarousel(savedContainer, {cardSelector: HOME.savedCardSelector});
                }
            }
        });
    });
}

async function buildHomeOnce(hostEl) {
    const categoryContainer = $in(hostEl, HOME.categoriesId);
    if (!categoryContainer) return;

    resetCategoryFilter(categoryContainer);

    await loadHomepageSections({
        onSavedLoaded: async () => {
            await populateSavedSpots({containerId: HOME.savedRootId});

            initFitText(".spot-card--saved .spot-card-title", `#${HOME.savedRootId}`, 2, 10.5);

            const root = $in(hostEl, HOME.savedRootId);
            if (root) initializeHorizontalCarousel(root, {cardSelector: HOME.savedCardSelector});

            filterSpotsByCategory(getActiveCategories(), hostEl);

            ensureSeeAllSavedButtonBound(hostEl);
        },

        onNearbyLoaded: async () => {
            await populateNearbySpots({containerId: HOME.nearbyCarouselRootId});

            const root = $in(hostEl, HOME.nearbyCarouselRootId);
            if (root) initializeHorizontalCarousel(root, {cardSelector: HOME.nearbyCardSelector});

            filterSpotsByCategory(getActiveCategories(), root || hostEl);
        },

        onTopRatedLoaded: async () => {
            await populateTopratedSpots({containerId: HOME.topratedRootId, limit: 10});

            const root = $in(hostEl, HOME.topratedRootId);
            if (root) initializeVerticalCarousel(root, {cardSelector: HOME.topratedCardSelector});

            filterSpotsByCategory(getActiveCategories(), hostEl);
        },
    });

    if (!categoryFilterAttached) {
        setupCategoryFilter(categoryContainer, {
            scopeEl: hostEl,
            onChange: () => {
                const savedRoot = $in(hostEl, HOME.savedRootId);
                if (savedRoot) initializeHorizontalCarousel(savedRoot, {cardSelector: HOME.savedCardSelector});

                const nearbyEl = nearbyRoot(hostEl);
                if (nearbyEl) initializeHorizontalCarousel(nearbyEl, {cardSelector: HOME.nearbyCardSelector});

                const topratedRoot = $in(hostEl, HOME.topratedRootId);
                if (topratedRoot) initializeVerticalCarousel(topratedRoot, {cardSelector: HOME.topratedCardSelector});
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
    ensureSeeAllSavedButtonBound(hostEl);

    homeBuiltOnce = true;
}

export async function initializeHomepageFilters(rootEl) {
    const hostEl = rootEl || getHomepageWrapper();
    if (!hostEl) return;

    if (homeBuiltOnce) {
        initializeBookmarks(hostEl);
        await syncBookmarksUI(hostEl);

        filterSpotsByCategory(getActiveCategories(), hostEl);
        ensureSeeAllSavedButtonBound(hostEl);
        ensureBookmarkChangedListener();
        initializeSpotClickHandlers(hostEl);

        return;
    }

    await buildHomeOnce(hostEl);
}

export async function rehydrateHomepageUI(rootEl) {
    await initializeHomepageFilters(rootEl);
}
