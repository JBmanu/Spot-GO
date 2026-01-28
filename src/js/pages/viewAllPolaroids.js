import { SearchSystem } from "../common/SearchSystem.js";
import { openPolaroidDetail } from "./polaroidDetail.js";
import { fetchFormattedUserPolaroids, getPolaroidTemplate, fillPolaroidContent } from "../common/polaroidCommon.js";
import { attachSimulatedKeyboard, removeSimulatedKeyboard } from "../common/keyboardUtils.js";

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
    const activeView = main.querySelector("[data-section-view]:not([hidden])");
    if (activeView) {
        //SE presente una sezione torna alla prima sezione non nascosta.
        return activeView?.getAttribute("data-section-view") || activeView?.id || null;
    } else if (activeBtn) {
        //altrimenti in estremis torna alla macrosezione che è selezionata nella bar in basso.
        return activeBtn.dataset.section || null;
    }
    
}

function showViewAllPolaroidsHeader() {
    const logo = document.querySelector(".header-left-logo");
    const logoText = document.getElementById("header-logo-text");
    const title = document.getElementById("header-title");

    if (logo) {
        logo.innerHTML = `
            <button type="button" id="back-button" data-back aria-label="Torna indietro"
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
    main.querySelectorAll("[data-section-view]").forEach((el) => el.hidden = true);
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
    overlay.classList.add("overlay-full-page");

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

function renderViewAllPolaroidsEmptyMessage(container) {
    container.innerHTML = `
        <div class="col-span-2 flex flex-col items-center justify-center py-12 text-center opacity-60">
            <img src="../assets/icons/profile/Photo%20Gallery.svg" class="w-16 h-16 mb-4" alt="" />
            <h3 class="text-lg font-semibold mb-2">Il tuo album è vuoto</h3>
            <p class="text-sm">Inizia a creare polaroid per riempirlo!</p>
        </div>
    `;
}

function groupPolaroidsByDate(polaroids) {
    const sorted = [...polaroids].sort((a, b) => {
        const dateA = a.date && typeof a.date.toDate === 'function' ? a.date.toDate() : new Date(a.date);
        const dateB = b.date && typeof b.date.toDate === 'function' ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    });

    const grouped = {};
    sorted.forEach(p => {
        const date = p.date && typeof p.date.toDate === 'function' ? p.date.toDate() : new Date(p.date);
        if (isNaN(date.getTime())) return;

        const monthName = date.toLocaleString('it-IT', { month: 'long' });
        const year = date.getFullYear();
        const key = `${monthName} ${year}`;

        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(p);
    });

    return grouped;
}

async function renderViewAllPolaroidsGrid(container, polaroids, query = "") {
    container.innerHTML = "";

    container.classList.remove("grid", "grid-cols-2", "gap-4");
    container.classList.add("flex", "flex-col", "gap-6", "pb-24");

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

    const grouped = groupPolaroidsByDate(filteredPolaroids);

    for (const [header, items] of Object.entries(grouped)) {

        const section = document.createElement("div");
        section.className = "timeline-section";

        const headerEl = document.createElement("div");
        headerEl.className = "timeline-header";
        headerEl.innerHTML = `<h3 class="text-lg font-bold capitalize text-primary">${header}</h3>`;
        section.appendChild(headerEl);

        const grid = document.createElement("div");
        grid.className = "grid grid-cols-2 gap-4";

        items.forEach(item => {
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
            grid.appendChild(clone);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }
}

async function closeViewAllPolaroidsAndRestore() {
    const main = getViewAllPolaroidsMain();
    if (!main) return;

    const overlay = main.querySelector(OVERLAY_SELECTOR);

    removeSimulatedKeyboard();
    if (state.overlayEl && overlay && overlay.contains(state.overlayEl)) {
        overlay.removeChild(state.overlayEl);
    }
    state.keyboardEl = null;
    state.overlayEl = null;

    clearViewAllPolaroidsHistoryState();
}

export async function loadViewAllPolaroids(userData) {
    const main = getViewAllPolaroidsMain();
    if (!main) return;

    const returnViewKey = resolveViewAllPolaroidsReturnKey(main);

    if (state.overlay && !main.contains(state.overlay)) {
        state.overlay = null;
        state.initialized = false;
    }

    if (state.overlay && state.initialized) {
        state.overlay.hidden = false;
        if (returnViewKey) state.overlay.dataset.returnView = String(returnViewKey);

        hideAllSectionViewsForAlbum(main);
        pushViewAllPolaroidsHistoryState(returnViewKey);

        state.overlay.classList.remove("page-slide-in");
        void state.overlay.offsetWidth;
        state.overlay.classList.add("page-slide-in");


        showViewAllPolaroidsHeader();

        state.overlay.onClose = async () => {
            await closeViewAllPolaroidsAndRestore();
        };

        const container = state.overlay.querySelector("#view-all-polaroids-list");
        const polaroids = await fetchFormattedUserPolaroids(userData);
        await renderViewAllPolaroidsGrid(container, polaroids || []);
        return;
    }

    const html = await fetchViewAllPolaroidsOverlayHtml();
    if (!html) return;

    const overlay = mountViewAllPolaroidsOverlay(main, { html, returnViewKey });

    showViewAllPolaroidsHeader();

    const container = overlay.querySelector("#view-all-polaroids-list");

    let allPolaroids = await fetchFormattedUserPolaroids(userData);

    const placeholder = overlay.querySelector("#search-bar-placeholder");
    if (placeholder) {
        const searchSystem = new SearchSystem({
            placeholder: "Cerca nel tuo album...",
            onSearch: (value) => {
                renderViewAllPolaroidsGrid(container, allPolaroids, value);
            }
        });

        const { searchBarEl, keyboardEl, overlayEl } = await searchSystem.init();
        placeholder.replaceWith(searchBarEl);

        attachSimulatedKeyboard(keyboardEl);

        overlay.appendChild(overlayEl);

        state.keyboardEl = keyboardEl;
        state.overlayEl = overlayEl;
    }

    pushViewAllPolaroidsHistoryState(returnViewKey);

    overlay.onClose = async () => {
        await closeViewAllPolaroidsAndRestore();
    };

    await renderViewAllPolaroidsGrid(container, allPolaroids || []);
    state.initialized = true;
}
