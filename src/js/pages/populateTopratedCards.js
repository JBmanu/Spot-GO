import {getSpots} from "../query.js";
import {fillSpotCard} from "../common/populateSpotCards.js";
import {distanceFromUserToSpot, formatDistance} from "../common.js";

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

function setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
}

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

export async function populateTopratedSpots({
                                                containerId = "home-toprated-carousel",
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
        .map((s) => normalizeSpot(s))
        .filter(Boolean)
        .map((s) => ({spot: s, rating: getRatingValue(s)}))
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


        const ratingValue = getRatingValue(spot);
        const ratingText =
            ratingValue == null ? "" : (Math.round(Number(ratingValue) * 10) / 10).toFixed(1);

        const ratingEl = card.querySelector('[data-slot="rating-value"]');
        setText(ratingEl, ratingText);

        if (ratingEl) {
            if (ratingText !== "") ratingEl.setAttribute("aria-label", `${ratingText} stelle`);
            else ratingEl.removeAttribute("aria-label");
        }

        setText(card.querySelector('[data-field="distance"]'), formatDistance(distanceFromUserToSpot(spot)));

        container.appendChild(card);
    }
}
