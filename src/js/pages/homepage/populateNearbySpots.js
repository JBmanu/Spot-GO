import {getSpots} from "../../query.js";
import {fillSpotCard} from "./populateSpotCards.js";
import {distanceFromUserToSpot, formatDistance} from "../../common.js";

/**
 * Imposta il contenuto testuale di un elemento se esiste.
 * @param {HTMLElement} el - L'elemento su cui impostare il testo.
 * @param {string|number} value - Il valore da impostare.
 */
function setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
}

/**
 * Estrae il valore della valutazione da un oggetto spot, controllando varie chiavi possibili.
 * @param {Object} spot - L'oggetto spot.
 * @returns {number|null} Il valore della valutazione o null.
 */
function pickRating(spot) {
    return spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
}

/**
 * Converte un numero di valutazione in una stringa formattata.
 * @param {number|string} v - Il valore della valutazione.
 * @returns {string} La stringa della valutazione formattata.
 */
function formatRatingAsText(v) {
    const n = Number(String(v ?? "").replace(",", "."));
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 10) / 10).toFixed(1);
}

/**
 * Garantisce che il pulsante dei segnalibri abbia gli attributi dataset necessari.
 * @param {HTMLElement} card - L'elemento card contenente il pulsante dei segnalibri.
 */
function initializeBookmarkButtonAttributes(card) {
    const btn = card.querySelector("[data-bookmark-button]");
    if (!btn) return;
    if (typeof btn.dataset.saved === "undefined") btn.dataset.saved = "false";
    if (!btn.hasAttribute("data-bookmark-type")) btn.setAttribute("data-bookmark-type", "generic");
}

/**
 * Cancella gli spot vicini precedentemente renderizzati dal contenitore.
 * @param {HTMLElement} container - L'elemento contenitore.
 */
function removeExistingNearbySpotCards(container) {
    const track = container.querySelector(":scope > .carousel-horizontal_track") || container.querySelector(".carousel-horizontal_track");
    const root = track || container;
    Array.from(root.children).forEach((child) => {
        if (child?.dataset?.spotWrapper != null && !child?.dataset?.template) {
            child.remove();
        }
    });
}

/**
 * Popola il contenitore degli spot vicini con le card degli spot.
 * @param {Object} options - Opzioni di configurazione.
 * @param {string} options.containerId - L'ID dell'elemento contenitore.
 * @param {string} options.templateSelector - Il selettore per l'elemento template.
 * @param {number} options.limit - Il numero massimo di spot da visualizzare.
 * @returns {Promise<void>}
 */
export async function populateNearbySpots({
                                              containerId = "home-nearby-container",
                                              templateSelector = '[data-template="nearby-card"]',
                                              limit = 10,
                                          } = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }
    const templateShell = document.querySelector(templateSelector) || container.querySelector(templateSelector);
    if (!templateShell) {
        console.warn("Template nearby-card non trovato:", templateSelector);
        return;
    }
    templateShell.hidden = true;
    templateShell.setAttribute("aria-hidden", "true");
    try {
        const spots = await getSpots();

        const list = (spots || [])
            .slice()
            .sort((a, b) => distanceFromUserToSpot(a) - distanceFromUserToSpot(b))
            .slice(0, limit);

        removeExistingNearbySpotCards(container);

        if (!list.length) return;

        for (const spot of list) {
            const shell = templateShell.cloneNode(true);
            shell.removeAttribute("data-template");
            shell.removeAttribute("aria-hidden");
            shell.hidden = false;

            const card = shell.querySelector('[role="listitem"]');
            if (!card) continue;

            fillSpotCard(card, spot, {
                wrapperEl: shell, setCategoryText: true, hideIfMissingId: true,
            });

            if (card.style.display === "none") continue;

            setText(card.querySelector('[data-field="distance"]'), formatDistance(distanceFromUserToSpot(spot)));
            const ratingText = formatRatingAsText(pickRating(spot));
            setText(card.querySelector('[data-field="rating"]'), ratingText);
            initializeBookmarkButtonAttributes(card);
            container.appendChild(shell);
        }
    } catch (error) {
        console.error("Error populating nearby spots:", error);
    }
}
