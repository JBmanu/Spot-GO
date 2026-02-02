import {
    initializeBookmarks,
    syncBookmarksUI,
    toggleBookmarkForSpot,
    updateBookmarkVisual,
} from "../common/bookmark.js";
import {
    getCategoryNameIt,
    getCurrentUser,
    getReviewsForSpot,
    getSavedSpots,
    getSpotById,
    pickRating,
} from "../database.js";
import {formatRatingAsText} from "../common/fitText.js";
import {initializeHorizontalCarousel} from "../common/carousels.js";
import {openAddReviewModal, setReviewSpotId} from "./addReview.js";
import {distanceFromUserToSpot, formatDistance} from "../common.js";
import {updateViewSpotDetails} from "../goals/missionsViewUpdater.js";
import {activateTriggerToCreateSpotMissionsWithFoto} from "../goals/missionsTrigger.js";

const state = {
    spotData: null,
    templateCache: null,
    bookmarkClickHandler: null,
    bookmarkChangeHandler: null
};

function getMain() {
    return document.getElementById("main");
}

function getActiveSectionKey(main) {
    if (!main) return "homepage";

    const overlay = main.querySelector('[data-overlay-view]:not([hidden])');
    if (overlay && overlay.dataset.overlayView !== "spot-detail") {
        return overlay.dataset.overlayView;
    }

    const visible = main.querySelector('[data-section-view]:not([hidden])');
    if (visible) return (visible?.dataset.sectionView || "homepage").trim();

    return "homepage";
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
    const btn = document.getElementById("header-bookmark-button");
    if (!btn) return;

    if (state.bookmarkClickHandler) {
        btn.removeEventListener("click", state.bookmarkClickHandler);
        state.bookmarkClickHandler = null;
    }
    if (state.bookmarkChangeHandler) {
        document.removeEventListener("bookmark:changed", state.bookmarkChangeHandler);
        state.bookmarkChangeHandler = null;
    }

    btn.style.display = "none";
    btn.removeAttribute("data-bookmark-button");
    btn.removeAttribute("data-saved");
}


export function initializeSpotClickHandlers(scopeEl = document) {
    const root = scopeEl === document ? document.getElementById("main") : scopeEl;
    if (!root || root.dataset.spotClickBound === "true") return;
    root.dataset.spotClickBound = "true";

    root.addEventListener("click", async (e) => {
        if (e.target.closest("[data-bookmark-button]")) return;
        const card = e.target.closest('[role="listitem"][data-spot-id]');
        if (!card) return;

        const spotId = (card.getAttribute("data-spot-id") || "").trim();
        if (spotId) await loadSpotDetail(spotId);
    });
}

async function loadSpotDetail(spotId) {
    try {
        const spotData = await getSpotById(spotId);
        if (!spotData) return;
        state.spotData = spotData;

        const main = getMain();
        if (!main) return;

        const returnSection = getActiveSectionKey(main);
        const existing = getDetailOverlay(main);
        if (existing) existing.remove();

        if (!state.templateCache) {
            const res = await fetch("../html/common-pages/spot-detail.html");
            if (res.ok) state.templateCache = await res.text();
        }
        if (!state.templateCache) return;
        const overlay = document.createElement("div");
        overlay.dataset.overlayView = "spot-detail";
        overlay.dataset.returnView = returnSection;
        overlay.innerHTML = state.templateCache;
        overlay.classList.add("overlay-full-page");

        overlay.onClose = removeHeaderBookmarkButton;

        main.querySelectorAll("[data-section-view], [data-overlay-view]").forEach((el) => (el.hidden = true));
        main.appendChild(overlay);
        overlay.classList.add("page-slide-in");
        main.classList.remove("spot-detail-exit");

        const wrapper = overlay.querySelector(".spot-detail-wrapper");
        if (wrapper) wrapper.setAttribute("data-category", spotData.idCategoria || "nature");

        updateDetailHeader(spotData);
        await populateSpotDetail(spotData, overlay);
        await initializeDetailHandlers(spotData, overlay);
        initializeBookmarks(overlay);
        syncBookmarksUI(overlay).catch(() => {
        });
    } catch (err) {
        console.error("loadSpotDetail error:", err);
    }
}

function updateDetailHeader(spotData) {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `
            <button type="button" id="back-button" data-back aria-label="Torna indietro"
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
    const btn = document.getElementById("header-bookmark-button");
    if (!btn) return;

    removeHeaderBookmarkButton();
    btn.style.display = "block";
    btn.setAttribute("data-bookmark-button", "true");

    state.bookmarkClickHandler = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!spotData?.id) return;
        try {
            await toggleBookmarkForSpot(spotData.id);
            await refreshHeaderBookmarkVisual(btn, spotData.id);
        } catch {
        }
    };
    btn.addEventListener("click", state.bookmarkClickHandler);

    state.bookmarkChangeHandler = (ev) => {
        if (String(ev?.detail?.spotId) !== String(spotData.id)) return;
        const isSaved = ev.detail.isSaved;
        btn.dataset.saved = isSaved ? "true" : "false";
        updateBookmarkVisual(btn, isSaved);
    };
    document.addEventListener("bookmark:changed", state.bookmarkChangeHandler);
    refreshHeaderBookmarkVisual(btn, spotData.id).catch(() => {
    });
}

async function refreshHeaderBookmarkVisual(btn, spotId) {
    const user = await getCurrentUser();
    if (!user) return;

    const saved = await getSavedSpots(user.username);
    const isSaved = (saved || []).some((s) => String(s.idLuogo) === String(spotId));
    btn.dataset.saved = isSaved ? "true" : "false";
    updateBookmarkVisual(btn, isSaved);
}

async function populateSpotDetail(spotData, scopeEl = document) {
    const fieldMap = {
        title: (el) => el.textContent = spotData.nome || "Spot",
        image: (el) => {
            el.src = spotData.immagine || "";
            el.alt = spotData.nome || "Foto spot";
        },
        rating: (el) => el.textContent = formatRatingAsText(pickRating(spotData)) || "4.5",
        distance: (el) => {
            if (spotData.posizione) {
                const distMeters = distanceFromUserToSpot(spotData);
                el.textContent = formatDistance(distMeters);
            } else {
                el.textContent = spotData.distanza ? `${spotData.distanza} m` : "-";
            }
        },
        category: async (el) => {
            const catId = spotData.idCategoria || "mystery";
            const catName = await getCategoryNameIt(catId).catch(() => catId);

            const iconMap = {
                "food": "../../assets/icons/homepage/Fast Food.svg",
                "culture": "../../assets/icons/homepage/Cathedral.svg",
                "nature": "../../assets/icons/homepage/Oak Tree.svg",
                "mystery": "../../assets/icons/homepage/Desura.svg"
            };
            const iconSrc = iconMap[catId] || iconMap["mystery"];

            el.innerHTML = `
                <img src="${iconSrc}" class="spot-category-icon" alt="" />
                <span>${catName}</span>
            `;
        },
        description: (el) => el.textContent = spotData.descrizione || "Nessuna descrizione disponibile",
        address: (el) => el.textContent = spotData.indirizzo || "",
        hours: (el) => {
            const orari = Array.isArray(spotData.orari) ? spotData.orari : [];
            el.textContent = orari.length ? orari.map((o) => `${o.inizio} - ${o.fine}`).join(" | ") : "";
        },
        cost: (el) => {
            const costo = Array.isArray(spotData.costo) ? spotData.costo : [];
            el.textContent = costo.length
                ? costo.map((c) => (c.prezzo === 0 ? "Gratuito" : `${c.tipo}: €${c.prezzo}`)).join(" | ")
                : "";
        }
    };

    const elements = scopeEl.querySelectorAll("[data-field]");
    for (const el of elements) {
        const fieldName = el.dataset.field;
        if (fieldMap[fieldName]) {
            await fieldMap[fieldName](el);
        }
    }

    await renderSpotReviews(spotData.id, scopeEl);
}

async function renderSpotReviews(spotId, scopeEl) {
    const container = scopeEl.querySelector("#spot-reviews-track");
    if (!container) return;

    const reviews = await getReviewsForSpot(spotId);
    if (!reviews || reviews.length === 0) {
        container.removeAttribute("data-carousel-type");
        container.innerHTML = `
            <div class="spot-reviews-empty">
                <img src="../../assets/icons/homepage/Star.svg" class="spot-reviews-empty-icon" alt="" />
                <h3 class="spot-reviews-empty-title">Nessuna recensione ancora</h3>
                <p class="spot-reviews-empty-text">Sii il primo a condividere la tua esperienza in questo spot!</p>
            </div>
        `;
        return;
    }

    container.setAttribute("data-carousel-type", "horizontal");
    container.innerHTML = "";
    const template = document.querySelector('[data-template="review-template"]');
    if (!template) return;

    for (const review of reviews) {
        const clone = template.content.cloneNode(true);

        const authorEl = clone.querySelector('[data-slot="author"]');
        const ratingEl = clone.querySelector('[data-slot="rating"]');
        const textEl = clone.querySelector('[data-slot="text"]');

        if (authorEl) authorEl.textContent = review.idUtente || "Anonimo";
        if (ratingEl) ratingEl.textContent = review.valuation || "5";
        if (textEl) textEl.textContent = review.description || "";

        container.appendChild(clone);
    }

    initializeHorizontalCarousel(container);
}

function setupToolbarNavigation() {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar || toolbar.dataset.detailBound === "true") return;
    toolbar.dataset.detailBound = "true";

    toolbar.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-section]");
        if (!btn || btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true") return;
    });
}

async function initializeDetailHandlers(spotData, overlayEl) {
    const shown = getActiveSectionKey(getMain()) || "homepage";
    const scope = getSectionWrapper(getMain(), shown) || document;
    syncBookmarksUI(scope).catch(() => {
    });
    initializeBookmarks(scope);

    // Initialize spot detail missions view: count how many missions are completed and missions

    const btnCreateMissions = overlayEl.querySelector('#spot-detail-share-button');
    btnCreateMissions.addEventListener("click", async (_) =>
        await activateTriggerToCreateSpotMissionsWithFoto(btnCreateMissions, spotData, overlayEl))

    await updateViewSpotDetails(spotData, overlayEl)

    const missionsToggle = overlayEl?.querySelector("#spot-missions-toggle") || document.getElementById("spot-missions-toggle");
    if (missionsToggle) {
        missionsToggle.addEventListener("click", (e) => {
            console.log("CLICK: Toggle missions details");
            const missionsDetails = overlayEl?.querySelector("#spot-missions-details") || document.getElementById("spot-missions-details");
            if (!missionsDetails) return;

            const isHidden = missionsDetails.style.display === "none";
            missionsDetails.style.display = isHidden ? "block" : "none";
            missionsToggle.classList.toggle("expanded", isHidden);
        });
    }

    const addReviewBtn = overlayEl?.querySelector(".spot-add-review-button");
    if (addReviewBtn) {
        addReviewBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!state.spotData?.id) return;

            setReviewSpotId(state.spotData.id, async () => {
                const updatedSpot = await getSpotById(state.spotData.id);
                if (updatedSpot) {
                    state.spotData = updatedSpot;
                    await populateSpotDetail(updatedSpot, overlayEl);
                    updateDetailHeader(updatedSpot);
                }
            });

            await openAddReviewModal();
        });
    }

    const navButton = overlayEl?.querySelector("#spot-detail-visit-button");
    let navModal = overlayEl?.querySelector("#spot-navigation-modal");

    if (navModal) {
        const phoneScreen = document.querySelector(".phone-screen");
        if (phoneScreen && navModal.parentElement !== phoneScreen) {
            phoneScreen.appendChild(navModal);
        }
    }

    const navCancel = navModal?.querySelector("#nav-modal-cancel");
    const navConfirm = navModal?.querySelector("#nav-modal-confirm");

    if (navButton && navModal) {
        navButton.addEventListener("click", (e) => {
            e.preventDefault();
            navModal.style.display = "flex";
            requestAnimationFrame(() => {
                navModal.classList.add("active");
            });

            const mainContainer = document.getElementById("main");
            if (mainContainer) {
                mainContainer.style.overflow = "hidden";
            }
        });

        const closeModal = () => {
            navModal.classList.remove("active");

            setTimeout(() => {
                navModal.style.display = "none";

                const mainContainer = document.getElementById("main");
                if (mainContainer) {
                    mainContainer.style.overflow = "";
                }
            }, 300);
        };

        if (navCancel) navCancel.addEventListener("click", closeModal);
        if (navConfirm) navConfirm.addEventListener("click", closeModal);

        navModal.addEventListener("click", (e) => {
            if (e.target === navModal) closeModal();
        });
    }

    setupToolbarNavigation();
}

export async function openSpotDetailById(spotId) {
    if (spotId) await loadSpotDetail(String(spotId).trim());
}
