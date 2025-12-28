import { getSpots } from "../query.js";
import { fillSpotCard } from "../common/populateSpotCards.js";

function toNumberOrNull(v) {
    if (v === undefined || v === null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

function getRatingValue(spot) {
    return (
        toNumberOrNull(spot?.rating) ??
        toNumberOrNull(spot?.valutazione) ??
        toNumberOrNull(spot?.stelle) ??
        toNumberOrNull(spot?.mediaVoti) ??
        null
    );
}

function pickDistance(spot) {
    return spot?.distanza ?? spot?.distance ?? spot?.metri ?? spot?.meters ?? null;
}

function setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
}

export async function populateTopratedSpots({
    containerId = "home-toprated-carousel-container",
    templateSelector = '[data-template="toprated-item"]',
    limit = 10,
} = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const templateCard = container.querySelector(templateSelector);
    if (!templateCard) {
        console.warn("Template toprated-item non trovato dentro", `#${containerId}`);
        return;
    }

    templateCard.hidden = true;
    templateCard.setAttribute("aria-hidden", "true");

    const all = await getSpots();

    const scored = (all || [])
        .map((s) => ({ spot: s, rating: getRatingValue(s) }))
        .filter((x) => x.spot && x.spot.id);

    scored.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));

    const top = scored.slice(0, limit).map((x) => x.spot);

    container.innerHTML = "";
    container.appendChild(templateCard);

    if (!top.length) return;

    for (const spot of top) {
        const card = templateCard.cloneNode(true);

        card.removeAttribute("data-template");
        card.removeAttribute("aria-hidden");
        card.hidden = false;

        fillSpotCard(card, spot, {
            wrapperEl: null,
            setCategoryText: false,
            hideIfMissingId: true,
        });

        if (card.style.display === "none") continue;

        setText(card.querySelector('[data-field="rating"]'), getRatingValue(spot));
        setText(card.querySelector('[data-field="distance"]'), pickDistance(spot));

        container.appendChild(card);
    }
}
