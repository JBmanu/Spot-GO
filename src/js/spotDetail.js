/**
 * Gestione delle card e della pagina di dettaglio di uno spot.
 */

import { initializeBookmarks, toggleBookmarkForSpot, updateBookmarkVisual, syncAllBookmarks } from "./bookmark.js";
import { getSpots, getCategoryNameIt, getSavedSpots, getFirstUser, getCategorieMap } from "./query.js";

let spottedData = {};
let currentSpotId = null;

let _cachedState = {
    mainHTML: null,
    headerHTML: null,
    mainScrollTop: 0,
    carouselScroll: {}
};

let _popStateHandler = null;
let _headerBookmarkClickHandler = null;
let _headerBookmarkChangeHandler = null;

/**
 * Salva lo stato attuale della pagina prima di aprire il dettaglio.
 */
function savePageState() {
    const main = document.getElementById('main');
    const header = document.querySelector('header.app-header');

    if (main) {
        _cachedState.mainHTML = main.innerHTML;
        _cachedState.mainScrollTop = main.scrollTop || 0;
    }

    if (header) {
        _cachedState.headerHTML = header.innerHTML;
    }

    ['.saved-swipe-track', '.nearby-swipe-track', '.vertical-carousel-track'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) _cachedState.carouselScroll[sel] = el.scrollLeft || 0;
    });
}

/**
 * Registra il listener per popstate del back button.
 */
function setupHistoryListener() {
    if (_popStateHandler) return;

    _popStateHandler = async () => {
        await restorePreviousPage();
    };

    window.addEventListener('popstate', _popStateHandler);
}

/**
 * Rimuove il listener popstate.
 */
function teardownHistoryListener() {
    if (_popStateHandler) {
        window.removeEventListener('popstate', _popStateHandler);
        _popStateHandler = null;
    }
}

/**
 * Popola le card nella sezione Nearby.
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
                if (imageEl && spot.immagine) imageEl.src = spot.immagine;

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
 * Popola la sezione "Spot Salvati".
 */
async function populateSavedSpots() {
    try {
        const currentUser = await getFirstUser();
        if (!currentUser) return;

        const savedSpotRelations = await getSavedSpots(currentUser.id);
        const savedContainer = document.getElementById('home-saved-container');

        if (!savedContainer) return;

        if (!savedSpotRelations || savedSpotRelations.length === 0) {
            const parent = savedContainer.parentElement;
            if (parent) parent.style.display = 'none';
            return;
        }

        const parent = savedContainer.parentElement;
        if (parent) parent.style.display = 'block';

        const allSpots = await getSpots();
        const neededIds = savedSpotRelations.map(r => r.idLuogo);
        const allCards = Array.from(savedContainer.querySelectorAll('[role="listitem"]'));

        if (allCards.length === 0) return;

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
            }
        });

        let placeholderCards = allCards.filter(c => !c.getAttribute('data-spot-id'));

        for (const idLuogo of neededIds) {
            if (accounted.has(idLuogo)) continue;

            const spot = allSpots.find(s => s.id === idLuogo);
            if (!spot) continue;

            let cardToFill = placeholderCards.shift();
            if (!cardToFill) {
                const templateCard = allCards[0];
                if (!templateCard) continue;

                cardToFill = templateCard.cloneNode(true);
                savedContainer.appendChild(cardToFill);
                allCards.push(cardToFill);
            }

            cardToFill.setAttribute('data-spot-id', spot.id);
            const titleEl = cardToFill.querySelector('[data-field="title"]');
            if (titleEl) titleEl.textContent = spot.nome || "Spot";

            const imageEl = cardToFill.querySelector('[data-field="image"]');
            if (imageEl && spot.immagine) imageEl.src = spot.immagine;

            cardToFill.setAttribute('data-category', (spot.idCategoria || 'unknown').toLowerCase());
            cardToFill.style.display = '';
            accounted.add(spot.id);
        }

        placeholderCards.forEach(pc => pc.style.display = 'none');

    } catch (error) {
        console.error("Errore nel popolare gli spot salvati:", error);
    }
}

/**
 * Popola la sezione "Top Rated".
 */
async function populateTopratedCards() {
    try {
        const spots = await getSpots();
        const topCards = document.querySelectorAll('#home-toprated-carousel-container [role="listitem"][data-spot-id=""]');

        for (let index = 0; index < topCards.length; index++) {
            const card = topCards[index];
            if (index < spots.length) {
                const spot = spots[index];
                card.setAttribute('data-spot-id', spot.id);

                const titleEl = card.querySelector('[data-field="title"]');
                if (titleEl) titleEl.textContent = spot.nome || "Spot";

                const imageEl = card.querySelector('[data-field="image"]');
                if (imageEl && spot.immagine) imageEl.src = spot.immagine;

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
        console.error('Errore nel popolare le card toprated:', error);
    }
}

/**
 * Inizializza i click sulle card per aprire il dettaglio.
 */
function initializeSpotClickHandlers() {
    const spotCards = document.querySelectorAll('[role="listitem"][data-spot-id]');

    spotCards.forEach(card => {
        card.removeEventListener('click', openDetailHandler);
        card.addEventListener('click', openDetailHandler);
    });
}

/**
 * Handler per l'apertura del dettaglio quando si clicca una card.
 */
async function openDetailHandler(e) {
    if (e.target.closest('[data-bookmark-button]')) return;

    const spotId = e.currentTarget.getAttribute('data-spot-id');
    if (spotId && spotId !== '') {
        await loadSpotDetail(spotId);
    }
}

/**
 * Carica il dettaglio di uno spot.
 */
async function loadSpotDetail(spotId) {
    try {
        currentSpotId = spotId;
        const spotData = await getSpotById(spotId);

        if (!spotData) {
            console.error('Spot non trovato');
            return;
        }

        savePageState();

        const response = await fetch("../html/spot-detail.html");
        if (!response.ok) return;

        const main = document.getElementById("main");
        if (!main) return;

        try {
            const state = { spotId };
            history.pushState(state, '', location.pathname + '#spot-' + spotId);
            setupHistoryListener();
        } catch (e) {
            console.warn('History API non disponibile:', e);
        }

        main.innerHTML = await response.text();

        main.classList.add("spot-detail-enter");

        const categoryEnglish = await getCategoryEnglishName(spotData.idCategoria);
        main.setAttribute('data-category', categoryEnglish);

        updateDetailHeader(spotData);

        await populateSpotDetail(spotData);

        initializeDetailHandlers();

        disableToolbarButtons();

    } catch (err) {
        console.error("Errore nel caricamento dettaglio spot:", err);
    }
}

/**
 * Aggiorna l'header per la pagina di dettaglio.
 */
function updateDetailHeader(spotData) {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `
            <button type="button" id="header-back-button" aria-label="Torna indietro" 
                style="cursor: pointer; background: none; border: none; padding: 0; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
                <img src="../assets/icons/profile/Back.svg" alt="Indietro" style="width: 24px; height: 24px;">
            </button>
        `;
    }

    if (headerLogoText) headerLogoText.style.display = "none";

    if (headerTitle) {
        headerTitle.textContent = spotData.nome || "Dettaglio Spot";
        headerTitle.classList.remove("hidden");
    }

    const headerBookmarkButton = document.getElementById("header-bookmark-button");
    if (headerBookmarkButton) {
        headerBookmarkButton.style.display = "block";

        headerBookmarkButton.setAttribute('data-bookmark-button', 'true');
        headerBookmarkButton.setAttribute('data-bookmark-type', 'detail');

        try {
            if (_headerBookmarkClickHandler) {
                headerBookmarkButton.removeEventListener('click', _headerBookmarkClickHandler);
            }
            if (_headerBookmarkChangeHandler) {
                document.removeEventListener('bookmark:changed', _headerBookmarkChangeHandler);
            }
        } catch (e) {

        }

        _headerBookmarkClickHandler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!spotData || !spotData.id) return;
            try {
                await toggleBookmarkForSpot(spotData.id);
                await (async function refresh() {
                    try {
                        const user = await getFirstUser();
                        if (!user) return;
                        const saved = await getSavedSpots(user.id);
                        const savedIds = (saved || []).map(s => s.idLuogo);
                        const isSaved = savedIds.includes(spotData.id);
                        headerBookmarkButton.dataset.saved = isSaved ? 'true' : 'false';
                        updateBookmarkVisual(headerBookmarkButton, isSaved);
                    } catch (err) {
                        console.error('Errore refresh header bookmark visual:', err);
                    }
                })();
            } catch (err) {
                console.error('Errore toggle bookmark header:', err);
            }
        };

        headerBookmarkButton.addEventListener('click', _headerBookmarkClickHandler);

        _headerBookmarkChangeHandler = (ev) => {
            try {
                if (!ev || !ev.detail) return;
                const { spotId, isSaved } = ev.detail;
                if (spotId === spotData.id) {
                    headerBookmarkButton.dataset.saved = isSaved ? 'true' : 'false';
                    updateBookmarkVisual(headerBookmarkButton, isSaved);
                }
            } catch (err) {
                console.error('Errore header bookmark change handler:', err);
            }
        };

        document.addEventListener('bookmark:changed', _headerBookmarkChangeHandler);

        (async () => {
            try {
                const user = await getFirstUser();
                if (!user) return;
                const saved = await getSavedSpots(user.id);
                const savedIds = (saved || []).map(s => s.idLuogo);
                const isSaved = savedIds.includes(spotData.id);
                headerBookmarkButton.dataset.saved = isSaved ? 'true' : 'false';
                updateBookmarkVisual(headerBookmarkButton, isSaved);
            } catch (err) {
                console.error('Errore impostazione iniziale header bookmark:', err);
            }
        })();
    }
}

/**
 * Recupera uno spot per ID.
 */
async function getSpotById(spotId) {
    try {
        const spots = await getSpots();
        return spots.find(s => s.id === spotId) || null;
    } catch (error) {
        console.error("Errore nel recupero dello spot:", error);
        return null;
    }
}

/**
 * Converte l'ID categoria al nome English usato nel CSS.
 */
async function getCategoryEnglishName(categoryId) {
    try {
        const categorieMap = await getCategorieMap();
        const categoryName = categorieMap[categoryId] || 'nature';

        const nameToEnglish = {
            'Cibo': 'food',
            'Cultura': 'culture',
            'Natura': 'nature',
            'Mistero': 'mystery',
            'food': 'food',
            'culture': 'culture',
            'nature': 'nature',
            'mystery': 'mystery'
        };

        return nameToEnglish[categoryName] || 'nature';
    } catch (error) {
        console.error('Errore nel recupero categoria:', error);
        return 'nature';
    }
}

/**
 * Popola i dati del dettaglio dello spot.
 */
async function populateSpotDetail(spotData) {
    const elements = {
        image: document.getElementById("spot-detail-main-image"),
        title: document.getElementById("spot-detail-title"),
        rating: document.getElementById("spot-detail-rating-value"),
        category: document.getElementById("spot-detail-category"),
        distance: document.getElementById("spot-detail-distance"),
        description: document.getElementById("spot-detail-description"),
        address: document.getElementById("spot-detail-address"),
        hours: document.getElementById("spot-detail-hours"),
        cost: document.getElementById("spot-detail-cost")
    };

    if (elements.image && spotData.immagine) {
        elements.image.src = spotData.immagine;
        elements.image.alt = spotData.nome;
    }

    if (elements.title) elements.title.textContent = spotData.nome || "Spot";
    if (elements.rating) elements.rating.textContent = "4.5";
    if (elements.distance) elements.distance.textContent = "0 m";

    if (elements.category && spotData.idCategoria) {
        getCategoryNameIt(spotData.idCategoria).then(cat => {
            if (elements.category) elements.category.textContent = cat;
        });
    }

    if (elements.description) {
        elements.description.textContent = spotData.descrizione || "Nessuna descrizione disponibile";
    }

    if (elements.address && spotData.indirizzo) {
        elements.address.textContent = spotData.indirizzo;
    }

    if (elements.hours && spotData.orari && spotData.orari.length > 0) {
        elements.hours.textContent = spotData.orari.map(o => `${o.inizio} - ${o.fine}`).join(" | ");
    }

    if (elements.cost && spotData.costo && spotData.costo.length > 0) {
        elements.cost.textContent = spotData.costo
            .map(c => c.prezzo === 0 ? "Gratuito" : `${c.tipo}: €${c.prezzo}`)
            .join(" | ");
    }

    spottedData = spotData;
}

/**
 * Inizializza i handler della pagina dettaglio.
 */
function initializeDetailHandlers() {
    const backButton = document.getElementById("header-back-button");

    if (backButton) {
        backButton.addEventListener("click", async (e) => {
            e.stopPropagation();

            const main = document.getElementById("main");
            if (main) {
                main.classList.add("spot-detail-exit");
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            try {
                history.back();
            } catch (err) {
                await restorePreviousPage();
            }
        });
    }

    const missionsToggle = document.getElementById("spot-missions-toggle");
    if (missionsToggle) {
        missionsToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const missionsDetails = document.getElementById("spot-missions-details");
            if (missionsDetails) {
                const isHidden = missionsDetails.style.display === "none";
                missionsDetails.style.display = isHidden ? "block" : "none";
                missionsToggle.classList.toggle("expanded", isHidden);
            }
        });
    }

    initializeBookmarks();
}

/**
 * Disattiva i pulsanti della toolbar.
 */
function disableToolbarButtons() {
    const toolbar = document.querySelector('.app-toolbar');
    if (!toolbar) return;

    toolbar.querySelectorAll('button[data-section]').forEach(btn => {
        btn.classList.remove('active');
        const text = btn.querySelector('span');
        const icon = btn.querySelector('[data-role="icon"]');

        if (text) {
            text.classList.remove('font-bold');
            text.classList.add('font-normal');
        }
        if (icon) icon.classList.remove('scale-125');
    });
}

/**
 * Ripristina la pagina precedente.
 */
async function restorePreviousPage() {
    const main = document.getElementById('main');
    if (!main || !_cachedState.mainHTML) {
        try {
            const { goToHomepage } = await import('./homepage.js');
            await goToHomepage();
        } catch (e) {
            console.error('Errore nel ripristino:', e);
        }
        return;
    }

    teardownHistoryListener();

    main.classList.remove("spot-detail-enter");
    main.classList.remove("spot-detail-exit");
    main.removeAttribute("data-category");

    main.innerHTML = _cachedState.mainHTML;

    const header = document.querySelector('header.app-header');
    if (header && _cachedState.headerHTML) {
        header.innerHTML = _cachedState.headerHTML;
    }

    const headerBookmarkButton = document.getElementById("header-bookmark-button");
    if (headerBookmarkButton) {
        headerBookmarkButton.style.display = "none";

        try {
            if (_headerBookmarkClickHandler) {
                headerBookmarkButton.removeEventListener('click', _headerBookmarkClickHandler);
                _headerBookmarkClickHandler = null;
            }
            if (_headerBookmarkChangeHandler) {
                document.removeEventListener('bookmark:changed', _headerBookmarkChangeHandler);
                _headerBookmarkChangeHandler = null;
            }
        } catch (err) {
        }
    }

    requestAnimationFrame(async () => {
        main.scrollTop = _cachedState.mainScrollTop || 0;

        requestAnimationFrame(async () => {
            Object.entries(_cachedState.carouselScroll).forEach(([sel, scroll]) => {
                const el = document.querySelector(sel);
                if (el) el.scrollLeft = scroll;
            });

            try {
                await populateSpotCards();
                await populateSavedSpots();
                try {
                    await syncAllBookmarks();
                } catch (err) {
                    console.warn('Impossibile sincronizzare i bookmark durante il restore:', err);
                }
                initializeSpotClickHandlers();
                initializeBookmarks();
            } catch (e) {
                console.error('Errore re-inizializzazione:', e);
            }

            _cachedState = {
                mainHTML: null,
                headerHTML: null,
                mainScrollTop: 0,
                carouselScroll: {}
            };
        });
    });
}

export {
    populateSpotCards,
    populateSavedSpots,
    populateTopratedCards,
    initializeSpotClickHandlers
};

