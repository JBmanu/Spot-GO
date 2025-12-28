// src/js/pages/homepage.js

import { initializeCarousel } from "../ui/carousel.js";
import { initializeBookmarks, syncAllBookmarks } from "../ui/bookmark.js";

import { initializeSpotClickHandlers } from "./spotDetail.js";

import { populateSavedSpots } from "./savedSpots.js";
import { populateNearbySpots } from "./nearbySpots.js";
import { populateTopratedSpots } from "./populateTopratedCards.js";

import { initFitSavedTitles } from "../fitTitleSaved.js";
import { loadHomepageSections } from "../common/homepageSectionsLoader.js";

import {
    setupCategoryFilter,
    resetCategoryFilter,
    filterSpotsByCategory,
    getActiveCategories,
} from "../common/categoryFilter.js";

import { loadViewAllSaved } from "./viewAllSaved.js";

/**
 * Entri in homepage: carica i partial + popola + init UI.
 */
export async function initializeHomepageFilters() {
    const main = document.getElementById("main");
    const categoryContainer = document.getElementById("home-categories-container");
    if (!main || !categoryContainer) return;

    resetCategoryFilter(categoryContainer);

    await loadHomepageSections({
        onSavedLoaded: async () => {
            await populateSavedSpots({ containerId: "home-saved-container" });
            initFitSavedTitles();

            initializeCarousel(".saved-swipe-track");

            const savedContainer = document.getElementById("home-saved-container");
            if (savedContainer) initializeSpotClickHandlers(savedContainer);

            filterSpotsByCategory(getActiveCategories(), main);
        },

        onNearbyLoaded: async () => {
            await populateNearbySpots({ containerId: "home-nearby-container" });

            initializeCarousel(".nearby-swipe-track");

            const nearbyContainer = document.getElementById("home-nearby-container");
            if (nearbyContainer) initializeSpotClickHandlers(nearbyContainer);

            filterSpotsByCategory(getActiveCategories(), main);
        },

        onTopRatedLoaded: async () => {
            await populateTopratedSpots({ containerId: "home-toprated-carousel-container", limit: 10 });

            initializeCarousel(".vertical-carousel-track");

            const topContainer = document.getElementById("home-toprated-carousel-container");
            if (topContainer) initializeSpotClickHandlers(topContainer);

            filterSpotsByCategory(getActiveCategories(), main);
        },
    });

    setupCategoryFilter(categoryContainer, { scopeEl: main });

    initializeBookmarks();
    await syncAllBookmarks();

    filterSpotsByCategory(getActiveCategories(), main);
}

/**
 * Usata quando torni indietro dal dettaglio:
 * non fa fetch dei partial (assume che l’HTML homepage sia già in pagina),
 * ma ripopola i dati e riattacca UI/handler.
 */
export async function rehydrateHomepageUI(mainEl = document.getElementById("main")) {
    if (!mainEl) return;

    const savedContainer = document.getElementById("home-saved-container");
    const nearbyContainer = document.getElementById("home-nearby-container");
    const topContainer = document.getElementById("home-toprated-carousel-container");

    if (savedContainer) {
        await populateSavedSpots({ containerId: "home-saved-container" });
        initFitSavedTitles();
        initializeCarousel(".saved-swipe-track");
        initializeSpotClickHandlers(savedContainer);
    }

    if (nearbyContainer) {
        await populateNearbySpots({ containerId: "home-nearby-container" });
        initializeCarousel(".nearby-swipe-track");
        initializeSpotClickHandlers(nearbyContainer);
    }

    if (topContainer) {
        await populateTopratedSpots({ containerId: "home-toprated-carousel-container", limit: 10 });
        initializeCarousel(".vertical-carousel-track");
        initializeSpotClickHandlers(topContainer);
    }

    initializeBookmarks();
    await syncAllBookmarks();

    filterSpotsByCategory(getActiveCategories(), mainEl);
}

export { loadViewAllSaved };
