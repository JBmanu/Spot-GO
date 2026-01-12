import { collection, getDocs, query, where, limit, getDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { distanceFromUserToSpot } from "./common.js";

let categorieCache = null;
let spotsCache = null;
let relazioniCache = null;

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

export async function getCategoryNameIt(categoriaId) {
    const categorieMap = await getCategorieMap();
    return categorieMap[categoriaId] || categoriaId;
}

export async function getCurrentUser() {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        try {
            const user = JSON.parse(currentUserStr);
            return {
                id: user.username,
                email: user.email || "",
                username: user.username || "Utente"
            };
        } catch (e) {
            console.error("Errore parsing currentUser:", e);
        }
    }

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

export async function getReviews(username) {
    const relazioni = await loadRelazioniFromJSON();
    const userRel = relazioni.find(r => r.username === username);
    if (!userRel) return [];

    const reviews = userRel.recensioni || [];
    return reviews.map(r => ({
        id: `${username}_${r.nome}`,
        description: r.testo || "",
        idLuogo: r.nome,
        idUtente: username,
        valuation: r.valutazione || 0
    }));
}

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

export async function getSavedSpots(username) {
    const savedKey = `savedSpots_${username}`;
    const localSaved = localStorage.getItem(savedKey);
    if (localSaved) {
        try {
            const savedIds = JSON.parse(localSaved);
            const spots = await loadSpotsFromJSON();
            return savedIds.map(id => {
                const spot = spots.find(sp => sp.nome === id);
                return spot ? { id: spot.nome, idLuogo: spot.nome, idUtente: username } : null;
            }).filter(Boolean);
        } catch (e) {
            console.error("Errore parsing localStorage saved spots:", e);
        }
    }

    const relazioni = await loadRelazioniFromJSON();
    const userRel = relazioni.find(r => r.username === username);
    if (!userRel) return [];

    const spots = await loadSpotsFromJSON();
    const saved = userRel.salvati || [];
    return saved.map(s => {
        const spot = spots.find(sp => sp.nome === s.nome && sp.idCategoria === s.categoria);
        return spot ? { id: spot.nome, idLuogo: spot.nome, idUtente: username } : null;
    }).filter(Boolean);
}

export async function getVisitedSpots(username) {
    const relazioni = await loadRelazioniFromJSON();
    const userRel = relazioni.find(r => r.username === username);
    if (!userRel) return [];

    const spots = await loadSpotsFromJSON();
    const visited = userRel.visitati || [];
    return visited.map(v => {
        const spot = spots.find(sp => sp.nome === v.nome && sp.idCategoria === v.categoria);
        return spot ? { id: spot.nome, idLuogo: spot.nome, idUtente: username, data: v.data } : null;
    }).filter(Boolean);
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

export async function getFilteredSpots(categories = [], searchText = "", filters = null) {
    let spots = await getSpots();

    if (categories && categories.length > 0) {
        spots = spots.filter(spot => categories.includes(spot.idCategoria));
    }

    if (searchText && searchText.trim() !== "") {
        const searchLower = searchText.trim().toLowerCase();
        spots = spots.filter(spot =>
            (spot.nome || "").toLowerCase().includes(searchLower)
        );
    }

    if (filters?.distance != null) {
        spots = spots.filter(spot => {
            if (!spot.posizione) return false;

            const dist = distanceFromUserToSpot(spot);
            return dist <= filters.distance;
        });
    }

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

export async function getSpots() {
    return await loadSpotsFromJSON();
}

export async function getSpotById(spotId) {
    try {
        const spots = await getSpots();
        return spots.find((s) => s.id === spotId) || null;
    } catch (err) {
        console.error("Errore getSpotById:", err);
        return null;
    }
}

export async function loadSpotsFromJSON() {
    if (spotsCache) {
        return spotsCache;
    }

    try {
        const response = await fetch('/db/json/luoghi.json');
        const spots = await response.json();
        spotsCache = spots.map(spot => ({ ...spot, id: spot.nome }));
        return spotsCache;
    } catch (error) {
        console.error("Errore nel caricamento luoghi:", error);
        return [];
    }
}

export async function loadRelazioniFromJSON() {
    if (relazioniCache) {
        return relazioniCache;
    }

    const localRelazioni = localStorage.getItem('relazioni_utenti');
    if (localRelazioni) {
        try {
            relazioniCache = JSON.parse(localRelazioni);
            return relazioniCache;
        } catch (e) {
            console.error("Errore parsing localStorage relazioni:", e);
        }
    }

    try {
        const response = await fetch('/db/json/relazioni_utenti.json');
        relazioniCache = await response.json();
        return relazioniCache;
    } catch (error) {
        console.error("Errore nel caricamento relazioni:", error);
        return [];
    }
}

export async function addSavedSpot(username, spotId) {
    const relazioni = await loadRelazioniFromJSON();
    let userRel = relazioni.find(r => r.username === username);
    if (!userRel) {
        userRel = { username, salvati: [], visitati: [], creati: [], recensioni: [] };
        relazioni.push(userRel);
    }
    if (!userRel.salvati) userRel.salvati = [];

    const spots = await loadSpotsFromJSON();
    const spot = spots.find(s => s.nome === spotId);
    if (!spot) return;

    const categoria = spot.idCategoria;
    const existing = userRel.salvati.find(s => s.nome === spotId && s.categoria === categoria);
    if (!existing) {
        userRel.salvati.push({ nome: spotId, categoria });
        relazioniCache = relazioni;
        localStorage.setItem('relazioni_utenti', JSON.stringify(relazioni));
    }

    const savedKey = `savedSpots_${username}`;
    const localSaved = localStorage.getItem(savedKey);
    let savedIds = [];
    if (localSaved) {
        try {
            savedIds = JSON.parse(localSaved);
        } catch (e) {
            savedIds = [];
        }
    }
    if (!savedIds.includes(spotId)) {
        savedIds.push(spotId);
        localStorage.setItem(savedKey, JSON.stringify(savedIds));
    }
}

export async function removeSavedSpot(username, spotId) {
    const relazioni = await loadRelazioniFromJSON();
    const userRel = relazioni.find(r => r.username === username);
    if (userRel && userRel.salvati) {
        const spots = await loadSpotsFromJSON();
        const spot = spots.find(s => s.nome === spotId);
        if (spot) {
            const categoria = spot.idCategoria;
            userRel.salvati = userRel.salvati.filter(s => !(s.nome === spotId && s.categoria === categoria));
            relazioniCache = relazioni;
            localStorage.setItem('relazioni_utenti', JSON.stringify(relazioni));
        }
    }

    const savedKey = `savedSpots_${username}`;
    const localSaved = localStorage.getItem(savedKey);
    if (localSaved) {
        try {
            let savedIds = JSON.parse(localSaved);
            savedIds = savedIds.filter(id => id !== spotId);
            localStorage.setItem(savedKey, JSON.stringify(savedIds));
        } catch (e) {
        }
    }
}

export function pickRating(spot) {
    return spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
}
