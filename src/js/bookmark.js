
let showConfirmModal;

import("./confirmModal.js").then(module => {
    showConfirmModal = module.showConfirmModal;
}).catch(err => console.error("Errore nel caricamento di confirmModal.js:", err));

const BOOKMARK_ICONS = {
    filled: "../assets/icons/homepage/Bookmark.svg",
    empty: "../assets/icons/homepage/BookmarkEmpty.svg"
};

export function initializeBookmarks() {
    const bookmarkButtons = document.querySelectorAll('[data-bookmark-button]:not([data-bookmark-type="saved"]):not([data-bookmark-initialized])');

    bookmarkButtons.forEach(button => {
        const card = button.closest('[role="listitem"]');
        if (!card) return;

        button.dataset.saved = 'false';
        button.dataset.bookmarkInitialized = 'true';

        updateBookmarkIcon(button, false);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            toggleBookmark(button, card);
        });
    });
}

function updateBookmarkIcon(button, isSaved) {
    const icon = button.querySelector('.bookmark-icon');
    if (!icon) return;

    if (isSaved) {
        icon.src = BOOKMARK_ICONS.filled;
        button.setAttribute('aria-label', 'Rimuovi dai salvati');
    } else {
        icon.src = BOOKMARK_ICONS.empty;
        button.setAttribute('aria-label', 'Aggiungi ai salvati');
    }
}

async function toggleBookmark(button, card) {
    if (button.dataset.processing === 'true') {
        return;
    }

    button.dataset.processing = 'true';

    const isSaved = button.dataset.saved === 'true';
    const spotTitle = card.querySelector('[data-field="title"]')?.textContent || "questo spot";

    if (!isSaved) {
        addSpotToSaved(card);
        button.dataset.saved = 'true';
        updateBookmarkIcon(button, true);
        button.dataset.processing = 'false';
    } else {
        const confirmed = await showConfirmModal(
            "Rimuovi dai salvati?",
            `Sei sicuro di voler rimuovere "${spotTitle}" dai tuoi spot salvati?`,
            () => {
            },
            () => {
            }
        );

        if (confirmed) {
            button.dataset.saved = 'false';
            updateBookmarkIcon(button, false);
        }

        button.dataset.processing = 'false';
    }
}

function addSpotToSaved(sourceCard) {
    let spotTitle = sourceCard.querySelector('[data-field="title"]')?.textContent || '';
    let spotImage = sourceCard.querySelector('[data-field="image"]')?.src || '';
    let spotDistance = sourceCard.querySelector('[data-field="distance"]')?.textContent || '0 m';
    let spotCategory = sourceCard.querySelector('[data-field="category"]')?.textContent || '';
    let spotRating = sourceCard.querySelector('[data-field="rating"]')?.textContent || '4.5';

    const uniqueId = `saved-${spotTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

    const newCard = document.createElement('article');
    newCard.className = 'spot-card spot-card--saved';
    newCard.setAttribute('role', 'listitem');
    newCard.setAttribute('data-spot-id', '');
    newCard.dataset.savedCardId = uniqueId;

    newCard.innerHTML = `
        <div class="spot-card-media">
            <div class="spot-image-container">
                <img src="${spotImage}" alt="Foto spot" class="spot-card-image" data-field="image"/>
            </div>
            <button
                    type="button"
                    class="spot-card-bookmark"
                    aria-label="Rimuovi dai salvati"
                    data-bookmark-button
                    data-bookmark-type="saved"
                    data-saved="true"
            >
                <img src="../assets/icons/homepage/Bookmark.svg" alt="Bookmark" class="bookmark-icon">
            </button>
        </div>

        <div class="spot-card-body">
            <div class="flex flex-row justify-between items-center">
                <h3 class="spot-card-title" data-field="title">${spotTitle}</h3>
                <p class="spot-card-rating">
                    <span class="spot-rating-value" data-field="rating">${spotRating}</span> <span aria-hidden="true">★</span>
                </p>
            </div>

            <p class="spot-card-meta mt-2">
                <span class="meta-item">
                    <img src="../assets/icons/homepage/Place Marker.svg" class="icon-mini" alt="Posizione">
                    <span class="spot-distance" data-field="distance">${spotDistance}</span>
                </span>
                <span class="meta-sep">•</span>
                <span class="meta-item">
                    <span class="spot-category" data-field="category">${spotCategory}</span>
                </span>
            </p>
        </div>
    `;

    const savedContainer = document.getElementById('home-saved-container');
    if (savedContainer) {
        savedContainer.appendChild(newCard);

        const bookmarkBtn = newCard.querySelector('[data-bookmark-button]');
        if (bookmarkBtn) {
            bookmarkBtn.dataset.cardId = uniqueId;
            bookmarkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                import('./savedBookmarks.js').then(module => {
                    const card = bookmarkBtn.closest('[role="listitem"]');
                    module.handleRemoveFromSaved(bookmarkBtn, card);
                });
            });
        }
    }
}

function removeFromSavedCarouselById(cardId) {
    const savedContainer = document.getElementById('home-saved-container');
    if (!savedContainer) return;

    const savedCard = savedContainer.querySelector(`[data-saved-card-id="${cardId}"]`);
    if (savedCard) {
        savedCard.style.opacity = '0';
        savedCard.style.transform = 'scale(0.95)';
        savedCard.style.transition = 'all 0.3s ease-out';

        setTimeout(() => {
            savedCard.remove();
        }, 300);
    }
}

function removeFromSavedCarouselByTitle(spotTitle) {
    const savedContainer = document.getElementById('home-saved-container');
    if (!savedContainer) return;

    const allCards = savedContainer.querySelectorAll('[role="listitem"]');
    for (let card of allCards) {
        const cardTitle = card.querySelector('[data-field="title"]')?.textContent || '';
        if (cardTitle === spotTitle) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = 'all 0.3s ease-out';

            setTimeout(() => {
                card.remove();
            }, 300);

            break;
        }
    }
}

