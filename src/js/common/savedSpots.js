// js/common/savedSpots.js

import { getFirstUser, getSavedSpots, getSpots } from "../query.js";

/**
 * Ritorna tutti gli spot salvati dell’utente corrente.
 * 👉 SOLO DATI, nessun DOM.
 */
export async function getSavedSpotsData() {
    const user = await getFirstUser();
    if (!user) return [];

    const relations = await getSavedSpots(user.id);
    if (!relations || relations.length === 0) return [];

    const allSpots = await getSpots();

    return relations
        .map(rel => allSpots.find(spot => spot.id === rel.idLuogo))
        .filter(Boolean);
}

/**
 * Ritorna true se uno spot è nei salvati.
 * Utile per:
 * - header bookmark
 * - controlli rapidi
 */
export async function isSpotSaved(spotId) {
    const user = await getFirstUser();
    if (!user) return false;

    const relations = await getSavedSpots(user.id);
    return relations.some(r => r.idLuogo === spotId);
}

/**
 * (OPZIONALE) Ritorna i saved ordinati.
 * Qui puoi centralizzare la regola.
 */
export function sortSavedSpots(spots, { by = "name" } = {}) {
    if (!Array.isArray(spots)) return [];

    switch (by) {
        case "name":
            return [...spots].sort((a, b) =>
                (a.nome || "").localeCompare(b.nome || "")
            );

        case "recent":
            return [...spots]; // se in futuro avrai date

        default:
            return spots;
    }
}
