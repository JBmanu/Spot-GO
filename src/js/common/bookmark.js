import { getCurrentUser, getSavedSpots, addSavedSpot, removeSavedSpot } from "../database.js";
import { showConfirmModal } from "../ui/confirmModal.js";


const BOOKMARK_ICONS = {
    filled: "assets/icons/homepage/Bookmark.svg",
    empty: "assets/icons/homepage/BookmarkEmpty.svg",
};

const SELECTORS = {
    bookmarkButton: "[data-bookmark-button]",
    spotIdAttr: "data-spot-id",
};

const MESSAGES = {
    removeConfirmTitle: "Rimuovi dai salvati?",
    removeConfirmMessage: (spotTitle) =>
        `Sei sicuro di voler rimuovere "${spotTitle}" dai tuoi spot salvati?`,
    userNotFound: "Utente non trovato",
};

document.addEventListener("click", (e) => {
    const btn = e.target.closest(SELECTORS.bookmarkButton);
    if (!btn) return;
    const card = btn.closest('[role="listitem"]');
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

export function initializeBookmarkButton(card, { saved = "false" } = {}) {
    const btn = card.querySelector(SELECTORS.bookmarkButton);
    if (!btn) return;

    btn.dataset.saved = saved;
    updateBookmarkVisual(btn, saved === "true");
}

export async function syncBookmarksUI(scope = document) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        const savedSpotIds = await getSavedSpotIds(currentUser.username);
        scope.querySelectorAll(SELECTORS.bookmarkButton).forEach((button) => {
            const card = button.closest('[role="listitem"]');
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
    const icon = button.querySelector("img");
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

        const isSaved = button.dataset.saved === "true";

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
}

async function removeBookmarkFlow(username, spotId) {
    await removeBookmark(username, spotId);
    updateIconsForSpot(spotId, false);
    emitBookmarkChanged(spotId, false);
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
        const card = button.closest('[role="listitem"]');
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
        new CustomEvent("bookmark:changed", { detail: { spotId, isSaved } })
    );
}

function getSpotIdFromCard(card) {
    return card.getAttribute(SELECTORS.spotIdAttr) || "";
}

function getSpotTitle(card) {
    return (
        card.querySelector('[data-field="title"]')?.textContent?.trim() ||
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
}

function isProcessingAllowed(button) {
    return button.dataset.processing !== "true";
}

function setProcessing(button, isProcessing) {
    button.dataset.processing = isProcessing ? "true" : "false";
}
