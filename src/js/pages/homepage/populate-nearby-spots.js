import { getSpots } from "../../json-data-handler.js";
import {distanceFromUserToSpot, formatDistance} from "../../common.js";
import {generateSpotCardList} from "./generate-spot-card-list.js";
import {formatRatingAsText, pickRating} from "../../common/spotCardHelpers.js";

/**
 * Popola il contenitore degli spot vicini con le card degli spot.
 * @param {Object} options - Opzioni di configurazione.
 * @param {string} options.containerId - L'ID dell'elemento contenitore.
 * @param {string} options.templateSelector - Il selettore per l'elemento template.
 * @param {number} options.limit - Il numero massimo di spot da visualizzare.
 * @returns {Promise<void>}
 */
export async function populateNearbySpots({
                                              containerId = "home-nearby-container",
                                              templateSelector = '[data-template="nearby-card-template"]',
                                              limit = 10,
                                          } = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }

    const template = document.querySelector(templateSelector);
    Array.from(container.children).forEach(child => {
        if (child !== template) child.remove();
    });

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
        trackClass: "carousel-horizontal_track",
    });
}
