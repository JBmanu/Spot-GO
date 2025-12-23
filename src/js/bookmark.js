/**
 * Gestione bookmark (spot salvati)
 */

import { addBookmark, removeBookmark, getFirstUser, getSavedSpots } from "./query.js";
import { showConfirmModal } from "./confirmModal.js";
import { populateSavedSpots } from "./spotDetail.js";

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
    carouselTrackToprated: ".vertical-carousel-track",
    bookmarkTypeAttr: "data-bookmark-type",
    bookmarkInitializedAttr: "data-bookmark-initialized",
    spotIdAttr: "data-spot-id",
    titleField: '[data-field="title"]',
};

const MESSAGES = {
    removeConfirmTitle: "Rimuovi dai salvati?",
    removeConfirmMessage: (spotTitle) =>
        `Sei sicuro di voler rimuovere "${spotTitle}" dai tuoi spot salvati?`,
    userNotFound: "Utente non trovato",
};

const TIMING = {
    debounce: 50,
    animationRemove: 300,
};

/**
 * Inizializza i bookmark button.
 */
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

/**
 * Sincronizza lo stato dei bookmark dal DB e aggiorna la UI.
 */
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
        console.error("Errore nella sincronizzazione dei bookmark:", error);
    }
}

/**
 * Gestisce il click su un bookmark button.
 */
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
            await removeBookmarkFlow(currentUser.id, spotId, { removeCard: true, card });
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
        console.error("Errore gestione bookmark:", error);
    } finally {
        setProcessing(button, false);
    }
}

/**
 * Aggiunge un bookmark a DB e aggiorna la sezione salvati.
 */
async function addBookmarkFlow(userId, spotId) {
    try {
        await addBookmark(userId, spotId);
        await updateSavedSection();
        await syncAllBookmarks();
    } catch (error) {
        console.error("Errore nell'aggiunta del bookmark:", error);
    }
}

/**
 * Rimuove un bookmark da DB e aggiorna la sezione salvati.
 */
async function removeBookmarkFlow(userId, spotId, { removeCard = false, card = null } = {}) {
    try {
        await removeBookmark(userId, spotId);

        if (removeCard && card) {
            await removeCardFromView(card);
        }

        await updateSavedSection();
        await syncAllBookmarks();
    } catch (error) {
        console.error("Errore nella rimozione del bookmark:", error);
    }
}

/**
 * Aggiorna la sezione "Spot Salvati" chiamando populateSavedSpots.
 */
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
            } catch (e) {
                // ignore
            }

            reinitializeSavedBookmarks();
        }
    } catch (error) {
        console.error("Errore aggiornamento sezione salvati:", error);
    }
}

/**
 * Ricollega i bookmark button della sezione salvati.
 */
function reinitializeSavedBookmarks() {
    const savedContainer = document.getElementById('home-saved-container');
    if (!savedContainer) return;

    const bookmarkButtons = savedContainer.querySelectorAll('[data-bookmark-button]');
    bookmarkButtons.forEach((button) => {
        button.removeAttribute(SELECTORS.bookmarkInitializedAttr);
    });

    initializeBookmarks();
}

/**
 * Recupera gli ID degli spot salvati.
 */
async function getSavedSpotIds(userId) {
    const savedSpots = await getSavedSpots(userId);
    return new Set(savedSpots.map((s) => s.idLuogo));
}

/**
 * Aggiorna le icone di tutti i bookmark.
 */
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

/**
 * Aggiorna la visuale di un singolo bookmark button.
 */
export function updateBookmarkVisual(button, isSaved) {
    let icon = button.querySelector(SELECTORS.bookmarkIcon);
    if (!icon) icon = button.querySelector('img');
    if (!icon) return;

    icon.src = isSaved ? BOOKMARK_ICONS.filled : BOOKMARK_ICONS.empty;
    button.setAttribute(
        "aria-label",
        isSaved ? "Rimuovi dai salvati" : "Aggiungi ai salvati"
    );
}

/**
 * Reinizializza tutti i carousel.
 */
async function reinitializeCarousels() {
    try {
        const { initializeCarousel, resetCarouselState } = await import("./carousel.js");

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
        console.error("Errore nella reinizializzazione del carousel:", error);
    }
}

/**
 * Estrae lo spot ID da una card.
 */
function getSpotIdFromCard(card) {
    return card.getAttribute(SELECTORS.spotIdAttr) || "";
}

/**
 * Estrae il titolo dello spot da una card.
 */
function getSpotTitle(card) {
    return card.querySelector(SELECTORS.titleField)?.textContent || "questo spot";
}

/**
 * Controlla se il button è già in processing.
 */
function isProcessingAllowed(button) {
    return button.dataset.processing !== "true";
}

/**
 * Imposta lo stato di processing di un button.
 */
function setProcessing(button, isProcessing) {
    button.dataset.processing = isProcessing ? "true" : "false";
}

/**
 * Rimuove una card dal DOM.
 */
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
