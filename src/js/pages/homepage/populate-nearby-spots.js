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
                                              templateSelector = '[data-template="nearby-card"]',
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
            { selector: '[data-field="distance"]', valueFunction: (spot) => formatDistance(distanceFromUserToSpot(spot)) },
            { selector: '[data-field="rating"]', valueFunction: (spot) => formatRatingAsText(pickRating(spot)) },
        ],
        trackClass: "carousel-horizontal_track",
    });
}
