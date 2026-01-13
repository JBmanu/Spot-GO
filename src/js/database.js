import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db, auth } from "./firebase.js";
import { distanceFromUserToSpot } from "./common.js";

let categorieCache = null;

/**
 * Recupera la mappa delle categorie (ID -> Nome It) da Firestore.
 */
export async function getCategorieMap() {
    if (categorieCache) return categorieCache;

    try {
        const querySnapshot = await getDocs(collection(db, "Categoria"));
        categorieCache = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            categorieCache[doc.id] = data.nomeIt || data.nome || doc.id;
        });
        return categorieCache;
    } catch (error) {
        console.error("Errore recupero categorie da Firestore:", error);
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

/**
 * Recupera l'utente corrente dalla sessione localStorage o Firebase.
 */
export async function getCurrentUser() {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        try {
            const user = JSON.parse(currentUserStr);
            return {
                id: user.id,
                email: user.email || "",
                username: user.username || "Utente",
                livello: user.livello || 1
            };
        } catch (e) {
            console.error("Errore parsing currentUser:", e);
        }
    }

    const fbUser = auth.currentUser;
    if (fbUser) {
        return {
            id: fbUser.email,
            email: fbUser.email,
            username: fbUser.email.split('@')[0],
            livello: 1
        };
    }

    return null;
}

/**
 * Carica tutte le recensioni di un utente specifico da Firestore.
 */
export async function getReviews(username) {
    try {
        const q = query(collection(db, "Recensione"), where("idUtente", "==", username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Errore recupero recensioni:", error);
        return [];
    }
}

/**
 * Recupera gli spot creati da un utente.
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
 * Recupera gli spot salvati da un utente da Firestore.
 */
export async function getSavedSpots(username) {
    try {
        const q = query(collection(db, "LuogoSalvato"), where("idUtente", "==", username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Errore recupero spot salvati:", error);
        return [];
    }
}

/**
 * Recupera gli spot visitati da un utente da Firestore.
 */
export async function getVisitedSpots(username) {
    try {
        const q = query(collection(db, "LuogoVisitato"), where("idUtente", "==", username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Errore recupero spot visitati:", error);
        return [];
    }
}

/**
 * Recupera la lista amici di un utente.
 */
export async function getFriends(userId) {
    if (!userId) return [];
    try {
        const docRef = doc(db, "Amico", userId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return [];

        const friendIds = docSnap.data().friends || [];
        const friends = [];
        for (const friendEmail of friendIds) {
            const friendSnap = await getDoc(doc(db, "Utente", friendEmail));
            if (friendSnap.exists()) {
                friends.push({ id: friendSnap.id, ...friendSnap.data() });
            }
        }
        return friends;
    } catch (error) {
        console.error("Errore recupero amici:", error);
        return [];
    }
}

/**
 * Filtra gli spot caricati da Firestore.
 */
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
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        spots = spots.filter(spot => {
            if (!Array.isArray(spot.orari)) return false;
            return spot.orari.some(orario => {
                const [hStart, mStart] = orario.inizio.split(":").map(Number);
                const [hEnd, mEnd] = orario.fine.split(":").map(Number);
                const startMinutes = hStart * 60 + mStart;
                const endMinutes = hEnd * 60 + mEnd;
                return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            });
        });
    }

    return spots;
}

/**
 * Helper generico per recuperare items da una collezione.
 */
export async function getItems(collectionName, filter, itemParser) {
    try {
        const items = [];
        const colRef = collection(db, collectionName);
        const colsQuery = filter ? query(colRef, filter) : query(colRef);
        const querySnapshot = await getDocs(colsQuery);
        querySnapshot.forEach((doc) => {
            items.push(itemParser(doc.id, doc.data()));
        });
        return items;
    } catch (error) {
        console.error(`Errore recupero items da ${collectionName}:`, error);
        return [];
    }
}

/**
 * Carica tutti i luoghi da Firestore.
 */
export async function getSpots() {
    try {
        const querySnapshot = await getDocs(collection(db, "Luogo"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Errore recupero luoghi da Firestore:", error);
        return [];
    }
}

/**
 * Recupera un singolo spot per ID da Firestore.
 */
export async function getSpotById(spotId) {
    try {
        const docSnap = await getDoc(doc(db, "Luogo", spotId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (err) {
        console.error("Errore getSpotById:", err);
        return null;
    }
}

/**
 * Salva uno spot tra i preferiti dell'utente in Firestore.
 */
export async function addSavedSpot(username, spotId) {
    try {
        const docId = `${username}_${spotId}`;
        await setDoc(doc(db, "LuogoSalvato", docId), {
            idUtente: username,
            idLuogo: spotId,
            dataSalvataggio: new Date().toISOString()
        });
        console.log(`Spot ${spotId} salvato per ${username}`);
    } catch (error) {
        console.error("Errore salvataggio spot:", error);
    }
}

/**
 * Rimuove uno spot dai preferiti dell'utente in Firestore.
 */
export async function removeSavedSpot(username, spotId) {
    try {
        const docId = `${username}_${spotId}`;
        await deleteDoc(doc(db, "LuogoSalvato", docId));
        console.log(`Spot ${spotId} rimosso dai salvati per ${username}`);
    } catch (error) {
        console.error("Errore rimozione spot salvato:", error);
    }
}

export function pickRating(spot) {
    return spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
}
