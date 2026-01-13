import { getSpots, getCurrentUser, getSavedSpots, pickRating } from "../../database.js";
import { distanceFromUserToSpot, formatDistance } from "../../common.js";
import { generateSpotCardList } from "./generate-spot-card-list.js";
import { formatRatingAsText } from "../../common/fitText.js";
import { initializeBookmarkButton } from "../../common/bookmark.js";

export async function getSavedSpotsData() {
    const user = await getCurrentUser();
    if (!user) return [];

    const relations = await getSavedSpots(user.username);
    if (!relations.length) return [];

    const allSpots = await getSpots();
    const neededIds = new Set(relations.map(r => String(r.idLuogo)).filter(Boolean));
    return allSpots.filter(s => neededIds.has(String(s.id)));
}

function customTopratedSetup(card, spot) {
    const ratingText = formatRatingAsText(pickRating(spot));
    const ratingEl = card.querySelector('[data-field="rating"]');

    if (ratingEl) {
        if (ratingText !== "") ratingEl.setAttribute("aria-label", `${ratingText} stelle`);
        else ratingEl.removeAttribute("aria-label");
    }
}

export async function populateSavedSpots({
    containerId = "home-saved-container",
    emptyStateId = "saved-empty-state",
    templateSelector = null,
} = {}) {
    const emptyState = document.getElementById(emptyStateId);

    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction: async () => {
            const spots = await getSavedSpotsData();
            if (emptyState) {
                emptyState.classList.toggle("hidden", spots.length > 0);
            }
            return spots;
        },
        useWrapper: false,
        setCategoryText: false,
        bookmarkInit: (card) => initializeBookmarkButton(card, { saved: "true" }),
    });
}

export async function populateNearbySpots({
    containerId = "home-nearby-container",
    templateSelector = null,
    limit = 20,
} = {}) {
    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction: getSpots,
        sortFunction: (a, b) => distanceFromUserToSpot(a) - distanceFromUserToSpot(b),
        limit,
        useWrapper: true,
        setCategoryText: true
    });
}

export async function populateTopratedSpots({
    containerId = "home-toprated-carousel",
    templateSelector = null,
    limit = 20,
} = {}) {
    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction: async () => {
            const all = await getSpots();
            return all
                .map(s => ({ spot: s, rating: pickRating(s) }))
                .sort((a, b) => b.rating - a.rating)
                .map(item => item.spot);
        },
        limit,
        useWrapper: false,
        setCategoryText: false,
        customCardSetup: customTopratedSetup,
    });
}
