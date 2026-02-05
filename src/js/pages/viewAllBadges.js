import { getCurrentUser, getVisitedSpots, getSpotById } from "../database.js";

const OVERLAY_ID = "view-all-badges";
const OVERLAY_SELECTOR = `[data-overlay-view="${OVERLAY_ID}"]`;

const state = {
    htmlCache: null,
    overlay: null,
    initialized: false,
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

    const res = await fetch("../html/profile-pages/view-all-badges.html");
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

function showHeader() {
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
        title.textContent = "I tuoi Badge";
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
    } catch (_) { }
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
    } catch (_) { }
}

async function closeViewAndRestore() {
    const main = getMain();
    if (!main) return;

    clearHistoryState();
}

async function createBadgeCard(visitedSpot) {
    const spot = await getSpotById(visitedSpot.idLuogo);
    const spotName = spot?.nome || "Badge Segreto";
    const spotImage = spot?.immagine || null;

    const div = document.createElement("div");
    div.className = "flex flex-col items-center gap-2";

    const imageContainer = document.createElement("div");
    imageContainer.className = "w-24 h-24 rounded-full border-4 border-yellow-400 p-1 shadow-lg relative overflow-hidden bg-white";

    // Shine effect
    const image = document.createElement("img");
    if (spotImage) {
        image.src = spotImage;
        image.className = "w-full h-full object-cover rounded-full";
    } else {
        image.src = "../assets/icons/profile/Souvenirs.svg"; // Fallback
        image.className = "w-full h-full p-4 opacity-50";
    }

    imageContainer.appendChild(image);

    const title = document.createElement("span");
    title.className = "text-xs font-bold text-center text-gray-600 line-clamp-2 leading-tight max-w-full px-1";
    title.textContent = spotName;

    div.appendChild(imageContainer);
    div.appendChild(title);

    return div;
}

async function populateBadges() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const listContainer = document.getElementById("view-all-badges-list");
    if (!listContainer) return;

    // listContainer.innerHTML = '<div class="col-span-3 flex justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>'; // Loading
    // const visited = await getVisitedSpots(currentUser.username);
    // listContainer.innerHTML = "";

    if (1 === 0) {
        listContainer.classList.remove("grid");
        listContainer.innerHTML = `
            <div class="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center w-full">
                <img src="../../assets/icons/profile/Souvenirs.svg" class="w-12 h-12 opacity-30 mb-3 grayscale" />
                <h3 class="text-base font-semibold text-gray-600 mb-1">Nessun badge</h3>
                <p class="text-sm text-gray-400">Visita nuovi spot per guadagnare badge!</p>
            </div>
        `;
        return;
    }

    if (!listContainer.classList.contains("grid")) {
        listContainer.classList.add("grid");
    }

    for (const v of visited) {
        const card = await createBadgeCard(v);
        listContainer.appendChild(card);
    }
}

export async function loadViewAllBadges(returnViewKey = null) {
    const main = getMain();
    if (!main) return;

    main.style.position = "relative";
    returnViewKey = returnViewKey || resolveReturnViewKey(main);

    if (state.overlay && !main.contains(state.overlay)) {
        state.overlay = null;
        state.initialized = false;
    }

    const html = await fetchOverlayHtml();
    if (!html) return;

    const overlay = mountOverlay(main, { html, returnViewKey });

    pushHistoryState(returnViewKey);

    if (overlay) {
        overlay.classList.remove("page-slide-in");
        void overlay.offsetWidth;
        overlay.classList.add("page-slide-in");
    }

    showHeader();

    overlay.onClose = async () => {
        await closeViewAndRestore();
    };

    await populateBadges();
}
