// src/js/common/populateTopratedSpots.js

import { getSpots } from "../query.js";
import { fillSpotSlots } from "../common/populateSpotCards.js";

function toNumberOrNull(v) {
    if (v === undefined || v === null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

function getRatingValue(spot) {
    return (
        toNumberOrNull(spot.rating) ??
        toNumberOrNull(spot.valutazione) ??
        toNumberOrNull(spot.stelle) ??
        toNumberOrNull(spot.mediaVoti) ??
        null
    );
}

export async function populateTopratedSpots({
                                                containerId = "home-toprated-carousel-container",
                                                limit = 10,
                                            } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const all = await getSpots();

    const scored = (all || [])
        .map((s) => ({ spot: s, rating: getRatingValue(s) }))
        .filter((x) => x.spot && x.spot.id);

    scored.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));

    const top = scored.slice(0, limit).map((x) => x.spot);

    fillSpotSlots(container, top);

    // extra fields: rating + distance (se presenti nel template)
    const cards = container.querySelectorAll('[role="listitem"][data-spot-id]');
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const spot = top?.[i];
        if (!spot) continue;

        const ratingEl = card.querySelector('[data-field="rating"]');
        if (ratingEl) {
            const r = getRatingValue(spot);
            if (r !== null) ratingEl.textContent = String(r);
        }

        const distEl = card.querySelector('[data-field="distance"]');
        if (distEl) {
            const d = spot.distanza ?? spot.distance ?? spot.metri ?? spot.meters;
            if (d !== undefined && d !== null && d !== "") distEl.textContent = String(d);
        }
    }
}
