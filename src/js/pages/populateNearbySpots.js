import { getSpots } from "../query.js";
import { fillSpotCard } from "../common/populateSpotCards.js";
import { distanceFromUserToSpot, formatDistance } from "../common.js";
import { normalizeCategoryName } from "../common/categoryFilter.js";

function setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
}

function pickRating(spot) {
    return spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
}

function toRatingText(v) {
    const n = Number(String(v ?? "").replace(",", "."));
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 10) / 10).toFixed(1);
}

function ensureBookmarkDataset(card) {
    const btn = card.querySelector("[data-bookmark-button]");
    if (!btn) return;

    if (typeof btn.dataset.saved === "undefined") btn.dataset.saved = "false";
    if (!btn.hasAttribute("data-bookmark-type")) btn.setAttribute("data-bookmark-type", "generic");
}

function getSpotCategoryRaw(spot) {
    return spot?.category ?? spot?.idCategoria ?? spot?.categoria ?? spot?.categoryId ?? "";
}

function clearRenderedNearby(container) {
    const track =
        container.querySelector(":scope > .carousel-horizontal_track") ||
        container.querySelector(".carousel-horizontal_track");

    const root = track || container;

    Array.from(root.children).forEach((child) => {
        if (child?.dataset?.spotWrapper != null && !child?.dataset?.template) {
            child.remove();
        }
    });
}

export async function populateNearbySpots({
    containerId = "home-nearby-container",
    templateSelector = '[data-template="nearby-card"]',
    limit = 10,
} = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const templateShell =
        document.querySelector(templateSelector) || container.querySelector(templateSelector);

    if (!templateShell) {
        console.warn("Template nearby-card non trovato:", templateSelector);
        return;
    }

    templateShell.hidden = true;
    templateShell.setAttribute("aria-hidden", "true");

    const spots = await getSpots();

    const list = (spots || [])
        .slice()
        .sort((a, b) => distanceFromUserToSpot(a) - distanceFromUserToSpot(b))
        .slice(0, limit);

    clearRenderedNearby(container);

    if (!list.length) return;

    for (const spot of list) {
        const shell = templateShell.cloneNode(true);

        shell.removeAttribute("data-template");
        shell.removeAttribute("aria-hidden");
        shell.hidden = false;

        const card = shell.querySelector('[role="listitem"]');
        if (!card) continue;

        if (spot?.id != null) card.setAttribute("data-spot-id", String(spot.id));

        fillSpotCard(card, spot, {
            wrapperEl: shell,
            setCategoryText: true,
            hideIfMissingId: true,
        });

        if (card.style.display === "none") continue;

        const rawCat = getSpotCategoryRaw(spot);
        const normalizedCat = normalizeCategoryName(String(rawCat));
        if (normalizedCat) {
            shell.setAttribute("data-category", normalizedCat);
            card.setAttribute("data-category", normalizedCat);
        }

        setText(
            card.querySelector('[data-field="distance"]'),
            formatDistance(distanceFromUserToSpot(spot))
        );
        const ratingText = toRatingText(pickRating(spot));
        setText(card.querySelector('[data-field="rating"]'), ratingText);

        ensureBookmarkDataset(card);

        container.appendChild(shell);
    }
}
