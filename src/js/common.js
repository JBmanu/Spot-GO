// Posizione utente fittizia (per prototipo)
const USER_PROTO_POSITION = {
    lat: 41.8962,
    lng: 12.4873
};

// Raggio medio della Terra in km
const EARTH_RADIUS_KM = 6371;

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

export { USER_PROTO_POSITION }