import { initializeVerticalCarousel } from "../common/carousels.js";
import { initializeBookmarks, syncAllBookmarks } from "../common/bookmark.js";
import { initializeSpotClickHandlers } from "./spotDetail.js";
import { getFirstUser, getSavedSpots, getSpots, getCategoryNameIt } from "../query.js";
import { distanceFromUserToSpot, formatDistance } from "../common.js";
import { goBack, setupBackButton, closeOverlay } from "../common/back.js";

let __viewAllSavedHtmlCache = null;

let __viewAllSavedOverlayEl = null;
let __viewAllSavedInitialized = false;

let __viewAllSavedPopHandler = null;

async function getViewAllSavedHtml() {
    if (__viewAllSavedHtmlCache) return __viewAllSavedHtmlCache;

    const res = await fetch("../html/homepage-pages/view-all/view-all-saved.html");
    if (!res.ok) return null;

    __viewAllSavedHtmlCache = await res.text();
    return __viewAllSavedHtmlCache;
}

function getActiveSectionView(main) {
    const views = Array.from(main.querySelectorAll("[data-section-view]"));
    return views.find((v) => !v.hidden) || null;
}

function hideAllSectionViews(main) {
    main.querySelectorAll("[data-section-view]").forEach((el) => (el.hidden = true));
}

function mountOverlayView(main, { id, html, returnViewKey }) {
    hideAllSectionViews(main);

    const existing = main.querySelector(`[data-overlay-view="${id}"]`);
    if (existing) {
        existing.hidden = false;
        if (returnViewKey) existing.dataset.returnView = String(returnViewKey);
        return existing;
    }

    const overlay = document.createElement("div");
    overlay.dataset.overlayView = id;
    if (returnViewKey) overlay.dataset.returnView = String(returnViewKey);
    overlay.innerHTML = html;
    main.appendChild(overlay);
    return overlay;
}

function isViewAllSavedOpen() {
    const main = document.getElementById("main");
    if (!main) return false;
    const overlay = main.querySelector(`[data-overlay-view="view-all-saved"]`);
    return !!overlay && overlay.hidden === false;
}

function getViewAllSavedRoot() {
    const main = document.getElementById("main");
    let overlay = __viewAllSavedOverlayEl;
    if (overlay && !main.contains(overlay)) {
        overlay = null;
        __viewAllSavedOverlayEl = null;
    }
    overlay = overlay || main?.querySelector?.('[data-overlay-view="view-all-saved"]') || null;
    return overlay || document;
}

function pushOverlayState(returnViewKey) {
    try {
        if (!history.state || history.state.overlay !== "view-all-saved") {
            history.pushState(
                { ...(history.state || {}), overlay: "view-all-saved", returnView: returnViewKey || null },
                "",
                location.href
            );
        } else {
            const curr = history.state || {};
            history.replaceState(
                { ...curr, returnView: returnViewKey || curr.returnView || null },
                "",
                location.href
            );
        }
    } catch (_) {}
}

function clearOverlayStateMarker() {
    try {
        const curr = history.state || {};
        if (curr.overlay === "view-all-saved") {
            const next = { ...curr };
            delete next.overlay;
            delete next.returnView;
            history.replaceState(next, "", location.href);
        }
    } catch (_) {}
}

function renderHeaderForViewAllSaved() {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `
      <button
        type="button"
        id="header-back-button"
        data-back
        aria-label="Torna indietro"
        class="flex items-center justify-center w-10 h-10"
      >
        <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
      </button>
    `;
    }

    if (headerLogoText) headerLogoText.style.display = "none";
    if (headerTitle) {
        headerTitle.textContent = "I tuoi Spot Salvati";
        headerTitle.classList.remove("hidden");
    }
}

async function closeViewAllSavedAndRestore() {
    const main = document.getElementById("main");
    if (!main) return;

    const overlay = main.querySelector('[data-overlay-view="view-all-saved"]');
    if (overlay) {
        closeOverlay(overlay);
    }

    clearOverlayStateMarker();
}

function attachPopstate() {
    if (__viewAllSavedPopHandler) {
        window.removeEventListener("popstate", __viewAllSavedPopHandler);
    }
    __viewAllSavedPopHandler = async () => {
        if (!isViewAllSavedOpen()) return;
        goBack();
    };
    window.addEventListener("popstate", __viewAllSavedPopHandler);
}

export async function loadViewAllSaved(returnViewKey = null) {
    try {
        const main = document.getElementById("main");
        if (!main) return;

        if (!returnViewKey) {
            const activeBtn = document.querySelector(".app-toolbar button[aria-current='page']");
            if (activeBtn) {
                returnViewKey = activeBtn.dataset.section;
            } else {
                const activeView = getActiveSectionView(main);
                returnViewKey = activeView?.getAttribute("data-section-view") || activeView?.id || null;
            }
        }

        // Check if the overlay is still in the DOM
        if (__viewAllSavedOverlayEl && !main.contains(__viewAllSavedOverlayEl)) {
            __viewAllSavedOverlayEl = null;
            __viewAllSavedInitialized = false;
        }

        if (__viewAllSavedOverlayEl && __viewAllSavedInitialized) {
            __viewAllSavedOverlayEl.hidden = false;
            if (returnViewKey) __viewAllSavedOverlayEl.dataset.returnView = String(returnViewKey);

            hideAllSectionViews(main);

            pushOverlayState(returnViewKey);

            main.classList.remove("view-all-saved-enter");
            void main.offsetWidth;
            main.classList.add("view-all-saved-enter");

            renderHeaderForViewAllSaved();

            setupBackButton({
                fallback: async () => {
                    await closeViewAllSavedAndRestore();
                },
            });

            attachPopstate();

            await populateViewAllSavedSpots({ preserveDom: true });

            initializeBookmarks();
            await syncAllBookmarks();

            return;
        }

        const html = await getViewAllSavedHtml();
        if (!html) return;

        __viewAllSavedOverlayEl = mountOverlayView(main, {
            id: "view-all-saved",
            html,
            returnViewKey,
        });

        pushOverlayState(returnViewKey);

        main.classList.remove("view-all-saved-enter");
        void main.offsetWidth;
        main.classList.add("view-all-saved-enter");

        renderHeaderForViewAllSaved();

        const root = getViewAllSavedRoot();

        if (!__viewAllSavedInitialized) {
            const carouselEl = root.querySelector("#view-all-saved-carousel");
            if (carouselEl) initializeVerticalCarousel(carouselEl, { cardSelector: '[data-slot="spot"]' });

            initializeSpotClickHandlers();
            initializeViewAllSavedSearch(root);

            __viewAllSavedInitialized = true;
        }

        await populateViewAllSavedSpots({ preserveDom: true });

        initializeBookmarks();
        await syncAllBookmarks();

        setupBackButton({
            fallback: async () => {
                await closeViewAllSavedAndRestore();
            },
        });

        attachPopstate();
    } catch (err) {
    }
}

async function populateViewAllSavedSpots({ preserveDom = false } = {}) {
    try {
        const currentUser = await getFirstUser();
        if (!currentUser) return;

        const root = getViewAllSavedRoot();
        if (!root) return;

        const savedContainer = root.querySelector("#view-all-saved-carousel");
        if (!savedContainer) return;

        savedContainer.querySelectorAll("[data-empty-saved]").forEach((el) => el.remove());

        const savedSpotRelations = (await getSavedSpots(currentUser.id)) || [];

        const existingCards = new Map(
            Array.from(savedContainer.querySelectorAll('[data-slot="spot"][data-spot-id]')).map((el) => [
                String(el.getAttribute("data-spot-id")),
                el,
            ])
        );

        if (!preserveDom) {
            savedContainer.querySelectorAll('[data-slot="spot"]').forEach((el) => el.remove());
            existingCards.clear();
        }

        if (savedSpotRelations.length === 0) {
            savedContainer.querySelectorAll('[data-slot="spot"]').forEach((el) => el.remove());

            const p = document.createElement("p");
            p.dataset.emptySaved = "true";
            p.className = "text-center text-text_color/60 py-8";
            p.textContent = "Nessuno spot salvato";
            savedContainer.appendChild(p);
            return;
        }

        const allSpots = (await getSpots()) || [];
        const neededIds = new Set(savedSpotRelations.map((r) => String(r.idLuogo)).filter(Boolean));
        const spotsToShow = allSpots.filter((s) => neededIds.has(String(s.id)));

        spotsToShow.sort((a, b) => distanceFromUserToSpot(a) - distanceFromUserToSpot(b));

        const template = root.querySelector("#classic-spot-card-template");
        if (!template?.content?.firstElementChild) return;

        const categoryCache = new Map();

        for (const spot of spotsToShow) {
            const id = String(spot.id);

            let cardNode = existingCards.get(id);
            const isNew = !cardNode;

            if (!cardNode) cardNode = template.content.firstElementChild.cloneNode(true);

            cardNode.setAttribute("data-spot-id", spot.id);

            const cat = (spot.idCategoria || "unknown").toLowerCase();
            cardNode.setAttribute("data-category", cat);

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
                if (!categoryCache.has(key)) categoryCache.set(key, await getCategoryNameIt(spot.idCategoria));
                categoryEl.textContent = categoryCache.get(key) || "";
            }

            const distanceEl = cardNode.querySelector('[data-field="distance"]');
            if (distanceEl) distanceEl.textContent = formatDistance(distanceFromUserToSpot(spot));

            const ratingEl = cardNode.querySelector('[data-field="rating"]');
            if (ratingEl) {
                const rating = spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
                const n = Number(String(rating ?? "").replace(",", "."));
                ratingEl.textContent = Number.isFinite(n) ? (Math.round(n * 10) / 10).toFixed(1) : "-";
            }

            if (isNew) savedContainer.appendChild(cardNode);
            existingCards.delete(id);
        }

        for (const [, leftover] of existingCards) leftover.remove();
    } catch (error) {
    }
}

function initializeViewAllSavedSearch(rootArg) {
    const root = rootArg || getViewAllSavedRoot();
    if (!root) return;

    const searchInput = root.querySelector("#search-bar-input");
    const keyboard = root.querySelector("#view-all-saved-keyboard");
    const overlay = root.querySelector("#view-all-saved-keyboard-overlay");
    if (!searchInput || !keyboard || !overlay) return;

    const track = root.querySelector("#view-all-saved-carousel");

    if (searchInput.dataset.bound === "true") return;
    searchInput.dataset.bound = "true";

    function updateKeyboardOverlay(visible) {
        if (visible) {
            keyboard.classList.add("keyboard-visible");
            overlay.classList.add("overlay-visible");
            keyboard.style.transform = "translateY(0)";
            overlay.style.transform = "translateY(0)";
        } else {
            keyboard.classList.remove("keyboard-visible");
            overlay.classList.remove("overlay-visible");
            keyboard.style.transform = "translateY(100%)";
            overlay.style.transform = "translateY(100%)";
        }
    }

    searchInput.addEventListener("focus", () => {
        updateKeyboardOverlay(true);

        if (track && window.innerWidth <= 1024) {
            track.style.transform = "translateY(-320px)";
            track.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        }
    });

    searchInput.addEventListener("blur", () => {
        updateKeyboardOverlay(false);

        searchInput.value = "";

        const spotCards = root.querySelectorAll('[data-slot="spot"]');
        spotCards.forEach((card) => {
            const spotId = card.getAttribute("data-spot-id");
            card.style.display = spotId && spotId.trim() !== "" ? "" : "none";
            card.style.zIndex = "998";
        });

        if (track) {
            track.style.transform = "translateY(0)";
            track.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        }
    });

    const keyButtons = keyboard.querySelectorAll(".kb-key, .kb-space, .kb-backspace");
    const closeBtn = keyboard.querySelector(".kb-close");

    keyButtons.forEach((button) => {
        if (button.dataset.bound === "true") return;
        button.dataset.bound = "true";

        button.addEventListener("click", (e) => {
            e.preventDefault();

            const key = button.dataset.key;
            if (key === "backspace") searchInput.value = searchInput.value.slice(0, -1);
            else if (key === " ") searchInput.value += " ";
            else if (key) searchInput.value += key.toLowerCase();

            searchInput.focus();
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        });
    });

    if (closeBtn && closeBtn.dataset.bound !== "true") {
        closeBtn.dataset.bound = "true";
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            searchInput.blur();
        });
    }

    if (overlay.dataset.bound !== "true") {
        overlay.dataset.bound = "true";
        overlay.addEventListener("click", (e) => {
            e.preventDefault();
            searchInput.blur();
        });
    }

    if (keyboard.dataset.boundMouse !== "true") {
        keyboard.dataset.boundMouse = "true";
        keyboard.addEventListener("mousedown", (e) => e.preventDefault());
    }

    searchInput.addEventListener("input", () => {
        const searchQuery = searchInput.value.toLowerCase().trim();
        const spotCards = root.querySelectorAll('[data-slot="spot"]');

        spotCards.forEach((card) => {
            const spotId = card.getAttribute("data-spot-id");
            if (!spotId || spotId.trim() === "") {
                card.style.display = "none";
                card.style.zIndex = "998";
                return;
            }

            const title = card.querySelector('[data-field="title"]');
            const titleText = title ? (title.textContent || "").toLowerCase() : "";

            if (searchQuery === "") {
                card.style.display = "";
                card.style.zIndex = "998";
            } else {
                const matches = titleText.includes(searchQuery);
                card.style.display = matches ? "" : "none";
                card.style.zIndex = matches ? "1001" : "998";
            }
        });
    });
}
