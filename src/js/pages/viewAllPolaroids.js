import { goBack, setupBackButton, closeOverlay } from "../common/back.js";
import { createSearchBarWithKeyboard } from "../createComponent.js";
import { openPolaroidDetail } from "./polaroidDetail.js";
import { fetchFormattedUserPolaroids, getPolaroidTemplate, fillPolaroidContent } from "../common/polaroidCommon.js";

const OVERLAY_ID = "view-all-polaroids";
const OVERLAY_SELECTOR = `[data-overlay-view="${OVERLAY_ID}"]`;

const state = {
    htmlCache: null,
    overlay: null,
    initialized: false,
    popHandler: null,
    keyboardEl: null,
    overlayEl: null
};

function getViewAllPolaroidsMain() {
    return document.getElementById("main");
}

function getViewAllPolaroidsOverlay() {
    const main = getViewAllPolaroidsMain();
    if (!main) return null;

    if (state.overlay && !main.contains(state.overlay)) state.overlay = null;
    state.overlay = state.overlay || main.querySelector(OVERLAY_SELECTOR) || null;

    return state.overlay;
}

async function fetchViewAllPolaroidsOverlayHtml() {
    if (state.htmlCache) return state.htmlCache;

    const res = await fetch("../html/common-pages/view-all-polaroids.html");
    if (!res.ok) return null;

    state.htmlCache = await res.text();
    return state.htmlCache;
}

function resolveViewAllPolaroidsReturnKey(main) {
    const activeBtn = document.querySelector(".app-toolbar button[aria-current='page']");
    if (activeBtn) return activeBtn.dataset.section || null;

    const activeView = main.querySelector("[data-section-view]:not([hidden])");
    return activeView?.getAttribute("data-section-view") || activeView?.id || null;
}

function showViewAllPolaroidsHeader() {
    const logo = document.querySelector(".header-left-logo");
    const logoText = document.getElementById("header-logo-text");
    const title = document.getElementById("header-title");

    if (logo) {
        logo.innerHTML = `
            <button type="button" id="header-back-button" data-back aria-label="Torna indietro"
                class="flex items-center justify-center w-10 h-10">
                <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
            </button>`;
    }
    if (logoText) logoText.style.display = "none";
    if (title) {
        title.textContent = "Il tuo Album";
        title.classList.remove("hidden");
    }
}

function hideAllSectionViewsForAlbum(main) {
    main.querySelectorAll("[data-section-view]").forEach((el) => (el.hidden = true));
}

function mountViewAllPolaroidsOverlay(main, { html, returnViewKey }) {
    hideAllSectionViewsForAlbum(main);

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
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.zIndex = "50";
    overlay.style.backgroundColor = "var(--bg-color)";

    main.appendChild(overlay);
    state.overlay = overlay;
    return overlay;
}

function pushViewAllPolaroidsHistoryState(returnViewKey) {
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

function clearViewAllPolaroidsHistoryState() {
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

function attachViewAllPolaroidsPopHandler() {
    if (state.popHandler) window.removeEventListener("popstate", state.popHandler);

    state.popHandler = () => {
        const overlay = getViewAllPolaroidsOverlay();
        if (!overlay || overlay.hidden) return;
        goBack();
    };

    window.addEventListener("popstate", state.popHandler);
}

function renderViewAllPolaroidsEmptyMessage(container) {
    container.innerHTML = `
        <div class="col-span-2 flex flex-col items-center justify-center py-12 text-center opacity-60">
            <img src="../assets/icons/profile/Photo%20Gallery.svg" class="w-16 h-16 mb-4" alt="" />
            <h3 class="text-lg font-semibold mb-2">Il tuo album è vuoto</h3>
            <p class="text-sm">Inizia a creare polaroid per riempirlo!</p>
        </div>
    `;
}

async function renderViewAllPolaroidsGrid(container, polaroids, query = "") {
    container.innerHTML = "";
    const template = await getPolaroidTemplate();
    if (!template) return;

    const searchQuery = query.toLowerCase().trim();
    const filteredPolaroids = searchQuery
        ? polaroids.filter(p => (p.title || "").toLowerCase().includes(searchQuery))
        : polaroids;

    if (filteredPolaroids.length === 0) {
        if (polaroids.length === 0) {
            renderViewAllPolaroidsEmptyMessage(container);
        } else {
            container.innerHTML = `<p class="col-span-2 text-center py-8 opacity-60">Nessuna polaroid trovata per "${query}"</p>`;
        }
        return;
    }

    filteredPolaroids.forEach(item => {
        const clone = template.content.cloneNode(true);
        fillPolaroidContent(clone, item);

        const card = clone.querySelector('.profile-polaroid');
        if (card) {
            card.classList.remove('carousel-horizontal_item');
            card.style.width = "100%";
            card.style.margin = "0";

            card.addEventListener('click', (e) => {
                if (e.target.closest('.polaroid-menu-wrapper') || e.target.closest('.polaroid-menu-dropdown') || e.target.closest('.profile-polaroid-menu')) return;
                e.preventDefault();
                openPolaroidDetail(item);
            });
        }

        container.appendChild(clone);
    });
}

async function closeViewAllPolaroidsAndRestore() {
    const main = getViewAllPolaroidsMain();
    if (!main) return;

    const overlay = main.querySelector(OVERLAY_SELECTOR);
    if (overlay) closeOverlay(overlay);

    if (state.keyboardEl && main.contains(state.keyboardEl)) {
        main.removeChild(state.keyboardEl);
    }
    if (state.overlayEl && overlay && overlay.contains(state.overlayEl)) {
        overlay.removeChild(state.overlayEl);
    }
    state.keyboardEl = null;
    state.overlayEl = null;

    clearViewAllPolaroidsHistoryState();
}

export async function loadViewAllPolaroids(returnViewKey = null) {
    const main = getViewAllPolaroidsMain();
    if (!main) return;

    returnViewKey = returnViewKey || resolveViewAllPolaroidsReturnKey(main);

    if (state.overlay && !main.contains(state.overlay)) {
        state.overlay = null;
        state.initialized = false;
    }

    if (state.overlay && state.initialized) {
        state.overlay.hidden = false;
        if (returnViewKey) state.overlay.dataset.returnView = String(returnViewKey);

        hideAllSectionViewsForAlbum(main);
        pushViewAllPolaroidsHistoryState(returnViewKey);

        state.overlay.classList.remove("view-all-saved-enter");
        void state.overlay.offsetWidth;
        state.overlay.classList.add("view-all-saved-enter");


        showViewAllPolaroidsHeader();

        setupBackButton({
            fallback: async () => {
                await closeViewAllPolaroidsAndRestore();
            },
        });

        attachViewAllPolaroidsPopHandler();

        const container = state.overlay.querySelector("#view-all-polaroids-list");
        const polaroids = await fetchFormattedUserPolaroids();
        await renderViewAllPolaroidsGrid(container, polaroids || []);
        return;
    }

    const html = await fetchViewAllPolaroidsOverlayHtml();
    if (!html) return;

    const overlay = mountViewAllPolaroidsOverlay(main, { html, returnViewKey });

    showViewAllPolaroidsHeader();

    const container = overlay.querySelector("#view-all-polaroids-list");

    let allPolaroids = await fetchFormattedUserPolaroids();

    const placeholder = overlay.querySelector("#search-bar-placeholder");
    if (placeholder) {
        const {
            searchBarEl,
            keyboardEl,
            overlayEl
        } = await createSearchBarWithKeyboard("Cerca nel tuo album...", (value) => {
            renderViewAllPolaroidsGrid(container, allPolaroids, value);
        });
        placeholder.replaceWith(searchBarEl);
        main.appendChild(keyboardEl);
        overlay.appendChild(overlayEl);
        state.keyboardEl = keyboardEl;
        state.overlayEl = overlayEl;

        state.overlayEl.classList.remove("keyboard-overlay");
        state.overlayEl.classList.add("keyboard-overlay-view-all");
    }

    pushViewAllPolaroidsHistoryState(returnViewKey);

    setupBackButton({
        fallback: async () => {
            await closeViewAllPolaroidsAndRestore();
        },
    });

    attachViewAllPolaroidsPopHandler();

    await renderViewAllPolaroidsGrid(container, allPolaroids || []);
    state.initialized = true;
}
