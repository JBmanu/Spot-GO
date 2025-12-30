import {addBookmark, removeBookmark, getFirstUser, getSavedSpots} from "../query.js";
import {showConfirmModal} from "./confirmModal.js";
import { populateSavedSpots } from "../pages/savedSpots.js";

const BOOKMARK_ICONS = {
    filled: "../assets/icons/homepage/Bookmark.svg",
    empty: "../assets/icons/homepage/BookmarkEmpty.svg",
};

const SELECTORS = {
    bookmarkButton: "[data-bookmark-button]",
    bookmarkCard: '[role="listitem"]',
    bookmarkIcon: ".bookmark-icon",
    carouselTrackSaved: ".saved-swipe-track",
    carouselTrackNearby: ".nearby-swipe-track",
    carouselTrackToprated: ".carousel-vertical-track",
    bookmarkTypeAttr: "data-bookmark-type",
    bookmarkInitializedAttr: "data-bookmark-initialized",
    spotIdAttr: "data-spot-id",
    titleField: '[data-field="title"]',
};

const MESSAGES = {
    removeConfirmTitle: "Rimuovi dai salvati?",
    removeConfirmMessage: (spotTitle) => `Sei sicuro di voler rimuovere "${spotTitle}" dai tuoi spot salvati?`,
    userNotFound: "Utente non trovato",
};

const TIMING = { debounce: 50, animationRemove: 300 };

document.addEventListener('click', (e) => {
    const btn = e.target.closest(SELECTORS.bookmarkButton);
    if (!btn) return;
    if (btn.hasAttribute(SELECTORS.bookmarkInitializedAttr)) return;
    const card = btn.closest(SELECTORS.bookmarkCard);
    if (!card) return;
    e.preventDefault();
    try {
        handleBookmarkClick(btn, card);
    } catch (err) {
        console.error('Errore delegato handleBookmarkClick:', err);
    }
});

export function initializeBookmarks() {
    const buttons = document.querySelectorAll(
        `${SELECTORS.bookmarkButton}:not([${SELECTORS.bookmarkInitializedAttr}])`
    );
    buttons.forEach((button) => {
        const card = button.closest(SELECTORS.bookmarkCard);
        if (!card) return;
        button.setAttribute(SELECTORS.bookmarkInitializedAttr, "true");
        if (typeof button.dataset.saved !== 'undefined') {
            const isSaved = button.dataset.saved === "true";
            updateBookmarkVisual(button, isSaved);
        }
        button.addEventListener("click", (e) => {
            e.preventDefault();
            handleBookmarkClick(button, card);
        });
    });
}

export async function syncAllBookmarks() {
    try {
        const currentUser = await getFirstUser();
        if (!currentUser) return;
        const savedSpotIds = await getSavedSpotIds(currentUser.id);
        updateAllBookmarkIcons(savedSpotIds);
        await new Promise(resolve => requestAnimationFrame(resolve));
        initializeBookmarks();
        await reinitializeCarousels();
    } catch (error) {
        console.error("Errore in syncAllBookmarks:", error);
    }
}

async function handleBookmarkClick(button, card) {
    if (!isProcessingAllowed(button)) return;
    setProcessing(button, true);
    try {
        const currentUser = await getFirstUser();
        if (!currentUser) {
            console.error(MESSAGES.userNotFound);
            return;
        }
        const spotId = getSpotIdFromCard(card);
        const spotTitle = getSpotTitle(card);
        const bookmarkType = button.getAttribute(SELECTORS.bookmarkTypeAttr);
        const isSaved = button.dataset.saved === "true";
        if (bookmarkType === "saved") {
            const confirmed = await showConfirmModal(
                MESSAGES.removeConfirmTitle,
                MESSAGES.removeConfirmMessage(spotTitle)
            );
            if (!confirmed) return;
            await removeBookmarkFlow(currentUser.id, spotId, {removeCard: true, card});
            return;
        }
        if (!isSaved) {
            await addBookmarkFlow(currentUser.id, spotId);
        } else {
            const confirmed = await showConfirmModal(
                MESSAGES.removeConfirmTitle,
                MESSAGES.removeConfirmMessage(spotTitle)
            );
            if (!confirmed) return;
            await removeBookmarkFlow(currentUser.id, spotId);
        }
    } catch (error) {
        console.error("Errore in handleBookmarkClick:", error);
    } finally {
        setProcessing(button, false);
    }
}

async function addBookmarkFlow(userId, spotId) {
    try {
        await addBookmark(userId, spotId);
        await updateSavedSection();
        await syncAllBookmarks();
    } catch (error) {
        console.error("Errore in addBookmarkFlow", error);
    }
}

async function removeBookmarkFlow(userId, spotId, {removeCard = false, card = null} = {}) {
    try {
        await removeBookmark(userId, spotId);
        if (removeCard && card) {
            await removeCardFromView(card);
        }
        await updateSavedSection();
        await syncAllBookmarks();
    } catch (error) {
        console.error("Errore in removeBookmarkFlow", error);
    }
}

async function updateSavedSection() {
    try {
        if (populateSavedSpots) {
            await populateSavedSpots();
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });
            try {
                const currentUser = await getFirstUser();
                if (currentUser) {
                    const savedFromDb = await getSavedSpots(currentUser.id);
                    const savedCount = (savedFromDb && savedFromDb.length) || 0;
                    const savedContainer = document.getElementById('home-saved-container');
                    const parentHidden = savedContainer && savedContainer.parentElement && savedContainer.parentElement.style.display === 'none';
                    if (savedCount > 0 && parentHidden) {
                        await new Promise(r => setTimeout(r, 120));
                        await populateSavedSpots();
                        await new Promise(resolve => requestAnimationFrame(resolve));
                    }
                }
            } catch (error) {
                console.error("Errore nel controllo visibilità sezione salvati:", error);
            }
            reinitializeSavedBookmarks();
        }
    } catch (error) {
        console.error("Errore aggiornamento sezione salvati:", error);
    }
}

function reinitializeSavedBookmarks() {
    const savedContainer = document.getElementById('home-saved-container');
    if (!savedContainer) return;
    const bookmarkButtons = savedContainer.querySelectorAll('[data-bookmark-button]');
    bookmarkButtons.forEach((button) => {
        button.removeAttribute(SELECTORS.bookmarkInitializedAttr);
    });
    initializeBookmarks();
}

async function getSavedSpotIds(userId) {
    const savedSpots = await getSavedSpots(userId);
    return new Set(savedSpots.map((s) => s.idLuogo));
}

function updateAllBookmarkIcons(savedSpotIds) {
    document.querySelectorAll(SELECTORS.bookmarkButton).forEach((button) => {
        const card = button.closest(SELECTORS.bookmarkCard);
        if (!card) return;
        const spotId = getSpotIdFromCard(card);
        const isSaved = savedSpotIds.has(spotId);
        button.dataset.saved = isSaved ? "true" : "false";
        updateBookmarkVisual(button, isSaved);
    });
}

export function updateBookmarkVisual(button, isSaved) {
    let icon = button.querySelector(SELECTORS.bookmarkIcon);
    if (!icon) icon = button.querySelector('img');
    if (!icon) return;
    icon.src = isSaved ? BOOKMARK_ICONS.filled : BOOKMARK_ICONS.empty;
    button.setAttribute(
        "aria-label",
        isSaved ? "Rimuovi dai salvati" : "Aggiungi ai salvati"
    );
    try {
        const card = button.closest(SELECTORS.bookmarkCard);
        const spotId = card ? getSpotIdFromCard(card) : '';
        const event = new CustomEvent('bookmark:changed', {detail: {spotId, isSaved}});
        document.dispatchEvent(event);
    } catch (error) {
        console.error("Errore in updateBookmarkVisual:", error);
    }
}

async function reinitializeCarousels() {
    try {
        const {initializeCarousel, resetCarouselState} = await import("./carousel.js");
        const selectors = [
            SELECTORS.carouselTrackSaved,
            SELECTORS.carouselTrackNearby,
            SELECTORS.carouselTrackToprated,
        ];
        const scrollPositions = {};
        selectors.forEach((sel) => {
            const el = document.querySelector(sel);
            if (el) scrollPositions[sel] = el.scrollLeft || 0;
        });
        resetCarouselState(SELECTORS.carouselTrackSaved);
        resetCarouselState(SELECTORS.carouselTrackNearby);
        resetCarouselState(SELECTORS.carouselTrackToprated);
        await new Promise(resolve => requestAnimationFrame(resolve));
        initializeCarousel(SELECTORS.carouselTrackSaved);
        initializeCarousel(SELECTORS.carouselTrackNearby);
        initializeCarousel(SELECTORS.carouselTrackToprated);
        await new Promise(resolve => requestAnimationFrame(resolve));
        selectors.forEach((sel) => {
            const el = document.querySelector(sel);
            if (el && typeof scrollPositions[sel] !== 'undefined') {
                const maxScroll = el.scrollWidth - el.clientWidth;
                el.scrollLeft = Math.min(scrollPositions[sel], Math.max(0, maxScroll));
            }
        });
    } catch (error) {
        console.error("Errore in reinitializeCarousels:", error);
    }
}

function getSpotIdFromCard(card) {
    return card.getAttribute(SELECTORS.spotIdAttr) || "";
}

function getSpotTitle(card) {
    return card.querySelector(SELECTORS.titleField)?.textContent || "questo spot";
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

export async function toggleBookmarkForSpot(spotId) {
    try {
        const currentUser = await getFirstUser();
        if (!currentUser) {
            console.error(MESSAGES.userNotFound);
            return;
        }
        const saved = await getSavedSpots(currentUser.id);
        const savedIds = (saved || []).map(s => s.idLuogo);
        const isSaved = savedIds.includes(spotId);
        if (!isSaved) {
            await addBookmark(currentUser.id, spotId);
        } else {
            const confirmed = await showConfirmModal(
                MESSAGES.removeConfirmTitle,
                MESSAGES.removeConfirmMessage('questo spot')
            );
            if (!confirmed) return;
            await removeBookmark(currentUser.id, spotId);
        }
        await updateSavedSection();
        await syncAllBookmarks();
        try {
            const newState = !isSaved;
            const evt = new CustomEvent('bookmark:changed', {detail: {spotId, isSaved: newState}});
            document.dispatchEvent(evt);
        } catch (err) {
            console.warn('Errore dispatch bookmark:changed:', err);
        }
    } catch (error) {
        console.error('Errore toggleBookmarkForSpot:', error);
    }
}
