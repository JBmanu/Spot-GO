// src/js/common/populateNearbySpots.js

import { getSpots } from "../query.js";
import { fillSpotSlots } from "../common/populateSpotCards.js";

/**
 * Popola la sezione "Nearby" (A pochi passi) usando gli slot già presenti nell'HTML.
 * - richiede: #home-nearby-container con children [role="listitem"][data-spot-id]
 */
export async function populateNearbySpots({ containerId = "home-nearby-container" } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const spots = await getSpots();

    // riempi titolo/immagine/categoria/id + data-category (via fillSpotCard)
    fillSpotSlots(container, spots);

    // campi extra (se presenti nel template)
    const cards = container.querySelectorAll('[role="listitem"][data-spot-id]');
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const spot = spots?.[i];
        if (!spot) continue; // card già nascosta da fillSpotSlots

        // Distance (se esiste nei dati)
        const distEl = card.querySelector('[data-field="distance"]');
        if (distEl) {
            // prova varie chiavi possibili senza imporre struttura
            const d =
                spot.distanza ??
                spot.distance ??
                spot.metri ??
                spot.meters;

            if (d !== undefined && d !== null && d !== "") {
                distEl.textContent = String(d);
            }
        }

        // Rating (se esiste nei dati)
        const ratingEl = card.querySelector('[data-field="rating"]');
        if (ratingEl) {
            const r =
                spot.rating ??
                spot.valutazione ??
                spot.stelle;

            if (r !== undefined && r !== null && r !== "") {
                ratingEl.textContent = String(r);
            }
        }
    }
}
