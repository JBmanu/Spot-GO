import {getFirstUser, getSavedSpots, getSpots} from "../../query.js";
import {generateSpotCardList} from "./generateSpotCardList.js";
import {fitText} from "../../common/fitText.js";
import {initializeBookmarkButtonAttributes} from "../../common/spotCardHelpers.js";

/**
 * Recupera i dati degli spot salvati dall'utente corrente.
 * @returns {Promise<Array>} Un array di oggetti spot salvati.
 */
export async function getSavedSpotsData() {
    const user = await getFirstUser();
    if (!user) return [];

    const relations = await getSavedSpots(user.id);
    if (!relations.length) return [];

    const allSpots = await getSpots();
    const neededIds = new Set(relations.map(r => String(r.idLuogo)).filter(Boolean));
    return allSpots.filter(s => neededIds.has(String(s.id)));
}

/**
 * Applica il fitText ai titoli delle card salvate dopo il popolamento.
 * @param {string} containerId - L'ID del contenitore.
 */
function postPopulateSaved(containerId) {
    fitText(
        '.spot-card-saved [data-category="title"]',
        "#" + containerId,
        2,
        10.5
    );
}

/**
 * Popola il contenitore degli spot salvati con le card corrispondenti.
 * @param {Object} options - Opzioni di configurazione.
 * @param {string} options.containerId - ID del contenitore.
 * @param {string} options.emptyStateId - ID dell'elemento per lo stato vuoto.
 * @param {string} options.templateSelector - Selettore del template.
 * @returns {Promise<void>}
 */
export async function populateSavedSpots({
                                             containerId = "home-saved-container",
                                             emptyStateId = "saved-empty-state",
                                             templateSelector = '[data-template="saved-card"]',
                                         } = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }

    const emptyState = document.getElementById(emptyStateId);

    const getSpotsFunction = async () => {
        const spots = await getSavedSpotsData();

        if (!spots.length) {
            if (emptyState) emptyState.classList.remove("hidden");
            return [];
        }

        if (emptyState) emptyState.classList.add("hidden");
        return spots;
    };

    await generateSpotCardList({
        containerId,
        templateSelector,
        getSpotsFunction,
        useWrapper: true,
        setCategoryText: false,
        bookmarkInit: (card) => initializeBookmarkButtonAttributes(card, {saved: "true", type: "saved"}),
    });

    postPopulateSaved(containerId);
}
