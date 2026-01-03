/**
 * Wrapper per le query al database (Firestore) e parsing dei documenti.
 * Espone funzioni per leggere utenti, luoghi, salvataggi e categorie.
 */

import {collection, getDocs, query, where, limit, getDoc} from "firebase/firestore";
import {db} from "./firebase.js";
import { distanceFromUserToSpot } from "./common.js";

let categorieCache = null;

/**
 * Carica le categorie dal file JSON e le converte in una mappa.
 * Restituisce una mappa id_categoria -> nome italiano (cached).
 */
export async function getCategorieMap() {
    if (categorieCache) {
        return categorieCache;
    }

    try {
        const response = await fetch('/db/json/categorie.json');
        const categorie = await response.json();

        categorieCache = {};
        categorie.forEach(cat => {
            categorieCache[cat.id] = cat.nomeIt;
        });

        return categorieCache;
    } catch (error) {
        console.error("Errore nel caricamento categorie:", error);
        return {
            "culture": "Cultura",
            "food": "Cibo",
            "nature": "Natura",
            "mystery": "Mistero"
        };
    }
}

/**
 * Converte un ID categoria nel nome italiano.
 */
export async function getCategoryNameIt(categoriaId) {
    const categorieMap = await getCategorieMap();
    return categorieMap[categoriaId] || categoriaId;
}

/**
 * Restituisce i dati del primo utente nella collezione "Utente".
 */
export async function getFirstUser() {
    try {
        const utentiRef = collection(db, "Utente");
        const q = query(utentiRef, limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        return {
            id: userDoc.id,
            email: userData.email || "",
            username: userData.username || "Utente"
        };
    } catch (error) {
        console.error("Errore recupero primo utente:", error);
        return null;
    }
}

/**
 * Restituisce tutte le recensioni dell'utente con userId.
 */
export async function getReviews(userId) {
    return getItems('Recensione',
        where('idUtente', '==', userId),
        (id, data) => ({
            id: id,
            description: data.description || "",
            idLuogo: data.idLuogo || "",
            idUtente: data.idUtente || "",
            valuation: data.valuation || 0
        })
    );
}

/**
 * Restituisce gli spot creati dall'utente.
 */
export async function getCreatedSpots(userId) {
    return getItems(
        "LuogoCreato",
        where('idUtente', '==', userId),
        (id, data) => ({
            id: id,
            idLuogo: data.idLuogo,
            idUtente: data.idUtente
        })
    );
}

/**
 * Restituisce i LuogoSalvato dell'utente.
 */
export async function getSavedSpots(userId) {
    return getItems(
        "LuogoSalvato",
        where('idUtente', '==', userId),
        (id, data) => ({
            id: id,
            idLuogo: data.idLuogo,
            idUtente: data.idUtente
        })
    );
}

/**
 * Restituisce i LuogoVisitato dell'utente.
 */
export async function getVisitedSpots(userId) {
    return getItems(
        "LuogoVisitato",
        where('idUtente', '==', userId),
        (id, data) => ({
            id: id,
            idLuogo: data.idLuogo,
            idUtente: data.idUtente
        })
    );
}


export async function getFriends(userId) {
    if (userId == null) {
        return "Errore: id utente mancante!"
    }
    return getItems(
        "Amico",
        null,
        (id, data) => {
            if (id === userId) {
                const friendIds = data.friends || [];
                var friends = [];
                friendIds.map(friendRef =>
                    getDoc(friendRef).then(doc => {
                            var friendData = {
                                id: doc.id,
                                email: doc.data().email || "",
                                username: doc.data().username || "Utente"
                            };
                            friends.push(friendData);
                        }
                    ))
                return friends;
            }
        }
    );
}

/**
 * Funzione specifica per ottenere gli spot filtrando per categorie e testo di ricerca
 */
export async function getFilteredSpots(categories = [], searchText = "", filters = null) {
    const noFilter =
        (!categories || categories.length === 0) &&
        (!searchText || searchText.trim() === "") &&
        (!filters);

    if (noFilter) return await getSpots();

    // Filtro db (categorie)
    let firestoreFilter = null;
    if (categories && categories.length > 0) {
        firestoreFilter = where("idCategoria", "in", categories);
    }

    let spots = await getItems(
        "Luogo",
        firestoreFilter,
        (id, data) => ({ id, ...data })
    );

    // Filtro testo (in memoria)
    if (searchText && searchText.trim() !== "") {
        const searchLower = searchText.trim().toLowerCase();
        spots = spots.filter(spot =>
            (spot.nome || "").toLowerCase().includes(searchLower)
        );
    }

    // Filtro DISTANZA
    if (filters?.distance != null) {
        spots = spots.filter(spot => {
            if (!spot.posizione) return false;

            const dist = distanceFromUserToSpot(spot);
            return dist <= filters.distance;
        });
    }

    // Filtro "APERTO ORA"
    if (filters?.openNow === true) {
        const now = new Date();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        spots = spots.filter(spot => {
            if (!Array.isArray(spot.orari)) return false;

            return spot.orari.some(orario => {
                const [hStart, mStart] = orario.inizio.split(":").map(Number);
                const [hEnd, mEnd] = orario.fine.split(":").map(Number);

                const startMinutes = hStart * 60 + mStart;
                const endMinutes = hEnd * 60 + mEnd;

                return currentMinutes >= startMinutes &&
                       currentMinutes <= endMinutes;
            });
        });
    }

    return spots;
}

/**
 * Metodo generico per ottenere items da una collection con un filtro opzionale.
 */
export async function getItems(collectionName, filter, itemParser) {
    try {
        const items = [];
        const colRef = collection(db, collectionName);
        const colsQuery = filter ? query(colRef, filter) : query(colRef);
        const querySnapshot = await getDocs(colsQuery);
        if (querySnapshot.empty) return items;
        querySnapshot.forEach((doc) => {
            items.push(itemParser(doc.id, doc.data()));
        });
        return items;
    } catch (error) {
        console.error("Errore recupero items da " + collectionName + ": ", error);
        return [];
    }
}

/**
 * Restituisce tutti i Luogo dalla collection.
 */
export async function getSpots() {
    return getItems("Luogo", null, (id, data) => ({
        id,
        ...data
    }));
}

/**
 * Restituisce uno spot specifico tramite ID.
 */
export async function getSpotById(spotId) {
    try {
        const spots = await getSpots();
        return spots.find((s) => s.id === spotId) || null;
    } catch (err) {
        console.error("Errore getSpotById:", err);
        return null;
    }
}
