import { initializeBookmarks, syncAllBookmarks } from "../common/bookmark.js";
import { initializeSpotClickHandlers } from "./spotDetail.js";
import { getCurrentUser, getSavedSpots, getSpots, getCategoryNameIt } from "../database.js";
import { distanceFromUserToSpot, formatDistance } from "../common.js";
import { initializeVerticalCarousel } from "../common/carousels.js";
import { SearchSystem } from "../common/SearchSystem.js";
import { goBack } from "../common/back.js";
import { attachSimulatedKeyboard, removeSimulatedKeyboard } from "../common/keyboardUtils.js";

const OVERLAY_ID = "view-all-saved";
const OVERLAY_SELECTOR = `[data-overlay-view="${OVERLAY_ID}"]`;

const state = {
    htmlCache: null,
    overlay: null,
    initialized: false,
    popHandler: null,
    classicCardTplLoaded: false,
    keyboardEl: null,
    overlayEl: null,
};

function getMain() {
    return document.getElementById("main");
}

function getOverlay() {
    const main = getMain();
    if (!main) return null;

    if (state.overlay && !main.contains(state.overlay)) state.overlay = null;
    state.overlay = state.overlay || main.querySelector(OVERLAY_SELECTOR) || null;

    return state.overlay;
}

async function fetchOverlayHtml() {
    if (state.htmlCache) return state.htmlCache;

    const res = await fetch("../html/homepage-pages/view-all/view-all-saved.html");
    if (!res.ok) return null;

    state.htmlCache = await res.text();
    return state.htmlCache;
}

function resolveReturnViewKey(main) {
    const activeBtn = document.querySelector(".app-toolbar button[aria-current='page']");
    if (activeBtn) return activeBtn.dataset.section || null;

    const activeView = main.querySelector("[data-section-view]:not([hidden])");
    return activeView?.getAttribute("data-section-view") || activeView?.id || null;
}

function showViewAllSavedHeader() {
    const logo = document.querySelector(".header-left-logo");
    const logoText = document.getElementById("header-logo-text");
    const title = document.getElementById("header-title");

    if (logo) {
        logo.innerHTML = `
            <button type="button" id="back-button" data-back aria-label="Torna indietro"
                class="flex items-center justify-center w-10 h-10">
                <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
            </button>`;

        const backBtn = logo.querySelector("#back-button");
        if (backBtn) {
            backBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                goBack();
            });
        }
    }
    if (logoText) logoText.style.display = "none";
    if (title) {
        title.textContent = "I tuoi Spot Salvati";
        title.classList.remove("hidden");
    }
}

function hideAllSectionViews(main) {
    main.querySelectorAll("[data-section-view]").forEach((el) => (el.hidden = true));
}

function mountOverlay(main, { html, returnViewKey }) {
    hideAllSectionViews(main);

    const existing = main.querySelector(OVERLAY_SELECTOR);
    if (existing) {
        existing.hidden = false;
        if (returnViewKey) existing.dataset.returnView = String(returnViewKey);
        state.overlay = existing;
        return existing;
    }

    const overlay = document.createElement("div");
    overlay.dataset.overlayView = OVERLAY_ID;
    if (returnViewKey) overlay.dataset.returnView = String(returnViewKey);
    overlay.innerHTML = html;
    overlay.classList.add("overlay-full-page");

    main.appendChild(overlay);
    state.overlay = overlay;
    return overlay;
}

function pushHistoryState(returnViewKey) {
    try {
        const curr = history.state || {};
        if (curr.overlay !== OVERLAY_ID) {
            history.pushState(
                { ...curr, overlay: OVERLAY_ID, returnView: returnViewKey || null },
                "",
                location.href
            );
        } else {
            history.replaceState(
                { ...curr, returnView: returnViewKey || curr.returnView || null },
                "",
                location.href
            );
        }
    } catch (_) {
    }
}

function clearHistoryState() {
    try {
        const curr = history.state || {};
        if (curr.overlay === OVERLAY_ID) {
            const next = { ...curr };
            delete next.overlay;
            delete next.returnView;
            history.replaceState(next, "", location.href);
        }
    } catch (_) {
    }
}

function renderEmptySavedMessage(container) {
    const p = document.createElement("p");
    p.dataset.emptySaved = "true";
    p.className = "text-center text-text_color/60 py-8";
    p.textContent = "Nessuno spot salvato";
    container.appendChild(p);
}

function filterSpotCards(root, query) {
    const searchQuery = String(query || "").toLowerCase().trim();
    const cards = root.querySelectorAll('[data-slot="spot"]');

    cards.forEach((card) => {
        const spotId = (card.getAttribute("data-spot-id") || "").trim();
        if (!spotId) {
            card.style.display = "none";
            card.style.zIndex = "998";
            return;
        }

        const titleEl = card.querySelector('[data-field="title"]');
        const title = (titleEl?.textContent || "").toLowerCase();

        if (!searchQuery) {
            card.style.display = "";
            card.style.zIndex = "998";
            return;
        }

        const matches = title.includes(searchQuery);
        card.style.display = matches ? "" : "none";
        card.style.zIndex = matches ? "1001" : "998";
    });
}

function renderSpotCard(template, spot, categoryCache) {
    const cardNode = template.content.firstElementChild.cloneNode(true);

    cardNode.setAttribute("data-spot-id", spot.id);
    cardNode.setAttribute("data-category", String(spot.idCategoria || "unknown").toLowerCase());

    const titleEl = cardNode.querySelector('[data-field="title"]');
    if (titleEl) titleEl.textContent = spot.nome || "Spot";

    const imageEl = cardNode.querySelector('[data-field="image"]');
    if (imageEl) {
        imageEl.src = spot.immagine || "";
        imageEl.alt = spot.nome || "Foto spot";
    }

    const categoryEl = cardNode.querySelector('[data-field="category"]');
    if (categoryEl && spot.idCategoria) {
        const key = String(spot.idCategoria);

        categoryEl.textContent = categoryCache.get(key) || "";

        if (!categoryCache.has(key)) {
            categoryCache.set(key, "");
            getCategoryNameIt(spot.idCategoria).then((name) => {
                categoryCache.set(key, name || "");
                categoryEl.textContent = name || "";
            });
        }
    }

    const distanceEl = cardNode.querySelector('[data-field="distance"]');
    if (distanceEl) distanceEl.textContent = formatDistance(distanceFromUserToSpot(spot));

    const ratingEl = cardNode.querySelector('[data-field="rating"]');
    if (ratingEl) {
        const rating = spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
        const n = Number(String(rating ?? "").replace(",", "."));
        ratingEl.textContent = Number.isFinite(n) ? (Math.round(n * 10) / 10).toFixed(1) : "-";
    }

    return cardNode;
}

async function populateViewAllSavedSpots({ preserveDom = false } = {}) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const root = getOverlay();
    if (!root) return;

    const savedContainer = root.querySelector("#view-all-saved-list");
    if (!savedContainer) return;

    const track = savedContainer.querySelector(".carousel-vertical_track") || savedContainer.querySelector(".carousel-vertical-track") || savedContainer;

    track.querySelectorAll("[data-empty-saved]").forEach((el) => el.remove());

    const relations = (await getSavedSpots(currentUser.username)) || [];
    if (relations.length === 0) {
        track.querySelectorAll('[data-slot="spot"]').forEach((el) => el.remove());
        renderEmptySavedMessage(track);
        return;
    }

    const existingCards = new Map(
        Array.from(track.querySelectorAll('[data-slot="spot"][data-spot-id]')).map((el) => [
            String(el.getAttribute("data-spot-id")),
            el,
        ])
    );

    if (!preserveDom) {
        track.querySelectorAll('[data-slot="spot"]').forEach((el) => el.remove());
        existingCards.clear();
    }

    const allSpots = (await getSpots()) || [];
    const neededIds = new Set(relations.map((r) => String(r.idLuogo)).filter(Boolean));

    const spotsToShow = allSpots
        .filter((s) => neededIds.has(String(s.id)))
        .sort((a, b) => distanceFromUserToSpot(a) - distanceFromUserToSpot(b));

    const template = document.querySelector('template[data-template="classic-spot-card-template"]');
    if (!template?.content?.firstElementChild) return;

    const categoryCache = new Map();

    for (const spot of spotsToShow) {
        const id = String(spot.id);
        let cardNode = existingCards.get(id);

        if (!cardNode) {
            cardNode = renderSpotCard(template, spot, categoryCache);
            track.appendChild(cardNode);
        }

        existingCards.delete(id);
    }

    for (const [, leftover] of existingCards) leftover.remove();
}

async function closeViewAllSavedAndRestore() {
    const main = getMain();
    if (!main) return;

    const overlay = main.querySelector(OVERLAY_SELECTOR);

    removeSimulatedKeyboard();
    if (state.overlayEl && overlay && overlay.contains(state.overlayEl)) {
        overlay.removeChild(state.overlayEl);
    }
    state.keyboardEl = null;
    state.overlayEl = null;

    clearHistoryState();
}

export async function loadViewAllSaved(returnViewKey = null) {
    const main = getMain();
    if (!main) return;

    main.style.position = "relative";

    returnViewKey = returnViewKey || resolveReturnViewKey(main);

    if (state.overlay && !main.contains(state.overlay)) {
        state.overlay = null;
        state.initialized = false;
    }

    if (state.overlay && state.initialized) {
        state.overlay.hidden = false;
        if (returnViewKey) state.overlay.dataset.returnView = String(returnViewKey);

        hideAllSectionViews(main);
        pushHistoryState(returnViewKey);

        if (state.overlay) {
            state.overlay.classList.remove("page-slide-in");
            void state.overlay.offsetWidth;
            state.overlay.classList.add("page-slide-in");
        }

        showViewAllSavedHeader();

        state.overlay.onClose = async () => {
            await closeViewAllSavedAndRestore();
        };

        await populateViewAllSavedSpots({ preserveDom: true });
        initializeBookmarks();
        await syncAllBookmarks();
        return;
    }

    const html = await fetchOverlayHtml();
    if (!html) return;

    const overlay = mountOverlay(main, { html, returnViewKey });

    const placeholder = overlay.querySelector("#search-bar-placeholder");
    if (placeholder) {
        const track = overlay.querySelector(".view-all-saved-track") || overlay.querySelector("#view-all-saved-list");

        const searchSystem = new SearchSystem({
            placeholder: "Cerca...",
            onSearch: (value) => filterSpotCards(overlay, value),
            enableFilters: true,
            onFiltersApply: (filters) => {
            }
        });

        const { searchBarEl, keyboardEl, overlayEl } = await searchSystem.init();

        placeholder.replaceWith(searchBarEl);

        attachSimulatedKeyboard(keyboardEl);

        overlay.appendChild(overlayEl);


        if (searchSystem.elements.bottomSheet) overlay.appendChild(searchSystem.elements.bottomSheet);
        if (searchSystem.elements.bottomSheetOverlay) overlay.appendChild(searchSystem.elements.bottomSheetOverlay);

        state.keyboardEl = keyboardEl;
        state.overlayEl = overlayEl;
    }

    pushHistoryState(returnViewKey);

    if (overlay) {
        overlay.classList.remove("page-slide-in");
        void overlay.offsetWidth;
        overlay.classList.add("page-slide-in");
    }

    showViewAllSavedHeader();

    if (!state.initialized) {
        initializeSpotClickHandlers();
        initializeVerticalCarousel(overlay.querySelector("#view-all-saved-list"), { cardSelector: '[data-slot="spot"]' });
        const track = overlay.querySelector("#view-all-saved-list .carousel-vertical-track");
        if (track) {
            track.style.gap = "0";
            track.style.padding = "0";
        }

        state.initialized = true;
    }

    await populateViewAllSavedSpots({ preserveDom: true });
    initializeBookmarks();
    await syncAllBookmarks();

    overlay.onClose = async () => {
        await closeViewAllSavedAndRestore();
    };
}
