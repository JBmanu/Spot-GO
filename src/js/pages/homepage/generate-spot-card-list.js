import {getCategoryNameIt} from "../../json-data-handler.js";
import {normalizeCategoryName} from "../../common/categoryFilter.js";
import {setText, setImage, initializeBookmarkButtonAttributes} from "../../common/spotCardHelpers.js";

/**
 * Riempie un elemento card con i dati di uno spot.
 * @param {HTMLElement} cardEl - L'elemento card da riempire.
 * @param {Object} spot - L'oggetto spot con i dati.
 * @param {Object} options - Opzioni aggiuntive.
 * @param {HTMLElement} options.wrapperEl - L'elemento wrapper opzionale.
 * @param {boolean} options.setCategoryText - Se impostare il testo della categoria.
 * @param {boolean} options.hideIfMissingId - Se nascondere se manca l'ID.
 */
export function populateSingleSpotCard(cardEl, spot, {
    wrapperEl = null, setCategoryText = true, hideIfMissingId = true,
} = {}) {
    if (!cardEl) return;

    if (!spot) {
        cardEl.style.display = "none";
        cardEl.removeAttribute("data-spot-id");
        cardEl.removeAttribute("data-category");
        return;
    }

    const id = String(spot.id || "").trim();
    if (!id && hideIfMissingId) {
        cardEl.style.display = "none";
        cardEl.removeAttribute("data-spot-id");
        cardEl.removeAttribute("data-category");
        return;
    }

    cardEl.style.display = "";
    cardEl.setAttribute("data-spot-id", id);
    setText(cardEl.querySelector('[data-field="title"]'), spot.nome || "Spot");
    setImage(cardEl.querySelector('[data-field="image"]'), "../" + spot.immagine.slice(1), spot.nome || "Foto spot");

    const normalizedCat = normalizeCategoryName(spot.idCategoria);
    if (normalizedCat) {
        cardEl.setAttribute("data-category", normalizedCat);
        if (wrapperEl) wrapperEl.setAttribute("data-category", normalizedCat);
    } else {
        cardEl.removeAttribute("data-category");
        if (wrapperEl) wrapperEl.removeAttribute("data-category");
    }

    if (setCategoryText) {
        const categoryEl = cardEl.querySelector('[data-field="category"]');
        if (categoryEl) {
            getCategoryNameIt(spot.idCategoria).then(name => {
                categoryEl.textContent = name || spot.idCategoria;
            }).catch(() => {
                categoryEl.textContent = spot.idCategoria;
            });
        }
    }
}


/**
 * Genera e popola una lista di card di spot in un contenitore DOM utilizzando un template.
 * @param {Object} options - Opzioni di configurazione.
 * @param {string} options.containerId - ID del contenitore DOM dove inserire le card.
 * @param {string} options.templateSelector - Selettore CSS per trovare il template della card.
 * @param {Function} options.getSpotsFunction - Funzione asincrona che restituisce un array di oggetti spot.
 * @param {Function} [options.sortFunction] - Funzione di confronto per ordinare gli spot (opzionale).
 * @param {number} [options.limit=10] - Numero massimo di spot da visualizzare.
 * @param {boolean} [options.useWrapper=false] - Se true, usa un wrapper attorno alla card.
 * @param {boolean} [options.setCategoryText=true] - Se true, imposta il testo della categoria nella card.
 * @param {Array} [options.additionalFields=[]] - Array di oggetti {selector, valueFunction} per campi extra.
 * @param {Function} [options.bookmarkInit=initializeBookmarkButtonAttributes] - Funzione per inizializzare i bookmark.
 * @param {string} [options.trackClass] - Classe CSS del track del carosello da preservare durante la pulizia.
 * @param {Function} [options.customCardSetup] - Funzione di callback per setup aggiuntivo della card.
 * @returns {Promise<void>}
 */
export async function generateSpotCardList({
                                               containerId,
                                               templateSelector,
                                               getSpotsFunction,
                                               sortFunction = null,
                                               limit = 10,
                                               useWrapper = false,
                                               setCategoryText = true,
                                               additionalFields = [],
                                               bookmarkInit = initializeBookmarkButtonAttributes,
                                               trackClass = null,
                                               customCardSetup = null,
                                           } = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }

    const templateElement = document.querySelector(templateSelector) || container.querySelector(templateSelector);
    if (!templateElement) {
        console.warn(`Template ${templateSelector} not found.`);
        return;
    }

    templateElement.hidden = true;
    templateElement.setAttribute("aria-hidden", "true");

    try {
        let spots = await getSpotsFunction();
        if (sortFunction) {
            spots = spots.slice().sort(sortFunction);
        }
        const list = spots.slice(0, limit);

        Array.from(container.children).forEach((child) => {
            if (child === templateElement) return;
            if (trackClass && child.classList?.contains(trackClass)) return;
            if (useWrapper && child?.dataset?.spotWrapper != null && !child?.dataset?.template) {
                child.remove();
            } else if (!useWrapper) {
                child.remove();
            }
        });

        if (!list.length) return;

        const appendTarget = container.querySelector('.carousel-horizontal_track') || container;

        for (const spot of list) {
            const element = templateElement.cloneNode(true);
            element.removeAttribute("data-template");
            element.removeAttribute("aria-hidden");
            element.hidden = false;

            let card, wrapperEl;
            if (useWrapper) {
                wrapperEl = element;
                card = element.querySelector('article');
                if (!card) continue;
            } else {
                card = element;
                if (!card.hasAttribute("role")) card.setAttribute("role", "listitem");
                wrapperEl = null;
            }

            if (spot?.id != null) card.setAttribute("data-spot-id", String(spot.id));

            populateSingleSpotCard(card, spot, {
                wrapperEl, setCategoryText, hideIfMissingId: true,
            });

            if (card.style.display === "none") continue;

            for (const field of additionalFields) {
                setText(card.querySelector(field.selector), field.valueFunction(spot));
            }

            if (bookmarkInit) bookmarkInit(card);

            if (customCardSetup) customCardSetup(card, spot);

            appendTarget.appendChild(element);
        }
    } catch (error) {
        console.error(`Error populating ${containerId}:`, error);
    }
}
