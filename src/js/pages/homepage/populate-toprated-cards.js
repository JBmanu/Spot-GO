import { getSpots } from "../../json-data-handler.js";
import { distanceFromUserToSpot, formatDistance } from "../../common.js";
import { generateSpotCardList } from "./generate-spot-card-list.js";
import { pickRating, formatRatingAsText } from "../../common/spotCardHelpers.js";

/**
 * Normalizza un oggetto spot grezzo per garantire campi coerenti.
 * @param {Object} raw - L'oggetto spot grezzo.
 * @returns {Object|null} L'oggetto spot normalizzato o null se invalido.
 */
function normalizeSpot(raw) {
    if (!raw) return null;

    const id = raw?.id ?? raw?.nome ?? raw?.name ?? null;

    return {
        ...raw,
        id,
        title: raw?.title ?? raw?.nome ?? raw?.name ?? "Spot",
        rating: raw?.rating ?? raw?.valutazione ?? raw?.stelle ?? raw?.mediaVoti ?? 0,
        category: raw?.category ?? raw?.idCategoria ?? raw?.categoria ?? raw?.categoryId ?? null,
        image: raw?.image ?? raw?.immagine ?? raw?.foto ?? raw?.img ?? "",
        valutazione: raw?.valutazione ?? raw?.rating ?? raw?.stelle ?? raw?.mediaVoti ?? null,
    };
}

/**
 * Setup personalizzato per le card top-rated, impostando l'aria-label per la valutazione.
 * @param {HTMLElement} card - L'elemento card.
 * @param {Object} spot - L'oggetto spot.
 */
function customTopratedSetup(card, spot) {
    const ratingText = formatRatingAsText(pickRating(spot));
    const ratingEl = card.querySelector('[data-field="rating"]');

    if (ratingEl) {
        if (ratingText !== "") ratingEl.setAttribute("aria-label", `${ratingText} stelle`);
        else ratingEl.removeAttribute("aria-label");
    }
}

/**
 * Popola il contenitore degli spot top-rated con le card ordinate per valutazione.
 * @param {Object} options - Opzioni di configurazione.
 * @param {string} options.containerId - ID del contenitore.
 * @param {string} options.templateSelector - Selettore del template.
 * @param {number} options.limit - Numero massimo di spot.
 * @returns {Promise<void>}
 */
export async function populateTopratedSpots({
    containerId = "home-toprated-carousel",
    templateSelector = '[data-template="toprated-card-template"]',
    limit = 10,
} = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }

    const template = document.querySelector(templateSelector);
    Array.from(container.children).forEach(child => {
        if (child !== template) child.remove();
    });

    const getSpotsFunction = async () => {
        const all = await getSpots();
        const scored = (all || [])
            .map(normalizeSpot)
            .filter(Boolean)
            .map((s) => ({ spot: s, rating: pickRating(s) }))
            .filter((x) => x.spot && x.spot.id);

        scored.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));
        return scored.slice(0, limit).map((x) => x.spot);
    };

    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction,
        limit,
        useWrapper: false,
        setCategoryText: false,
        additionalFields: [
            { selector: '[data-field="title"]', valueFunction: (spot) => spot.title || spot.nome || "Spot", type: 'text' },
            { selector: '[data-field="image"]', valueFunction: (spot) => "../" + (spot.image || spot.immagine || "").replace(/^\/+/, ""), type: 'image' },
            { selector: '[data-field="rating"]', valueFunction: (spot) => formatRatingAsText(spot.rating ?? spot.valutazione ?? spot.stelle ?? spot.mediaVoti), type: 'text' },
            { selector: '[data-field="distance"]', valueFunction: (spot) => formatDistance(distanceFromUserToSpot(spot)), type: 'text' },
        ],
        customCardSetup: customTopratedSetup,
    });
}
