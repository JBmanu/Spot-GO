import { getCurrentUser, getReviews, getSpotById, deleteReview } from "../database.js";
import { openEditReviewModal } from "./addReview.js";

const OVERLAY_ID = "view-all-reviews";
const OVERLAY_SELECTOR = `[data-overlay-view="${OVERLAY_ID}"]`;

const state = {
    htmlCache: null,
    overlay: null,
    initialized: false,
};

function getMain() {
    return document.getElementById("main");
}

async function fetchOverlayHtml() {
    if (state.htmlCache) return state.htmlCache;

    const res = await fetch("../html/profile-pages/view-all-reviews.html");
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
        title.textContent = "Le tue Recensioni";
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

const TEMPLATE_PATH = "../html/common-pages/spot-templates.html";
let cachedReviewTemplate = null;

async function getReviewTemplate() {
    if (cachedReviewTemplate) return cachedReviewTemplate;

    try {
        const response = await fetch(TEMPLATE_PATH);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        cachedReviewTemplate = doc.querySelector('[data-template="user-review-card-template"]');
        return cachedReviewTemplate;
    } catch (err) {
        console.error("Failed to fetch review template:", err);
        return null;
    }
}


async function createReviewCard(review) {
    const spot = await getSpotById(review.idLuogo);
    const spotName = spot?.nome || "Spot sconosciuto";

    const template = await getReviewTemplate();
    if (!template) {
        console.error("Review card template not found");
        return document.createElement("div");
    }

    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".review-card");


    const titleEl = card.querySelector('[data-field="title"]');
    if (titleEl) titleEl.textContent = spotName;


    const ratingEl = card.querySelector('[data-field="rating"]');
    if (ratingEl) ratingEl.textContent = review.valuation ? Number(review.valuation).toFixed(1) : "-";


    const descEl = card.querySelector('[data-field="description"]');
    if (descEl) descEl.textContent = review.description || "Nessuna descrizione";


    const dateEl = card.querySelector('[data-field="date"]');
    if (dateEl) {
        try {
            const dateObj = new Date(review.timestamp);
            dateEl.textContent = dateObj.toLocaleDateString("it-IT", { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            dateEl.textContent = "";
        }
    }


    const editBtn = card.querySelector('[data-action="edit-review"]');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            openEditReviewModal(
                review.id,
                review.idLuogo,
                review.valuation || 0,
                review.description || "",
                async () => {
                    await populateReviews();
                }
            );
        });
    }

    const deleteBtn = card.querySelector('[data-action="delete-review"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDeleteConfirmation(review);
        });
    }

    return card;
}

function showDeleteConfirmation(review) {
    const modal = document.getElementById("review-delete-modal");
    if (!modal) return;

    const confirmBtn = modal.querySelector("#delete-review-modal-confirm");
    const cancelBtn = modal.querySelector("#delete-review-modal-cancel");


    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    const closeModal = () => {
        modal.classList.remove("active");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
    };

    newCancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
    });

    newConfirmBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await deleteReview(review.id);
            await populateReviews();
            document.dispatchEvent(new CustomEvent("review:changed"));
            closeModal();
        } catch (err) {
            console.error("Error deleting review:", err);
            alert("Errore durante l'eliminazione.");
            closeModal();
        }
    });

    modal.style.display = "flex";
    requestAnimationFrame(() => {
        modal.classList.add("active");
    });

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}


async function populateReviews() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const listContainer = document.getElementById("view-all-reviews-list");
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="flex justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>';

    const reviews = await getReviews(currentUser.username);

    listContainer.innerHTML = "";

    if (reviews.length === 0) {
        listContainer.innerHTML = `
            <div class="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                <img src="../../assets/icons/profile/Thumbs%20Up%20Down.svg" class="w-12 h-12 opacity-30 mb-3 grayscale" />
                <h3 class="text-base font-semibold text-gray-600 mb-1">Nessuna recensione</h3>
                <p class="text-sm text-gray-400">Non hai ancora scritto recensioni per i tuoi spot visitati.</p>
            </div>
        `;
        return;
    }


    reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    for (const review of reviews) {
        const card = await createReviewCard(review);
        listContainer.appendChild(card);
    }
}

export async function loadViewAllReviews(returnViewKey = null) {
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

    await populateReviews();
}
