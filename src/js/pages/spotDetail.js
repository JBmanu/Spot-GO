import {
    initializeBookmarks,
    toggleBookmarkForSpot,
    updateBookmarkVisual,
    syncAllBookmarks,
} from "../ui/bookmark.js";
import {
    getSpots,
    getCategoryNameIt,
    getSavedSpots,
    getFirstUser,
    getCategorieMap,
} from "../query.js";
let _spotData = null;
let _cachedState = {
    mainHTML: null,
    headerHTML: null,
    mainScrollTop: 0,
    carouselScroll: {},
};
let _popStateHandler = null;
let _headerBookmarkClickHandler = null;
let _headerBookmarkChangeHandler = null;
function savePageState() {
    const main = document.getElementById("main");
    const header = document.querySelector("header.app-header");
    if (main) {
        _cachedState.mainHTML = main.innerHTML;
        _cachedState.mainScrollTop = main.scrollTop || 0;
    }
    if (header) _cachedState.headerHTML = header.innerHTML;
    const selectors = [".saved-swipe-track", ".nearby-swipe-track", ".carousel-vertical-track"];
    selectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) _cachedState.carouselScroll[sel] = el.scrollLeft || 0;
    });
}
function setupHistoryListener() {
    if (_popStateHandler) return;
    _popStateHandler = async () => {
        await restorePreviousPage();
    };
    window.addEventListener("popstate", _popStateHandler);
}
function teardownHistoryListener() {
    if (_popStateHandler) {
        window.removeEventListener("popstate", _popStateHandler);
        _popStateHandler = null;
    }
}
export function initializeSpotClickHandlers(scopeEl = document) {
    const cards = scopeEl.querySelectorAll('[role="listitem"][data-spot-id]');
    cards.forEach((card) => {
        card.removeEventListener("click", openDetailHandler);
        card.addEventListener("click", openDetailHandler);
    });
}
async function openDetailHandler(e) {
    if (e.target.closest("[data-bookmark-button]")) return;
    const spotId = e.currentTarget.getAttribute("data-spot-id");
    if (!spotId || !spotId.trim()) return;
    await loadSpotDetail(spotId);
}
async function loadSpotDetail(spotId) {
    try {
        const spotData = await getSpotById(spotId);
        if (!spotData) {
            console.error("Spot non trovato:", spotId);
            return;
        }
        _spotData = spotData;
        savePageState();
        const res = await fetch("../html/common-pages/spot-detail.html", { cache: "no-store" });
        if (!res.ok) return;
        const main = document.getElementById("main");
        if (!main) return;
        try {
            history.pushState({ spotId }, "", location.pathname + "#spot-" + spotId);
            setupHistoryListener();
        } catch (e) {
            console.warn("History API non disponibile:", e);
        }
        main.innerHTML = await res.text();
        main.classList.add("spot-detail-enter");
        const categoryEnglish = await getCategoryEnglishName(spotData.idCategoria);
        main.setAttribute("data-category", categoryEnglish);
        updateDetailHeader(spotData);
        await populateSpotDetail(spotData);
        initializeDetailHandlers();
        disableToolbarButtons();
    } catch (err) {
        console.error("Errore loadSpotDetail:", err);
    }
}
async function getSpotById(spotId) {
    try {
        const spots = await getSpots();
        return spots.find((s) => s.id === spotId) || null;
    } catch (err) {
        console.error("Errore getSpotById:", err);
        return null;
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
function teardownHeaderBookmark() {
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
    } catch (_) {}
    headerBookmarkButton.style.display = "none";
    headerBookmarkButton.removeAttribute("data-bookmark-button");
    headerBookmarkButton.removeAttribute("data-bookmark-type");
    headerBookmarkButton.removeAttribute("data-saved");
}
function setupHeaderBookmark(spotData) {
    const headerBookmarkButton = document.getElementById("header-bookmark-button");
    if (!headerBookmarkButton) return;
    teardownHeaderBookmark();
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
            const { spotId, isSaved } = ev.detail;
            if (spotId !== spotData.id) return;
            headerBookmarkButton.dataset.saved = isSaved ? "true" : "false";
            updateBookmarkVisual(headerBookmarkButton, isSaved);
        } catch (err) {
            console.error("Errore header bookmark change handler:", err);
        }
    };
    document.addEventListener("bookmark:changed", _headerBookmarkChangeHandler);
    refreshHeaderBookmarkVisual(headerBookmarkButton, spotData.id).catch(() => {});
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
async function getCategoryEnglishName(categoryId) {
    try {
        const categorieMap = await getCategorieMap();
        const raw = categorieMap?.[categoryId] ?? categoryId ?? "nature";
        const map = {
            Cibo: "food",
            Cultura: "culture",
            Natura: "nature",
            Mistero: "mystery",
            food: "food",
            culture: "culture",
            nature: "nature",
            mystery: "mystery",
        };
        const key = String(raw).trim();
        return map[key] || String(categoryId || "nature").toLowerCase();
    } catch (err) {
        console.error("Errore getCategoryEnglishName:", err);
        return "nature";
    }
}
async function populateSpotDetail(spotData) {
    const els = {
        image: document.getElementById("spot-detail-main-image"),
        title: document.getElementById("spot-detail-title"),
        rating: document.getElementById("spot-detail-rating-value"),
        category: document.getElementById("spot-detail-category"),
        distance: document.getElementById("spot-detail-distance"),
        description: document.getElementById("spot-detail-description"),
        address: document.getElementById("spot-detail-address"),
        hours: document.getElementById("spot-detail-hours"),
        cost: document.getElementById("spot-detail-cost"),
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
    if (els.description) {
        els.description.textContent = spotData.descrizione || "Nessuna descrizione disponibile";
    }
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
function initializeDetailHandlers() {
    const backButton = document.getElementById("header-back-button");
    if (backButton) {
        backButton.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const main = document.getElementById("main");
            if (main) {
                main.classList.add("spot-detail-exit");
                await new Promise((r) => setTimeout(r, 300));
            }
            try {
                history.back();
            } catch (_) {
                await restorePreviousPage();
            }
        });
    }
    const missionsToggle = document.getElementById("spot-missions-toggle");
    if (missionsToggle) {
        missionsToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const missionsDetails = document.getElementById("spot-missions-details");
            if (!missionsDetails) return;
            const isHidden = missionsDetails.style.display === "none";
            missionsDetails.style.display = isHidden ? "block" : "none";
            missionsToggle.classList.toggle("expanded", isHidden);
        });
    }
    initializeBookmarks();
}
function disableToolbarButtons() {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;
    toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
        btn.classList.remove("active");
        const text = btn.querySelector("span");
        const icon = btn.querySelector('[data-role="icon"]');
        if (text) {
            text.classList.remove("font-bold");
            text.classList.add("font-normal");
        }
        if (icon) icon.classList.remove("scale-125");
    });
}
async function restorePreviousPage() {
    const main = document.getElementById("main");
    if (!main || !_cachedState.mainHTML) {
        try {
            const mod = await import("./homepage.js");
            if (mod.initializeHomepageFilters) await mod.initializeHomepageFilters();
        } catch (err) {
            console.error("Restore fallback error:", err);
        }
        return;
    }
    teardownHistoryListener();
    main.classList.remove("spot-detail-enter", "spot-detail-exit");
    main.removeAttribute("data-category");
    main.innerHTML = _cachedState.mainHTML;
    const header = document.querySelector("header.app-header");
    if (header && _cachedState.headerHTML) header.innerHTML = _cachedState.headerHTML;
    teardownHeaderBookmark();
    requestAnimationFrame(() => {
        main.scrollTop = _cachedState.mainScrollTop || 0;
        requestAnimationFrame(async () => {
            Object.entries(_cachedState.carouselScroll).forEach(([sel, scroll]) => {
                const el = document.querySelector(sel);
                if (el) el.scrollLeft = scroll;
            });
            try {
                const mod = await import("./homepage.js");
                if (mod.rehydrateHomepageUI) await mod.rehydrateHomepageUI(main);
            } catch (err) {
                console.warn("Errore rehydrate homepage dopo restore:", err);
            }
            initializeSpotClickHandlers();
            try {
                await syncAllBookmarks();
            } catch (_) {}
            initializeBookmarks();
            _cachedState = {
                mainHTML: null,
                headerHTML: null,
                mainScrollTop: 0,
                carouselScroll: {},
            };
            _spotData = null;
        });
    });
}
