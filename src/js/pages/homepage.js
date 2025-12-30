import {initializeCarousel} from "../ui/carousel.js";
import {initializeBookmarks, syncAllBookmarks} from "../ui/bookmark.js";
import {initializeSpotClickHandlers} from "./spotDetail.js";
import {populateSavedSpots} from "./savedSpots.js";
import {populateNearbySpots} from "./nearbySpots.js";
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
import {initHorizontalCarousels, initVerticalCarousels} from "../common/carousels.js";

export async function initializeHomepageFilters() {
    const main = document.getElementById("main");
    const categoryContainer = document.getElementById("home-categories-container");
    if (!main || !categoryContainer) return;
    resetCategoryFilter(categoryContainer);
    await loadHomepageSections({
        onSavedLoaded: async () => {
            await populateSavedSpots({containerId: "home-saved-container"});
            initFitText('.spot-card--saved .spot-card-title', '#home-saved-container', 2, 10.5);
            initializeCarousel(".saved-swipe-track");
            const savedContainer = document.getElementById("home-saved-container");
            if (savedContainer) initializeSpotClickHandlers(savedContainer);
            filterSpotsByCategory(getActiveCategories(), main);
        },
        onNearbyLoaded: async () => {
            await populateNearbySpots({containerId: "home-nearby-section"});
            initHorizontalCarousels();
            const nearbyContainer = document.getElementById("home-nearby-section");
            if (nearbyContainer) initializeSpotClickHandlers(nearbyContainer);
            filterSpotsByCategory(getActiveCategories(), main);
        },
        onTopRatedLoaded: async () => {
            await populateTopratedSpots({containerId: "home-toprated-carousel", limit: 10});
            initVerticalCarousels();
            initializeCarousel(".carousel-vertical-track");
            const topContainer = document.getElementById("home-toprated-carousel");
            if (topContainer) initializeSpotClickHandlers(topContainer);
            filterSpotsByCategory(getActiveCategories(), main);
        },
    });
    setupCategoryFilter(categoryContainer, {scopeEl: main});
    initializeBookmarks();
    await syncAllBookmarks();
    filterSpotsByCategory(getActiveCategories(), main);
}

export async function rehydrateHomepageUI(mainEl = document.getElementById("main")) {
    if (!mainEl) return;
    const savedContainer = document.getElementById("home-saved-container");
    const nearbyContainer = document.getElementById("home-nearby-section");
    const topContainer = document.getElementById("home-toprated-carousel");
    if (savedContainer) {
        await populateSavedSpots({containerId: "home-saved-container"});
        initFitText('.spot-card--saved .spot-card-title', '#home-saved-container', 2, 10.5);
        initializeCarousel(".saved-swipe-track");
        initializeSpotClickHandlers(savedContainer);
    }
    if (nearbyContainer) {
        await populateNearbySpots({containerId: "home-nearby-section"});
        initHorizontalCarousels();
        initializeSpotClickHandlers(nearbyContainer);
    }
    if (topContainer) {
        await populateTopratedSpots({containerId: "home-toprated-carousel", limit: 10});
        initVerticalCarousels();
        initializeCarousel(".carousel-vertical-track");
        initializeSpotClickHandlers(topContainer);
    }
    initializeBookmarks();
    await syncAllBookmarks();
    filterSpotsByCategory(getActiveCategories(), mainEl);
}

export {loadViewAllSaved};
