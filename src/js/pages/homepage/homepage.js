import {
    initializeBookmarks,
    syncBookmarksUI,
    updateBookmarkVisual
} from "../../common/bookmark.js";
import { initializeSpotClickHandlers } from "../spotDetail.js";
import {
    populateSavedSpots,
    populateNearbySpots,
    populateTopratedSpots,
} from "./populate-homepage-spots.js";
import { initFitText } from "../../common/fitText.js";
import {
    filterSpotsByCategory,
    getActiveCategories,
    resetCategoryFilter,
    setupCategoryFilter,
} from "../../common/categoryFilter.js";
import { loadViewAllSaved } from "../viewAllSaved.js";
import { autoInitializeCarousels, initializeHorizontalCarousel } from "../../common/carousels.js";
import { PATHS } from "../../paths.js";

const state = {
    homepageBuilt: false,
    bookmarkListenerAttached: false,
    htmlCache: new Map()
};

async function loadHtmlFromCache(htmlPath) {
    if (state.htmlCache.has(htmlPath)) return state.htmlCache.get(htmlPath);
    const res = await fetch(htmlPath);
    if (!res.ok) return null;
    const html = await res.text();
    state.htmlCache.set(htmlPath, html);
    return html;
}

async function mountSectionOnce(containerId, htmlPath) {
    const container = document.getElementById(containerId);
    if (!container || container.dataset.mounted === "1") return { ok: !!container, didMount: false };

    const html = await loadHtmlFromCache(htmlPath);
    if (html == null) return { ok: false, didMount: false };

    container.innerHTML = html;
    container.dataset.mounted = "1";
    return { ok: true, didMount: true };
}

async function loadTemplates() {
    if (document.getElementById("shared-spot-templates-container")) return;
    const html = await loadHtmlFromCache(PATHS.html.spotTemplates);
    if (!html) return;

    const container = document.createElement("div");
    container.id = "shared-spot-templates-container";
    container.style.display = "none";
    container.innerHTML = html;
    document.body.appendChild(container);
}

async function setupHomeSections(callbacks = {}) {
    await loadTemplates();
    const sections = [
        { id: "home-saved-section", path: PATHS.html.homepageSaved, cb: callbacks.onSavedLoaded },
        { id: "home-nearby-section", path: PATHS.html.homepageNearby, cb: callbacks.onNearbyLoaded },
        { id: "home-vertical-section", path: PATHS.html.homepageTopRated, cb: callbacks.onTopRatedLoaded }
    ];

    await Promise.all(sections.map(async (s) => {
        const res = await mountSectionOnce(s.id, s.path);
        if (res.ok) await s.cb?.();
    }));
}

function ensureSeeAllSavedButtonBound(homepageRoot) {
    const btn = homepageRoot?.querySelector("#home-saved-see-all");
    if (!btn || btn.dataset.bound === "true") return;

    btn.dataset.bound = "true";
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadViewAllSaved("homepage").catch(() => { });
    });
}

async function refreshSavedSection() {
    const savedRoot = document.getElementById("home-saved-container");
    if (!savedRoot) return;

    const track = savedRoot.querySelector(".carousel-horizontal_track") || savedRoot;
    const prevScroll = track.scrollLeft;

    try {
        await populateSavedSpots({ containerId: "home-saved-container" });

        if (!savedRoot.dataset.carouselType) savedRoot.dataset.carouselType = "horizontal";
        initializeHorizontalCarousel(savedRoot, { cardSelector: ".spot-card-saved" });

        requestAnimationFrame(() => {
            if (track) track.scrollLeft = prevScroll;
        });

        const emptyState = document.getElementById("saved-empty-state");
        if (emptyState) {
            const hasCards = savedRoot.querySelectorAll(".spot-card-saved:not([data-template])").length > 0;
            emptyState.classList.toggle("hidden", hasCards);
        }
        initializeBookmarks(savedRoot);
    } catch (err) {
        console.error("Error refreshing saved section:", err);
    }
}

function attachBookmarkChangeListener() {
    if (state.bookmarkListenerAttached) return;
    state.bookmarkListenerAttached = true;

    document.addEventListener("bookmark:changed", (e) => {
        const { spotId, isSaved } = e.detail || {};
        if (!spotId) return;

        const homepage = document.querySelector('[data-section-view="homepage"]');
        if (homepage) {
            homepage.querySelectorAll(`[data-spot-id="${CSS.escape(spotId)}"] [data-bookmark-button]`).forEach((btn) => {
                btn.dataset.saved = isSaved ? "true" : "false";
                updateBookmarkVisual(btn, isSaved);
            });
        }

        refreshSavedSection();
    });
}

async function buildHomepageOnce(homepageRoot) {
    if (homepageRoot.dataset.homepageBuilt === "true") return;

    const categoryContainer = homepageRoot?.querySelector("#home-categories-container");
    if (categoryContainer) resetCategoryFilter(categoryContainer);

    await setupHomeSections({
        onSavedLoaded: async () => {
            await populateSavedSpots({ containerId: "home-saved-container" });
            initFitText(".spot-card-saved [data-slot='title'], .spot-card-saved .spot-card-title", "#home-saved-container", 2, 10.5);
            filterSpotsByCategory(getActiveCategories(), homepageRoot);
            ensureSeeAllSavedButtonBound(homepageRoot);
            autoInitializeCarousels(homepageRoot);
        },
        onNearbyLoaded: async () => {
            await populateNearbySpots({ containerId: "home-nearby-container" });
            filterSpotsByCategory(getActiveCategories(), homepageRoot);
            autoInitializeCarousels(homepageRoot);
        },
        onTopRatedLoaded: async () => {
            await populateTopratedSpots({ containerId: "home-toprated-carousel", limit: 10 });
            filterSpotsByCategory(getActiveCategories(), homepageRoot);
            autoInitializeCarousels(homepageRoot);
        },
    });

    if (categoryContainer) {
        setupCategoryFilter(categoryContainer, { scopeEl: homepageRoot, onChange: () => { } });
    }

    initializeSpotClickHandlers(homepageRoot);
    initializeBookmarks(homepageRoot);
    await syncBookmarksUI(homepageRoot).catch(() => { });

    attachBookmarkChangeListener();
    filterSpotsByCategory(getActiveCategories(), homepageRoot);
    ensureSeeAllSavedButtonBound(homepageRoot);

    homepageRoot.dataset.homepageBuilt = "true";
    state.homepageBuilt = true;
}

export async function initializeHomepage(homepageElement) {
    const homepageRoot = homepageElement || document.querySelector('[data-section-view="homepage"]');
    if (!homepageRoot) return;

    if (homepageRoot.dataset.homepageBuilt === "true") {
        initializeBookmarks(homepageRoot);
        await syncBookmarksUI(homepageRoot).catch(() => { });
        filterSpotsByCategory(getActiveCategories(), homepageRoot);
        ensureSeeAllSavedButtonBound(homepageRoot);
        attachBookmarkChangeListener();
        initializeSpotClickHandlers(homepageRoot);
        autoInitializeCarousels(homepageRoot);
        return;
    }

    await buildHomepageOnce(homepageRoot);
}
