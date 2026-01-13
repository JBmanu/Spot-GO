import { getSpots, getCurrentUser, getSavedSpots, pickRating, getFilteredSpots } from "../../database.js";
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
    categories = []
} = {}) {
    const emptyState = document.getElementById(emptyStateId);

    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction: async () => {
            const allSaved = await getSavedSpotsData();
            let spots = allSaved;

            if (categories && categories.length > 0) {
                spots = spots.filter(s => categories.includes(s.idCategoria));
            }

            if (emptyState) {
                const isFiltered = categories && categories.length > 0;
                const hasNoSpots = spots.length === 0;

                if (hasNoSpots) {
                    const titleEl = emptyState.querySelector('h3');
                    const descEl = emptyState.querySelector('p');

                    if (isFiltered && allSaved.length > 0) {
                        if (titleEl) titleEl.textContent = "Nessun preferito trovato.";
                        if (descEl) descEl.textContent = "Non hai spot salvati in questa categoria. Esplora la mappa e salva quelli che ti ispirano.";
                    } else {
                        if (titleEl) titleEl.textContent = "Non hai ancora Preferiti.";
                        if (descEl) descEl.textContent = "Esplora la mappa o ascolta la community e salva gli spot che ti ispirano.";
                    }
                }
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
    emptyStateId = "nearby-empty-state",
    templateSelector = null,
    limit = 20,
    categories = []
} = {}) {
    const emptyState = document.getElementById(emptyStateId);

    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction: async () => {
            const spots = await getFilteredSpots(categories, "", null);
            if (emptyState) {
                emptyState.classList.toggle("hidden", spots.length > 0);
            }
            return spots;
        },
        sortFunction: (a, b) => distanceFromUserToSpot(a) - distanceFromUserToSpot(b),
        limit,
        useWrapper: true,
        setCategoryText: true
    });
}

export async function populateTopratedSpots({
    containerId = "home-toprated-carousel",
    emptyStateId = "toprated-empty-state",
    templateSelector = null,
    limit = 20,
    categories = []
} = {}) {
    const emptyState = document.getElementById(emptyStateId);

    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction: async () => {
            const spots = await getFilteredSpots(categories, "", null);

            if (emptyState) {
                emptyState.classList.toggle("hidden", spots.length > 0);
            }

            return spots
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
