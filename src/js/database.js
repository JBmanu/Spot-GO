import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, addDoc, arrayUnion, arrayRemove, updateDoc, documentId} from "firebase/firestore";
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
 * Carica tutte le recensioni di uno spot da Firestore.
 */
export async function getReviewsForSpot(spotId) {
    try {
        const q = query(collection(db, "Recensione"), where("idLuogo", "==", spotId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Errore recupero recensioni per lo spot:", error);
        return [];
    }
}

/**
 * Aggiunge una nuova recensione al database Firestore.
 */
export async function addReviewToDatabase(spotId, { rating, description }) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Utente non autenticato");

    try {
        const docRef = await addDoc(collection(db, "Recensione"), {
            idLuogo: spotId,
            idUtente: user.username,
            valuation: Number(rating),
            description: description,
            timestamp: new Date().toISOString()
        });
        return docRef.id;
    } catch (err) {
        console.error("Errore salvataggio recensione:", err);
        throw err;
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
        const docRef = doc(db, 'Amico', userId);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            const snapData = docSnapshot.data();
            const friendPromises = snapData.friends.map(async friendRef => {
                const doc = await getDoc(friendRef)
                const docData = doc.data();
                return {
                    id: doc.id,
                    livello: docData.livello || "-",
                    email: docData.email || "-",
                    username: docData.username || "-"
                }
            })
            const friends = await Promise.all(friendPromises);
            return friends;
        } else {
            console.log('Documento non trovato');
            return [];
        }
    } catch (error) {
        console.log(error);
        return [];
    }
}

export async function removeFriend(userId, friendId) {
    if (!friendId) return;
    try {
        const docRef = doc(db, 'Amico', userId);
        const friendRef = doc(db, 'Utente', friendId);
        await updateDoc(docRef, {
            friends: arrayRemove(friendRef)
        });
  } catch (error) {
    console.error('Errore:', error);
  }
}

/**
 * Aggiunge un amico a un utente (reciproco).
 */
export async function addFriend(userId, friendEmail) {
    if (!userId || !friendEmail) return;
    try {
        const userRef = doc(db, "Amico", userId);
        const friendRef = doc(db, "Utente", friendEmail);
        await setDoc(userRef, { friends: arrayUnion(friendRef) }, { merge: true });
        //followers and following approach not need reciprocity
        //await setDoc(friendRef, { friends: arrayUnion(userRef) }, { merge: true });
        console.log(`${userId} ora segue ${friendEmail}`);
    } catch (error) {
        console.error("Errore aggiunta follow:", error);
    }
}

export async function getSuggestedFriends(userId) {
    if (!userId) return;
    try {
        const userDocRef = doc(db, 'Amico', userId);
        const userDocSnapshot = await getDoc(userDocRef);
        
        const currentFriendsIds = new Set();
        if (userDocSnapshot.exists()) {
            const friendRefs = userDocSnapshot.data().friends || [];
            friendRefs.forEach(ref => {
                currentFriendsIds.add(ref.id);
            });
        }

        // 2. Ottieni TUTTI i documenti dalla collezione Amico
        const amicoCollectionRef = collection(db, 'Amico');
        const allUsersSnapshot = await getDocs(amicoCollectionRef);
        
        // 3. Filtra escludendo gli amici attuali e l'utente stesso
        const availableIds = [];
        allUsersSnapshot.forEach(doc => {
            if (doc.id !== userId && !currentFriendsIds.has(doc.id)) {
                availableIds.push(doc.id);
            }
        });

        // 4. Recupera i dati da Utenti per ogni ID
        const availableFriends = await getItems('Utente',  where(documentId(), 'in', availableIds), 
            (id, data) => ({
                id: id,
                livello: data.livello || "-",
                email: data.email || "-",
                username: data.username || "-"
            })
        );
        return availableFriends;
    } catch (error) {
        console.error('Errore:', error);
        return [];
    }
}

/**
 * Rimuove un amico da un utente (reciproco).
 */
// export async function removeFriend(userId, friendEmail) {
//     if (!userId || !friendEmail) return;
//     try {
//         const userRef = doc(db, "Amico", userId);
//         const friendRef = doc(db, "Amico", friendEmail);

//         await updateDoc(userRef, { friends: arrayRemove(friendEmail) });
//         await updateDoc(friendRef, { friends: arrayRemove(userId) });

//         console.log(`Amicizia rimossa tra ${userId} e ${friendEmail}`);
//     } catch (error) {
//         console.error("Errore rimozione amico:", error);
//     }
// }

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

export async function insertNewSpot(spot) {
    const docRef = await addDoc(collection(db, "Luogo"), spot);
    return docRef.id;
}
