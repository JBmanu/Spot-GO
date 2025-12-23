/**
 * Helpers per la gestione delle card degli Spot e della pagina di dettaglio.
 */

import {initializeBookmarks} from "./bookmark.js";
import { getSpots, getCategoryNameIt, getSavedSpots, getFirstUser } from "./query.js";

let spottedData = {};
let currentSpotId = null;

/**
 * Popola le card nella sezione Nearby con i dati dal DB.
 */
async function populateSpotCards() {
    try {
        const spots = await getSpots();
        const spotCards = document.querySelectorAll('#home-nearby-container [role="listitem"][data-spot-id=""]');

        for (let index = 0; index < spotCards.length; index++) {
            const card = spotCards[index];

            if (index < spots.length) {
                const spot = spots[index];
                card.setAttribute('data-spot-id', spot.id);

                const titleEl = card.querySelector('[data-field="title"]');
                if (titleEl) titleEl.textContent = spot.nome || "Spot";

                const imageEl = card.querySelector('[data-field="image"]');
                if (imageEl && spot.immagine) {
                    imageEl.src = spot.immagine;
                }

                const categoryEl = card.querySelector('[data-field="category"]');
                if (categoryEl && spot.idCategoria) {

                    categoryEl.textContent = await getCategoryNameIt(spot.idCategoria);
                }

                card.setAttribute('data-category', (spot.idCategoria || 'unknown').toLowerCase());
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Errore nel popolare le card degli spot:", error);
    }
}

/**
 * Popola la sezione "Spot Salvati" basandosi sui salvataggi dell'utente.
 */
async function populateSavedSpots() {
    try {
        const currentUser = await getFirstUser();
        if (!currentUser) {
            console.error("Utente non trovato");
            return;
        }

        const savedSpotRelations = await getSavedSpots(currentUser.id);

        const savedContainer = document.getElementById('home-saved-container');
        const emptyStateBanner = document.getElementById('saved-empty-state');

        if (!savedContainer) return;

        if (!savedSpotRelations || savedSpotRelations.length === 0) {
            if (savedContainer.parentElement) savedContainer.parentElement.style.display = 'none';
            if (emptyStateBanner) {
                emptyStateBanner.style.display = 'block';
            }
            return;
        }

        if (savedContainer.parentElement) savedContainer.parentElement.style.display = 'block';
        if (emptyStateBanner) {
            emptyStateBanner.style.display = 'none';
        }

        const allSpots = await getSpots();
        const neededIds = savedSpotRelations.map(r => r.idLuogo);
        const allCards = Array.from(savedContainer.querySelectorAll('[role="listitem"]'));

        if (allCards.length === 0) {
            console.warn('Nessuna card trovata in savedContainer, impossibile popolare UI dei salvati.');
            return;
        }

        const accounted = new Set();

        allCards.forEach(card => {
            const spotId = card.getAttribute('data-spot-id') || '';
            if (spotId && neededIds.includes(spotId)) {
                accounted.add(spotId);
            } else if (spotId && !neededIds.includes(spotId)) {
                card.setAttribute('data-spot-id', '');
                const titleEl = card.querySelector('[data-field="title"]');
                if (titleEl) titleEl.textContent = '';
                const imageEl = card.querySelector('[data-field="image"]');
                if (imageEl) imageEl.src = '';
                const bookmarkBtn = card.querySelector('[data-bookmark-button]');
                if (bookmarkBtn) bookmarkBtn.setAttribute('data-bookmark-type', 'saved');
            }
        });

        let placeholderCards = allCards.filter(c => !(c.getAttribute('data-spot-id')) || c.getAttribute('data-spot-id') === '');

        for (const idLuogo of neededIds) {
            if (accounted.has(idLuogo)) continue;
            const spot = allSpots.find(s => s.id === idLuogo);
            if (!spot) continue;

            let cardToFill = placeholderCards.shift();

            if (!cardToFill) {
                const templateCard = allCards[0];
                if (templateCard) {
                    cardToFill = templateCard.cloneNode(true);
                    cardToFill.setAttribute('data-spot-id', '');
                    const titleElC = cardToFill.querySelector('[data-field="title"]');
                    if (titleElC) titleElC.textContent = '';
                    const imageElC = cardToFill.querySelector('[data-field="image"]');
                    if (imageElC) imageElC.src = '';
                    savedContainer.appendChild(cardToFill);
                    allCards.push(cardToFill);
                } else {
                    console.warn('Impossibile clonare una card di template per i saved.');
                    continue;
                }
            }

            cardToFill.setAttribute('data-spot-id', spot.id);

            const titleEl = cardToFill.querySelector('[data-field="title"]');
            if (titleEl) titleEl.textContent = spot.nome || "Spot";

            const imageEl = cardToFill.querySelector('[data-field="image"]');
            if (imageEl && spot.immagine) {
                imageEl.src = spot.immagine;
            }

            const bookmarkBtn = cardToFill.querySelector('[data-bookmark-button]');
            if (bookmarkBtn) {
                bookmarkBtn.setAttribute('data-bookmark-type', 'saved');
            }

            cardToFill.setAttribute('data-category', (spot.idCategoria || 'unknown').toLowerCase());
            cardToFill.style.display = '';

            accounted.add(spot.id);
        }

        placeholderCards.forEach(pc => {
            pc.style.display = 'none';
        });

    } catch (error) {
        console.error("Errore nel popolare gli spot salvati:", error);
    }
}

/**
 * Inizializza i click sulle card per aprire il dettaglio spot.
 */
function initializeSpotClickHandlers() {
    const spotCards = document.querySelectorAll('[role="listitem"][data-spot-id]');

    spotCards.forEach(card => {
        card.addEventListener('click', async (e) => {

            if (e.target.closest('[data-bookmark-button]')) {
                return;
            }

            const spotId = card.getAttribute('data-spot-id');
            if (spotId && spotId !== '') {
                await loadSpotDetail(spotId);
            }
        });
    });
}

/**
 * Carica la pagina di dettaglio di uno spot.
 */
async function loadSpotDetail(spotId) {
    try {
        currentSpotId = spotId;

        const spotData = await getSpotById(spotId);
        if (!spotData) {
            console.error('Spot non trovato');
            return;
        }

        const response = await fetch("../html/spot-detail.html");
        if (!response.ok) return;

        const main = document.getElementById("main");
        if (!main) return;

        main.innerHTML = await response.text();

        const headerLeftLogo = document.querySelector(".header-left-logo");
        const headerLogoText = document.getElementById("header-logo-text");
        const headerTitle = document.getElementById("header-title");

        if (headerLeftLogo) {
            headerLeftLogo.innerHTML = `<button type="button" id="header-back-button" aria-label="Torna indietro" class="flex items-center justify-center w-10 h-10">
                <img src="../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
            </button>`;
        }
        if (headerLogoText) headerLogoText.style.display = "none";
        if (headerTitle) {
            headerTitle.textContent = spotData.nome || "Dettaglio Spot";
            headerTitle.classList.remove("hidden");
        }

        populateSpotDetail(spotData);

        initializeSpotDetailHandlers();

        deactivateAllToolbarButtons();

    } catch (err) {
        console.error("Errore nel caricamento dettaglio spot:", err);
    }
}

/**
 * Recupera uno spot per ID cercandolo nell'elenco generale.
 */
async function getSpotById(spotId) {
    try {
        const spots = await getSpots();
        const spot = spots.find(s => s.id === spotId);
        return spot || null;
    } catch (error) {
        console.error("Errore nel recupero dello spot:", error);
        return null;
    }
}

/**
 * Popola il dettaglio spot nella pagina di dettaglio.
 */
function populateSpotDetail(spotData) {
    const mainImage = document.getElementById("spot-detail-main-image");
    if (mainImage && spotData.immagine) {
        mainImage.src = spotData.immagine;
        mainImage.alt = spotData.nome;
    }

    const titleEl = document.getElementById("spot-detail-title");
    if (titleEl) {
        titleEl.textContent = spotData.nome || "Spot";
    }

    const ratingEl = document.getElementById("spot-detail-rating-value");
    if (ratingEl) {
        ratingEl.textContent = "4.5";
    }

    const categoryEl = document.getElementById("spot-detail-category");
    if (categoryEl && spotData.idCategoria) {
        getCategoryNameIt(spotData.idCategoria).then(categoryNameIt => {
            categoryEl.textContent = categoryNameIt;
        });
    }

    const distanceEl = document.getElementById("spot-detail-distance");
    if (distanceEl) {
        distanceEl.textContent = "0 m";
    }

    const descriptionEl = document.getElementById("spot-detail-description");
    if (descriptionEl) {
        descriptionEl.textContent = spotData.descrizione || "Nessuna descrizione disponibile";
    }

    const addressEl = document.getElementById("spot-detail-address");
    if (addressEl && spotData.indirizzo) {
        addressEl.textContent = spotData.indirizzo;
    }

    const hoursEl = document.getElementById("spot-detail-hours");
    if (hoursEl && spotData.orari && spotData.orari.length > 0) {
        hoursEl.textContent = spotData.orari.map(o => `${o.inizio} - ${o.fine}`).join(" | ");
    }

    const costEl = document.getElementById("spot-detail-cost");
    if (costEl && spotData.costo && spotData.costo.length > 0) {
        costEl.textContent = spotData.costo.map(c => c.prezzo === 0 ? "Gratuito" : `${c.tipo}: €${c.prezzo}`).join(" | ");
    }

    spottedData = spotData;

    updateHeaderBookmark();
}

/**
 * Inizializza handler presenti nella pagina dettaglio.
 */
function initializeSpotDetailHandlers() {
    initializeMissionsCount();

    initializeReviewsCarousel();

    const backButton = document.getElementById("header-back-button") || document.getElementById("spot-detail-back-button");
    if (backButton) {
        backButton.addEventListener("click", async () => {
            const main = document.getElementById("main");
            if (main) {
                main.classList.remove("spot-detail-enter");
                main.classList.add("spot-detail-exit");

                await new Promise(resolve => setTimeout(resolve, 300));

                main.classList.remove("spot-detail-exit");

                await goToHomepage();
            }
        });
    }

    const bookmarkButton = document.getElementById("spot-detail-bookmark-button");
    if (bookmarkButton) {
        bookmarkButton.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSpotBookmark(bookmarkButton);
            updateHeaderBookmark();
        });
    }

    const headerBookmarkButton = document.getElementById("header-bookmark-button");
    if (headerBookmarkButton) {
        headerBookmarkButton.style.display = "block";
        headerBookmarkButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const detailButton = document.getElementById("spot-detail-bookmark-button");
            if (detailButton) {
                detailButton.click();
            }
        });
    }

    const visitButton = document.getElementById("spot-detail-visit-button");
    if (visitButton) {
        visitButton.addEventListener("click", () => {
            markSpotAsVisited();
        });
    }

    const shareButton = document.getElementById("spot-detail-share-button");
    if (shareButton) {
        shareButton.addEventListener("click", () => {
            shareSpot();
        });
    }

    const missionsToggleButton = document.getElementById("spot-missions-toggle");
    if (missionsToggleButton) {
        missionsToggleButton.addEventListener("click", () => {
            toggleMissions(missionsToggleButton);
        });
    }

    initializeBookmarks();
}

/**
 * Inizializza il carosello delle recensioni presente nella pagina dettaglio.
 */
function initializeReviewsCarousel() {
    const carouselWrapper = document.querySelector(".spot-reviews-carousel-wrapper");
    if (!carouselWrapper) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    carouselWrapper.addEventListener("mousedown", (e) => {
        isDown = true;
        carouselWrapper.classList.add("is-dragging");
        startX = e.pageX - carouselWrapper.offsetLeft;
        scrollLeft = carouselWrapper.scrollLeft;
    });

    carouselWrapper.addEventListener("mouseleave", () => {
        isDown = false;
        carouselWrapper.classList.remove("is-dragging");
    });

    carouselWrapper.addEventListener("mouseup", () => {
        isDown = false;
        carouselWrapper.classList.remove("is-dragging");
    });

    carouselWrapper.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carouselWrapper.offsetLeft;
        const walk = x - startX;
        carouselWrapper.scrollLeft = scrollLeft - walk;
    });

    carouselWrapper.addEventListener("mouseenter", () => {
        carouselWrapper.style.cursor = "grab";
    });

    carouselWrapper.addEventListener("mouseleave", () => {
        carouselWrapper.style.cursor = "auto";
    });

    carouselWrapper.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX - carouselWrapper.offsetLeft;
        scrollLeft = carouselWrapper.scrollLeft;
    });

    carouselWrapper.addEventListener("touchmove", (e) => {
        const x = e.touches[0].clientX - carouselWrapper.offsetLeft;
        const walk = x - startX;
        carouselWrapper.scrollLeft = scrollLeft - walk;
    });
}

/**
 * Alterna lo stato visivo del pulsante bookmark nel dettaglio.
 */
function toggleSpotBookmark(button) {
    const isSaved = button.dataset.saved === 'true';
    const icon = button.querySelector('.bookmark-icon');

    if (isSaved) {
        button.dataset.saved = 'false';
        icon.src = "../assets/icons/homepage/BookmarkEmpty.svg";
        button.setAttribute('aria-label', 'Aggiungi ai salvati');
    } else {
        button.dataset.saved = 'true';
        icon.src = "../assets/icons/homepage/Bookmark.svg";
        button.setAttribute('aria-label', 'Rimuovi dai salvati');
    }
}

/**
 * Aggiorna l'icona bookmark presente nell'header in base allo stato dettaglio.
 */
function updateHeaderBookmark() {
    const detailButton = document.getElementById("spot-detail-bookmark-button");
    const headerButton = document.getElementById("header-bookmark-button");

    if (detailButton && headerButton) {
        const isSaved = detailButton.dataset.saved === 'true';
        const headerIcon = headerButton.querySelector('.bookmark-icon');

        if (isSaved) {
            headerIcon.src = "../assets/icons/homepage/Bookmark.svg";
            headerButton.setAttribute('aria-label', 'Rimuovi dai salvati');
        } else {
            headerIcon.src = "../assets/icons/homepage/BookmarkEmpty.svg";
            headerButton.setAttribute('aria-label', 'Aggiungi ai salvati');
        }
    }
}

/**
 * Mostra o nasconde la sezione "missions" nel dettaglio spot.
 */
function toggleMissions(button) {
    const missionsDetails = document.getElementById("spot-missions-details");
    if (missionsDetails) {
        const isHidden = missionsDetails.style.display === 'none';

        if (isHidden) {
            missionsDetails.style.display = 'block';
            button.classList.add('expanded');
        } else {
            missionsDetails.style.display = 'none';
            button.classList.remove('expanded');
        }
    }
}

/**
 * Marca uno spot come visitato nell'interfaccia.
 */
function markSpotAsVisited() {
    const visitButton = document.getElementById("spot-detail-visit-button");
    if (visitButton) {
        visitButton.classList.add("visited");
        visitButton.textContent = "✓ Visitato";
    }
}

/**
 * Condivide lo spot.
 */
function shareSpot() {
    if (navigator.share && spottedData.nome) {
        navigator.share({
            title: spottedData.nome,
            text: `Dai un'occhiata a questo spot: ${spottedData.nome}`,
            url: window.location.href
        }).catch(() => {});
    } else {
        alert('Condivisione non disponibile su questo dispositivo');
    }
}

/**
 * Disattiva lo stato visuale dei bottoni toolbar (rimuove classi attive).
 */
function deactivateAllToolbarButtons() {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;

    toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
        const text = btn.querySelector("span");
        const icon = btn.querySelector("[data-role='icon']");
        if (text) {
            text.classList.remove("font-bold");
            text.classList.add("font-normal");
        }
        if (icon) {
            icon.classList.remove("scale-125");
        }
    });
}

/**
 * Aggiorna i contatori delle missioni nel dettaglio.
 */
function updateMissionsCount() {
    const missionsCompletedElement = document.getElementById('spot-missions-completed');
    const missionsTotalElement = document.getElementById('spot-missions-total');

    if (missionsCompletedElement && missionsTotalElement) {

        const completedCount = document.querySelectorAll('.mission-banner.completed').length;

        const totalCount = document.querySelectorAll('.mission-banner').length;

        missionsCompletedElement.textContent = completedCount;
        missionsTotalElement.textContent = totalCount;
    }
}

/**
 * Inizializza il conteggio missioni chiamando la funzione aggiorna.
 */
function initializeMissionsCount() {
    updateMissionsCount();
}

export {
    initializeSpotClickHandlers,
    populateSpotCards,
    populateSavedSpots,
    loadSpotDetail,
    getSpotById,
    updateMissionsCount
};
