import {
    initializeBookmarks,
    toggleBookmarkForSpot,
    updateBookmarkVisual,
    syncBookmarksUI,
} from "../common/bookmark.js";

import {
    getCategoryNameIt,
    getSavedSpots,
    getFirstUser,
    getSpotById,
} from "../query.js";

import {closeOverlayAndReveal} from "../common/back.js";

let _spotData = null;
let _headerBookmarkClickHandler = null;
let _headerBookmarkChangeHandler = null;

function getMain() {
    return document.getElementById("main");
}

function getActiveSectionKey(main) {
    if (!main) return "homepage";
    const visible = main.querySelector('[data-section-view]:not([hidden])');
    return (visible?.dataset.sectionView || "homepage").trim();
}

function getSectionWrapper(main, sectionKey) {
    if (!main) return null;
    return main.querySelector(
        `[data-section-view="${CSS.escape(String(sectionKey))}"]`
    );
}

function getDetailOverlay(main) {
    return main?.querySelector('[data-overlay-view="spot-detail"]') || null;
}

function removeHeaderBookmarkButton() {
    const headerBookmarkButton = document.getElementById("header-bookmark-button");
    if (!headerBookmarkButton) return;

    try {
        if (_headerBookmarkClickHandler) {
            headerBookmarkButton.removeEventListener("click", _headerBookmarkClickHandler);
            _headerBookmarkClickHandler = null;
        }
        if (_headerBookmarkChangeHandler) {
            document.removeEventListener("bookmark:changed", _headerBookmarkChangeHandler);
            _headerBookmarkChangeHandler = null;
        }
    } catch (_) {
    }

    headerBookmarkButton.style.display = "none";
    headerBookmarkButton.removeAttribute("data-bookmark-button");
    headerBookmarkButton.removeAttribute("data-bookmark-type");
    headerBookmarkButton.removeAttribute("data-saved");
}

function closeDetailOverlay(main) {
    if (!main) return null;

    const overlay = getDetailOverlay(main);
    if (!overlay) return null;

    const shown = closeOverlayAndReveal({overlay});

    removeHeaderBookmarkButton();

    return shown;
}

export function initializeSpotClickHandlers(scopeEl = document) {
    const root = scopeEl === document ? document.getElementById("main") : scopeEl;
    if (!root) return;

    if (root.dataset.spotClickBound === "true") return;
    root.dataset.spotClickBound = "true";

    root.addEventListener("click", async (e) => {
        if (e.target.closest("[data-bookmark-button]")) return;

        const card = e.target.closest('[role="listitem"][data-spot-id]');
        if (!card) return;

        const spotId = card.getAttribute("data-spot-id");
        if (!spotId || !spotId.trim()) return;

        await loadSpotDetail(spotId.trim());
    });
}

async function loadSpotDetail(spotId) {
    try {
        const spotData = await getSpotById(spotId);
        if (!spotData) {
            console.error("Spot non trovato:", spotId);
            return;
        }

        _spotData = spotData;

        const main = getMain();
        if (!main) return;

        const returnSection = getActiveSectionKey(main);

        const existing = getDetailOverlay(main);
        if (existing) existing.remove();

        const res = await fetch("../html/common-pages/spot-detail.html", {cache: "no-store"});
        if (!res.ok) return;

        const html = await res.text();

        const overlay = document.createElement("div");
        overlay.dataset.overlayView = "spot-detail";
        overlay.dataset.returnView = returnSection;
        overlay.innerHTML = html;

        main.querySelectorAll("[data-section-view]").forEach((el) => (el.hidden = true));

        main.appendChild(overlay);

        main.classList.add("spot-detail-enter");
        main.classList.remove("spot-detail-exit");

        const wrapper = overlay.querySelector(".spot-detail-wrapper");
        if (wrapper) wrapper.setAttribute("data-category", spotData.idCategoria || "nature");

        updateDetailHeader(spotData);

        await populateSpotDetail(spotData, overlay);

        initializeDetailHandlers(overlay);

        initializeBookmarks(overlay);
        try {
            await syncBookmarksUI(overlay);
        } catch (_) {
        }
    } catch (err) {
        console.error("Errore loadSpotDetail:", err);
    }
}

function updateDetailHeader(spotData) {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `
      <button type="button" id="header-back-button" aria-label="Torna indietro"
        class="flex items-center justify-center w-10 h-10">
        <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
      </button>
    `;
    }

    if (headerLogoText) headerLogoText.style.display = "none";

    if (headerTitle) {
        headerTitle.textContent = spotData.nome || "Dettaglio Spot";
        headerTitle.classList.remove("hidden");
    }

    setupHeaderBookmark(spotData);
}

function setupHeaderBookmark(spotData) {
    const headerBookmarkButton = document.getElementById("header-bookmark-button");
    if (!headerBookmarkButton) return;

    removeHeaderBookmarkButton();

    headerBookmarkButton.style.display = "block";
    headerBookmarkButton.setAttribute("data-bookmark-button", "true");
    headerBookmarkButton.setAttribute("data-bookmark-type", "detail");

    _headerBookmarkClickHandler = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!spotData?.id) return;

        try {
            await toggleBookmarkForSpot(spotData.id);
            await refreshHeaderBookmarkVisual(headerBookmarkButton, spotData.id);
        } catch (err) {
            console.error("Errore toggle bookmark header:", err);
        }
    };

    headerBookmarkButton.addEventListener("click", _headerBookmarkClickHandler);

    _headerBookmarkChangeHandler = (ev) => {
        try {
            if (!ev?.detail) return;
            const {spotId, isSaved} = ev.detail;
            if (String(spotId) !== String(spotData.id)) return;

            headerBookmarkButton.dataset.saved = isSaved ? "true" : "false";
            updateBookmarkVisual(headerBookmarkButton, isSaved);
        } catch (err) {
            console.error("Errore header bookmark change handler:", err);
        }
    };

    document.addEventListener("bookmark:changed", _headerBookmarkChangeHandler);

    refreshHeaderBookmarkVisual(headerBookmarkButton, spotData.id).catch(() => {
    });
}

async function refreshHeaderBookmarkVisual(btn, spotId) {
    const user = await getFirstUser();
    if (!user) return;

    const saved = await getSavedSpots(user.id);
    const savedIds = (saved || []).map((s) => s.idLuogo);

    const isSaved = savedIds.includes(spotId);
    btn.dataset.saved = isSaved ? "true" : "false";
    updateBookmarkVisual(btn, isSaved);
}

async function populateSpotDetail(spotData, scopeEl = document) {
    const els = {
        image: scopeEl.querySelector("#spot-detail-main-image"),
        title: scopeEl.querySelector("#spot-detail-title"),
        rating: scopeEl.querySelector("#spot-detail-rating-value"),
        category: scopeEl.querySelector("#spot-detail-category"),
        distance: scopeEl.querySelector("#spot-detail-distance"),
        description: scopeEl.querySelector("#spot-detail-description"),
        address: scopeEl.querySelector("#spot-detail-address"),
        hours: scopeEl.querySelector("#spot-detail-hours"),
        cost: scopeEl.querySelector("#spot-detail-cost"),
    };

    if (els.image) {
        els.image.src = spotData.immagine || "";
        els.image.alt = spotData.nome || "Foto spot";
    }

    if (els.title) els.title.textContent = spotData.nome || "Spot";
    if (els.rating) els.rating.textContent = spotData.rating ? String(spotData.rating) : "4.5";
    if (els.distance) els.distance.textContent = spotData.distanza ? `${spotData.distanza} m` : "0 m";

    if (els.category && spotData.idCategoria) {
        try {
            els.category.textContent = await getCategoryNameIt(spotData.idCategoria);
        } catch {
            els.category.textContent = "";
        }
    }

    if (els.description) els.description.textContent = spotData.descrizione || "Nessuna descrizione disponibile";
    if (els.address) els.address.textContent = spotData.indirizzo || "";

    if (els.hours) {
        const orari = Array.isArray(spotData.orari) ? spotData.orari : [];
        els.hours.textContent = orari.length
            ? orari.map((o) => `${o.inizio} - ${o.fine}`).join(" | ")
            : "";
    }

    if (els.cost) {
        const costo = Array.isArray(spotData.costo) ? spotData.costo : [];
        els.cost.textContent = costo.length
            ? costo.map((c) => (c.prezzo === 0 ? "Gratuito" : `${c.tipo}: €${c.prezzo}`)).join(" | ")
            : "";
    }
}

function setupToolbarNavigation() {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;

    if (toolbar.dataset.detailBound === "true") return;
    toolbar.dataset.detailBound = "true";

    toolbar.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-section]");
        if (!btn) return;

        if (btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true") return;

        const main = getMain();
        if (!main) return;

        const overlay = getDetailOverlay(main);
        if (!overlay) return;

        main.classList.add("spot-detail-exit");
        await new Promise((r) => setTimeout(r, 300));

        closeDetailOverlay(main);
    });
}

function initializeDetailHandlers(overlayEl) {
    const backButton = document.getElementById("header-back-button");
    if (backButton) {
        backButton.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const main = getMain();
            if (!main) return;

            main.classList.add("spot-detail-exit");
            await new Promise((r) => setTimeout(r, 300));

            const shown = closeDetailOverlay(main) || "homepage";

            const scope = getSectionWrapper(main, shown) || document;
            try {
                await syncBookmarksUI(scope);
            } catch (_) {
            }
            initializeBookmarks(scope);
        });
    }

    const missionsToggle =
        overlayEl?.querySelector("#spot-missions-toggle") ||
        document.getElementById("spot-missions-toggle");

    if (missionsToggle) {
        missionsToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const missionsDetails =
                overlayEl?.querySelector("#spot-missions-details") ||
                document.getElementById("spot-missions-details");

            if (!missionsDetails) return;

            const isHidden = missionsDetails.style.display === "none";
            missionsDetails.style.display = isHidden ? "block" : "none";
            missionsToggle.classList.toggle("expanded", isHidden);
        });
    }

    setupToolbarNavigation();
}

export async function openSpotDetailById(spotId) {
    if (!spotId) return;
    await loadSpotDetail(String(spotId).trim());
}

