// Posizione utente fittizia (per prototipo)
const USER_PROTO_POSITION = {
    lat: 41.8650,
    lng: 12.5517
};

// Raggio medio della Terra in km
const EARTH_RADIUS_KM = 6371;

/**
 * Calcola la distanza (in linea d'aria) tra la posizione corrente dell'utente e un determinato spot.
 * 
 * @param {spot} spot - Il luogo dal quale calcolare la distanza
 * @returns {decimal} Distanza in linea d'aria
 */
export function distanceFromUserToSpot(spot) {
    const lat1 = USER_PROTO_POSITION.lat;
    const lon1 = USER_PROTO_POSITION.lng;

    const lat2 = spot.posizione.coord1;
    const lon2 = spot.posizione.coord2;

    // Conversione gradi → radianti
    const dLat = degToRad(lat2 - lat1);
    const dLon = degToRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degToRad(lat1)) *
        Math.cos(degToRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceKm = EARTH_RADIUS_KM * c;

    // ritorno in metri (numero)
    return Math.round(distanceKm * 1000);
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Converte una distanza in metri in stringa leggibile.
 * <1000 m → mostra in metri, >=1000 m → mostra in km con una cifra decimale
 *
 * @param {number} meters - Distanza in metri
 * @returns {string} Distanza formattata (es. "350 m", "1.2 km")
 */
export function formatDistance(meters) {
    if (typeof meters !== "number" || isNaN(meters)) return "";

    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    } else {
        return `${(meters / 1000).toFixed(1)} km`;
    }
}

/**
 * Ordina gli spot in base alla distanza dall'utente.
 *
 * @param {Array} spots - Array di oggetti spot dal DB.
 * @returns {Array} Nuovo array ordinato dal più vicino al più lontano.
 */
export function orderByDistanceFromUser(spots) {
    if (!Array.isArray(spots)) return [];

    // Nuovo array per non modificare l'originale
    const spotsCopy = [...spots];

    // Ordinamento in base alla distanza calcolata
    spotsCopy.sort((a, b) => {
        const distanceA = distanceFromUserToSpot(a);
        const distanceB = distanceFromUserToSpot(b);
        return distanceA - distanceB; // crescente
    });

    return spotsCopy;
}

export { USER_PROTO_POSITION }