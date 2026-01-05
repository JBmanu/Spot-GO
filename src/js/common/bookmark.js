import {getCurrentUser, getSavedSpots, addSavedSpot, removeSavedSpot} from "../json-data-handler.js";
import {showConfirmModal} from "../ui/confirmModal.js";
import {populateSavedSpots} from "../pages/homepage/populate-saved-spots.js";


const BOOKMARK_ICONS = {
    filled: "../assets/icons/homepage/Bookmark.svg",
    empty: "../assets/icons/homepage/BookmarkEmpty.svg",
};

const SELECTORS = {
    bookmarkButton: "[data-bookmark-button]",
    bookmarkCard: '[role="listitem"]',
    bookmarkIcon: ".bookmark-icon",
    bookmarkTypeAttr: "data-bookmark-type",
    spotIdAttr: "data-spot-id",
    titleField: '[data-field="title"]',
    carouselSavedRoot: "#home-saved-container",
    savedShell: ".spot-card-saved",
};

const MESSAGES = {
    removeConfirmTitle: "Rimuovi dai salvati?",
    removeConfirmMessage: (spotTitle) =>
        `Sei sicuro di voler rimuovere "${spotTitle}" dai tuoi spot salvati?`,
    userNotFound: "Utente non trovato",
};

const TIMING = {animationRemove: 300};

document.addEventListener("click", (e) => {
    const btn = e.target.closest(SELECTORS.bookmarkButton);
    if (!btn) return;
    const card = btn.closest(SELECTORS.bookmarkCard);
    if (!card) return;
    e.preventDefault();
    handleBookmarkClick(btn, card).catch((err) =>
        console.error("Errore in handleBookmarkClick:", err)
    );
});

export function initializeBookmarks(root = document) {
    root.querySelectorAll(SELECTORS.bookmarkButton).forEach((button) => {
        if (typeof button.dataset.saved === "undefined") return;
        updateBookmarkVisual(button, button.dataset.saved === "true");
    });
}

export async function syncBookmarksUI(scope = document) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        const savedSpotIds = await getSavedSpotIds(currentUser.username);
        scope.querySelectorAll(SELECTORS.bookmarkButton).forEach((button) => {
            const card = button.closest(SELECTORS.bookmarkCard);
            if (!card) return;
            const spotId = getSpotIdFromCard(card);
            if (!spotId) return;
            const isSaved = savedSpotIds.has(spotId);
            button.dataset.saved = isSaved ? "true" : "false";
            updateBookmarkVisual(button, isSaved);
        });
    } catch (error) {
        console.error("Errore in syncBookmarksUI:", error);
    }
}

export function updateBookmarkVisual(button, isSaved) {
    const icon =
        button.querySelector(SELECTORS.bookmarkIcon) || button.querySelector("img");
    if (!icon) return;
    icon.src = isSaved ? BOOKMARK_ICONS.filled : BOOKMARK_ICONS.empty;
    button.setAttribute(
        "aria-label",
        isSaved ? "Rimuovi dai salvati" : "Aggiungi ai salvati"
    );
}

export async function toggleBookmarkForSpot(spotId) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error(MESSAGES.userNotFound);
            return;
        }
        const savedSpotIds = await getSavedSpotIds(currentUser.username);
        const isSaved = savedSpotIds.has(spotId);
        if (!isSaved) {
            await addBookmark(currentUser.username, spotId);
            updateIconsForSpot(spotId, true);
            emitBookmarkChanged(spotId, true);
            await updateSavedSection({preserveScroll: true});
            return;
        }
        const confirmed = await showConfirmModal(
            MESSAGES.removeConfirmTitle,
            MESSAGES.removeConfirmMessage("questo spot")
        );
        if (!confirmed) return;
        await removeBookmark(currentUser.username, spotId);
        updateIconsForSpot(spotId, false);
        emitBookmarkChanged(spotId, false);
        await updateSavedSection({preserveScroll: true});
    } catch (error) {
        console.error("Errore toggleBookmarkForSpot:", error);
    }
}

async function handleBookmarkClick(button, card) {
    if (!isProcessingAllowed(button)) return;
    setProcessing(button, true);
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error(MESSAGES.userNotFound);
            return;
        }
        const username = currentUser.username;
        const spotId = getSpotIdFromCard(card);
        const spotTitle = getSpotTitle(card);
        if (!spotId) return;
        const bookmarkType = button.getAttribute(SELECTORS.bookmarkTypeAttr);
        const isSaved = button.dataset.saved === "true";
        if (bookmarkType === "saved") {
            const confirmed = await showConfirmModal(
                MESSAGES.removeConfirmTitle,
                MESSAGES.removeConfirmMessage(spotTitle)
            );
            if (!confirmed) return;
            await removeBookmarkFlow(username, spotId, {removeCard: true, card});
            return;
        }
        if (!isSaved) {
            await addBookmarkFlow(username, spotId);
        } else {
            const confirmed = await showConfirmModal(
                MESSAGES.removeConfirmTitle,
                MESSAGES.removeConfirmMessage(spotTitle)
            );
            if (!confirmed) return;
            await removeBookmarkFlow(username, spotId);
        }
    } finally {
        setProcessing(button, false);
    }
}

async function addBookmarkFlow(username, spotId) {
    await addBookmark(username, spotId);
    updateIconsForSpot(spotId, true);
    emitBookmarkChanged(spotId, true);
    await updateSavedSection({preserveScroll: true});
}

async function removeBookmarkFlow(
    username,
    spotId,
    {removeCard = false, card = null} = {}
) {
    await removeBookmark(username, spotId);
    updateIconsForSpot(spotId, false);
    emitBookmarkChanged(spotId, false);
    if (removeCard && card) {
        await removeCardFromView(card);
        await maybeToggleSavedEmptyState();
        return;
    }
    await updateSavedSection({preserveScroll: true});
}

function getCarouselTrack(rootEl) {
    return (
        rootEl.querySelector(":scope > .carousel-horizontal_track") ||
        rootEl.querySelector(".carousel-horizontal_track") ||
        rootEl
    );
}

async function updateSavedSection({preserveScroll = true} = {}) {
    try {
        if (typeof populateSavedSpots !== "function") return;
        const savedRoot = document.querySelector(SELECTORS.carouselSavedRoot);
        if (!savedRoot) return;
        const trackBefore = getCarouselTrack(savedRoot);
        const prevScrollLeft = preserveScroll ? trackBefore.scrollLeft : 0;
        await populateSavedSpots({containerId: "home-saved-container"});
        await nextFrame();
        await nextFrame();
        const {initializeHorizontalCarousel} = await import("../common/carousels.js");
        savedRoot.classList.add("js-carousel-horizontal");
        initializeHorizontalCarousel(savedRoot, {cardSelector: SELECTORS.savedShell});
        await nextFrame();
        if (preserveScroll) {
            const trackAfter = getCarouselTrack(savedRoot);
            trackAfter.scrollLeft = prevScrollLeft;
        }
        initializeBookmarks(savedRoot);
        await maybeToggleSavedEmptyState();
    } catch (error) {
        console.error("Errore aggiornamento sezione salvati:", error);
    }
}

async function maybeToggleSavedEmptyState() {
    const savedRoot = document.querySelector(SELECTORS.carouselSavedRoot);
    const empty = document.getElementById("saved-empty-state");
    if (!savedRoot || !empty) return;
    const track = getCarouselTrack(savedRoot);
    const count = track.querySelectorAll(
        `${SELECTORS.savedShell}:not([data-template])`
    ).length;
    if (count === 0) empty.classList.remove("hidden");
    else empty.classList.add("hidden");
}

async function getSavedSpotIds(userId) {
    const savedSpots = await getSavedSpots(userId);
    const ids = (savedSpots || [])
        .map((s) => s?.idLuogo ?? s?.id ?? s?.spotId ?? "")
        .filter(Boolean);
    return new Set(ids);
}

function updateIconsForSpot(spotId, isSaved) {
    document.querySelectorAll(SELECTORS.bookmarkButton).forEach((button) => {
        const card = button.closest(SELECTORS.bookmarkCard);
        if (!card) return;
        const cardSpotId = getSpotIdFromCard(card);
        if (cardSpotId !== spotId) return;
        button.dataset.saved = isSaved ? "true" : "false";
        updateBookmarkVisual(button, isSaved);
    });
}

function emitBookmarkChanged(spotId, isSaved) {
    if (!spotId) return;
    document.dispatchEvent(
        new CustomEvent("bookmark:changed", {detail: {spotId, isSaved}})
    );
}

function getSpotIdFromCard(card) {
    return card.getAttribute(SELECTORS.spotIdAttr) || "";
}

function getSpotTitle(card) {
    return (
        card.querySelector(SELECTORS.titleField)?.textContent?.trim() ||
        card.querySelector('[data-category="title"]')?.textContent?.trim() ||
        "questo spot"
    );
}

export async function addBookmark(username, spotId) {
    await addSavedSpot(username, spotId);
}

export async function removeBookmark(username, spotId) {
    await removeSavedSpot(username, spotId);
}

export async function syncAllBookmarks(scope = document) {
    await syncBookmarksUI(scope);
    await updateSavedSection({preserveScroll: true});
}

function isProcessingAllowed(button) {
    return button.dataset.processing !== "true";
}

function setProcessing(button, isProcessing) {
    button.dataset.processing = isProcessing ? "true" : "false";
}

function removeCardFromView(card) {
    return new Promise((resolve) => {
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        card.style.transition = `all ${TIMING.animationRemove}ms ease-out`;
        setTimeout(() => {
            card.remove();
            resolve();
        }, TIMING.animationRemove);
    });
}

function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}
