import { getSpots } from "../../query.js";
import { distanceFromUserToSpot, formatDistance } from "../../common.js";
import { generateSpotCardList } from "./generateSpotCardList.js";
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
        title: raw?.title ?? raw?.nome ?? raw?.name ?? "",
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
    const ratingEl = card.querySelector('[data-slot="rating-value"]');

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
    templateSelector = '[data-template="toprated-item"]',
    limit = 10,
} = {}) {
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
            { selector: '[data-slot="rating-value"]', valueFunction: (spot) => formatRatingAsText(pickRating(spot)) },
            { selector: '[data-field="distance"]', valueFunction: (spot) => formatDistance(distanceFromUserToSpot(spot)) },
        ],
        customCardSetup: customTopratedSetup,
    });
}
