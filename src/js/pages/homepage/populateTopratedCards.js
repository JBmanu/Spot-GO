import { getSpots } from "../../query.js";
import { fillSpotCard } from "./populateSpotCards.js";
import { distanceFromUserToSpot, formatDistance } from "../../common.js";
import { normalizeCategoryName } from "../../common/categoryFilter.js";

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

function toRatingText(v) {
    const n = toNumberOrNull(v);
    if (n == null) return "";
    return (Math.round(n * 10) / 10).toFixed(1);
}

function ensureBookmarkDataset(cardEl) {
    const btn = cardEl.querySelector("[data-bookmark-button]");
    if (!btn) return;

    if (typeof btn.dataset.saved === "undefined") btn.dataset.saved = "false";
    if (!btn.hasAttribute("data-bookmark-type")) btn.setAttribute("data-bookmark-type", "generic");
}

function getSpotCategoryRaw(spot) {
    return spot?.category ?? spot?.idCategoria ?? spot?.categoria ?? spot?.categoryId ?? "";
}

function clearRenderedCards(container, templateSelector) {
    const template = container.querySelector(templateSelector);

    Array.from(container.children).forEach((child) => {
        if (template && child === template) return;
        if (child.classList?.contains("carousel-vertical-track")) return;
        child.remove();
    });
}

export async function populateTopratedSpots({
    containerId = "home-toprated-carousel",
    templateSelector = '[data-template="toprated-item"]',
    limit = 10,
} = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const templateCard =
        container.querySelector(templateSelector) || document.querySelector(templateSelector);

    if (!templateCard) {
        console.warn("Template toprated-item non trovato:", templateSelector);
        return;
    }

    templateCard.hidden = true;
    templateCard.setAttribute("aria-hidden", "true");

    const all = await getSpots();

    const scored = (all || [])
        .map(normalizeSpot)
        .filter(Boolean)
        .map((s) => ({ spot: s, rating: getRatingValue(s) }))
        .filter((x) => x.spot && x.spot.id);

    scored.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));

    const top = scored.slice(0, limit).map((x) => x.spot);

    clearRenderedCards(container, templateSelector);

    if (!top.length) return;

    for (const spot of top) {
        const card = templateCard.cloneNode(true);

        card.removeAttribute("data-template");
        card.removeAttribute("aria-hidden");
        card.hidden = false;

        if (!card.hasAttribute("role")) card.setAttribute("role", "listitem");
        if (spot?.id != null) card.setAttribute("data-spot-id", String(spot.id));

        fillSpotCard(card, spot, {
            wrapperEl: null,
            setCategoryText: false,
            hideIfMissingId: true,
        });

        if (card.style.display === "none") continue;

        const rawCat = getSpotCategoryRaw(spot);
        const normalizedCat = normalizeCategoryName(String(rawCat));
        if (normalizedCat) card.setAttribute("data-category", normalizedCat);

        const ratingText = toRatingText(getRatingValue(spot));
        const ratingEl = card.querySelector('[data-slot="rating-value"]');
        setText(ratingEl, ratingText);

        if (ratingEl) {
            if (ratingText !== "") ratingEl.setAttribute("aria-label", `${ratingText} stelle`);
            else ratingEl.removeAttribute("aria-label");
        }

        setText(
            card.querySelector('[data-field="distance"]'),
            formatDistance(distanceFromUserToSpot(spot))
        );

        ensureBookmarkDataset(card);

        container.appendChild(card);
    }
}
