import { getSpots, getCurrentUser, getSavedSpots } from "../../json-data-handler.js";
import { distanceFromUserToSpot, formatDistance } from "../../common.js";
import { generateSpotCardList } from "./generate-spot-card-list.js";
import { pickRating, formatRatingAsText } from "../../common/spotCardHelpers.js";
import { initializeBookmarkButton } from "../../common/bookmark.js";

export async function getSavedSpotsData() {
    const user = await getCurrentUser();
    if (!user) return [];

    const relations = await getSavedSpots(user.username);
    if (!relations.length) return [];

    const allSpots = await getSpots();
    const neededIds = new Set(relations.map(r => String(r.idLuogo)).filter(Boolean));
    const spots = allSpots.filter(s => neededIds.has(String(s.id)));
    return spots;
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
                if (spots.length === 0) emptyState.classList.remove("hidden");
                else emptyState.classList.add("hidden");
            }
            return spots;
        },
        useWrapper: false,
        setCategoryText: false,
        additionalFields: [
            { selector: '[data-field="title"]', valueFunction: (spot) => spot.nome || "Spot", type: 'text' },
            { selector: '[data-field="image"]', valueFunction: (spot) => "../" + spot.immagine.slice(1), type: 'image' },
        ],
        bookmarkInit: (card) => initializeBookmarkButton(card, { saved: "true" }),
    });
}

export async function populateNearbySpots({
    containerId = "home-nearby-container",
    templateSelector = null,
    limit = 10,
} = {}) {
    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction: getSpots,
        sortFunction: (a, b) => distanceFromUserToSpot(a) - distanceFromUserToSpot(b),
        limit,
        useWrapper: true,
        setCategoryText: true,
        additionalFields: [
            { selector: '[data-field="title"]', valueFunction: (spot) => spot.nome || "Spot", type: 'text' },
            { selector: '[data-field="image"]', valueFunction: (spot) => "../" + spot.immagine.slice(1), type: 'image' },
            { selector: '[data-field="distance"]', valueFunction: (spot) => formatDistance(distanceFromUserToSpot(spot)), type: 'text' },
            { selector: '[data-field="rating"]', valueFunction: (spot) => formatRatingAsText(pickRating(spot)), type: 'text' },
        ],
    });
}

export async function populateTopratedSpots({
    containerId = "home-toprated-carousel",
    templateSelector = null,
    limit = 10,
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
        additionalFields: [
            { selector: '[data-field="title"]', valueFunction: (spot) => spot.nome || "Spot", type: 'text' },
            { selector: '[data-field="image"]', valueFunction: (spot) => "../" + spot.immagine.slice(1), type: 'image' },
            { selector: '[data-field="rating"]', valueFunction: (spot) => formatRatingAsText(pickRating(spot)), type: 'text' },
            { selector: '[data-field="distance"]', valueFunction: (spot) => formatDistance(distanceFromUserToSpot(spot)), type: 'text' },
        ],
        customCardSetup: customTopratedSetup,
    });
}
