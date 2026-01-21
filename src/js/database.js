import { serverTimestamp, collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, addDoc, arrayUnion, arrayRemove, updateDoc, documentId, orderBy } from "firebase/firestore";
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
    let name = categorieMap[categoriaId];

    const systemCategories = {
        "food": "Cibo",
        "culture": "Cultura",
        "nature": "Natura",
        "mystery": "Mistero"
    };

    if (!name || name === categoriaId || systemCategories[categoriaId]) {
        if (systemCategories[categoriaId]) {
            return systemCategories[categoriaId];
        }
    }

    return name || categoriaId;
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
 * Aggiorna una recensione esistente.
 */
export async function updateReview(reviewId, { rating, description }) {
    try {
        const docRef = doc(db, "Recensione", reviewId);
        await updateDoc(docRef, {
            valuation: Number(rating),
            description: description,
            timestamp: new Date().toISOString()
        });
        console.log(`Recensione ${reviewId} aggiornata`);
    } catch (err) {
        console.error("Errore aggiornamento recensione:", err);
        throw err;
    }
}

/**
 * Elimina una recensione.
 */
export async function deleteReview(reviewId) {
    try {
        const docRef = doc(db, "Recensione", reviewId);
        await deleteDoc(docRef);
        console.log(`Recensione ${reviewId} eliminata`);
    } catch (err) {
        console.error("Errore eliminazione recensione:", err);
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

export async function searchUser(searchId) {
    if (!searchId) return [];

    try {
        // Collection reference
        const usersCol = collection(db, 'Utente');

        // Query per ID che inizia con searchId
        const q = query(
            usersCol,
            where('__name__', '>=', searchId),
            where('__name__', '<=', searchId + '\uf8ff')
        );

        // Esegui query
        const querySnapshot = await getDocs(q);
        // Array risultati
        const matchingUsers = [];
        querySnapshot.forEach((doc) => {
            const docData = doc.data();
            matchingUsers.push({
                id: doc.id,
                livello: docData.livello || "-",
                email: docData.email || "-",
                username: docData.username || "-",
                name: docData.name || "-"
            });
        });

        return matchingUsers;

    } catch (error) {
        console.log('Errore:', error);
        return [];
    }
}

/**
 * Recupera tutti gli utenti registrati.
 */
export async function getAllUsers() {
    return getItems("Utente", null,
        (id, data) => (
            {
                id: id,
                livello: data.livello || "-",
                email: data.email || "-",
                username: data.username || "-"
            }
        ));
}

/**
 * Recupera gli utenti seguiti
 */
export async function getFollowingUser(userId) {
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

// Funzione per ottenere tutti gli utenti in "Amico" che hanno l'utente target nei Friends
export async function getFollowersUser(targetUserId) {
    try {
        //Logged User followings users
        const docRef = doc(db, 'Amico', targetUserId);
        const docSnapshot = await getDoc(docRef);
        const snapData = docSnapshot.data();
        const followingsBack = snapData.friends.map(f => f.id);

        // Get all users that follows logged user.
        const amiciRef = collection(db, 'Amico');
        const q = query(amiciRef);

        const querySnapshot = await getDocs(q);
        const asyncCompute = querySnapshot.docs.map(async (userDoc) => {
            const docData = userDoc.data();
            const ids = docData.friends.map(ref => ref.id);

            if (ids.includes(targetUserId)) {
                const followerId = userDoc.id;
                const userRef = doc(db, 'Utente', followerId);
                const followerDoc = await getDoc(userRef);
                const data = {
                    id: followerDoc.id,
                    followingBack: followingsBack.includes(followerDoc.id),
                    livello: followerDoc.data().livello || "-",
                    email: followerDoc.data().email || "-",
                    username: followerDoc.data().username || "-"
                }
                return data;
            }
        });

        const users = await Promise.all(asyncCompute);
        return users.filter(i => i != null);
    } catch (error) {
        console.error('Errore query Amico:', error);
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
 * UserId inizia a seguire friendEmail
 */
export async function addFollows(userId, friendEmail) {
    if (!userId || !friendEmail) return;
    try {
        const userRef = doc(db, "Amico", userId);
        const friendRef = doc(db, "Utente", friendEmail);
        await setDoc(userRef, { friends: arrayUnion(friendRef) }, { merge: true });
        console.log(`${userId} ora segue ${friendEmail}`);
    } catch (error) {
        console.error("Errore aggiunta follow:", error);
    }
}

export async function getSuggestedFollows(userId) {
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

        var availableFriends = [];
        if (availableIds.length !== 0) {
            // 4. Recupera i dati da Utenti per ogni ID
            availableFriends = await getItems('Utente', where(documentId(), 'in', availableIds),
                (id, data) => ({
                    id: id,
                    livello: data.livello || "-",
                    email: data.email || "-",
                    username: data.username || "-"
                })
            );
        }
        return availableFriends;
    } catch (error) {
        console.error('Errore:', error);
        return [];
    }
}

export async function pullMessages(fromUserId, toFriendId) {
    const chatId = makeChatId(fromUserId, toFriendId);
    const q = query(
        collection(db, 'Chat', chatId, 'messaggi'),
        orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    var chatMessages = [];
    snapshot.forEach(doc => {
        const message = doc.data();
        const isSent = message.mittente === fromUserId;
        chatMessages.push({
            isMittente: isSent,
            testo: message.text,
            timestamp: message.timestamp,
            ref: message.cartolinaRef
        });
    });
    return chatMessages;
}

function makeChatId(str1, str2) {
    const sorted = [str1, str2].sort();
    return sorted.join('-');
}

function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

function intervalsOverlap(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}

/**
 * Filtra gli spot caricati da Firestore.
 */
export async function getFilteredSpots(
    categories = [],
    searchText = "",
    filters = null
) {
    let spots = await getSpots();

    // Coordinate valide
    spots = spots.filter(
        spot =>
            spot.posizione &&
            spot.posizione.coord1 != null &&
            spot.posizione.coord2 != null
    );

    // Categoria
    if (categories && categories.length > 0) {
        spots = spots.filter(spot =>
            categories.includes(spot.idCategoria)
        );
    }

    // Ricerca testuale
    if (searchText && searchText.trim() !== "") {
        const searchLower = searchText.trim().toLowerCase();
        spots = spots.filter(spot =>
            (spot.nome || "").toLowerCase().includes(searchLower)
        );
    }

    // -------------------------
    // DISTANZA (km -> metri)
    // -------------------------
    if (filters?.distanceKm != null && !isNaN(filters?.distanceKm)) {
        const maxDistanceMeters = filters.distanceKm * 1000;

        spots = spots.filter(spot => {
            const dist = distanceFromUserToSpot(spot);
            return dist <= maxDistanceMeters;
        });
    }

    // -------------------------
    // FASCIA ORARIA (INTERSEZIONE)
    // -------------------------
    if (filters?.startTime && filters?.endTime) {
        const filterStart = timeToMinutes(filters.startTime);
        const filterEnd = timeToMinutes(filters.endTime);

        spots = spots.filter(spot => {
            if (!Array.isArray(spot.orari)) return false;

            // il luogo è valido se ALMENO UNA fascia si interseca
            return spot.orari.some(orario => {
                const spotStart = timeToMinutes(orario.inizio);
                const spotEnd = timeToMinutes(orario.fine);

                return intervalsOverlap(
                    filterStart,
                    filterEnd,
                    spotStart,
                    spotEnd
                );
            });
        });
    }

    // -------------------------
    // VALUTAZIONE
    // -------------------------
    if (filters?.rating > 0) {
        spots = spots.filter(spot => {
            return spot.valutazione >= filters.rating;
        });
    }

    // -------------------------
    // STATI (Visited, Saved, Mine)
    // -------------------------
    const user = await getCurrentUser();
    const userId = user.email;

    if (userId && filters?.status) {
        const { visited, saved, mine } = filters.status;

        // Filtro "Creato da me"
        if (mine) {
            spots = spots.filter(spot => 
                spot.idCreatore != null && spot.idCreatore === userId
            );
        }

        // Filtro "Visitato"
        if (visited) {
            const visitedSnap = await getDocs(
                query(collection(db, "LuogoVisitato"), where("idUtente", "==", userId))
            );
            const visitedIds = visitedSnap.docs.map(doc => doc.data().idLuogo);
            spots = spots.filter(spot => visitedIds.includes(spot.id));
        }

        // Filtro "Salvato"
        if (saved) {
            const savedSnap = await getDocs(
                query(collection(db, "LuogoSalvato"), where("idUtente", "==", userId))
            );
            const savedIds = savedSnap.docs.map(doc => doc.data().idLuogo);
            spots = spots.filter(spot => savedIds.includes(spot.id));
        }
    }

    return spots;
}

/**
 * Recupera cartolina per ID da Firestore.
 */
export async function getCartolinaById(cardBoardId) {
    try {
        const docSnap = await getDoc(doc(db, "Cartolina", cardBoardId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (err) {
        console.error("Errore getCartolinaById:", err);
        return null;
    }
}

/**
 * Condividi cartolina con gli id-utenti forniti.
 */
export async function shareCardboard(cardBoardId, receiverIds) {
    const user = await getCurrentUser();
    const sendTime = serverTimestamp();
    const message = {
        mittente: user.email,
        testo: "",
        timestamp: sendTime,
        cartolinaRef: cardBoardId
    };

    try {
        // Per ogni destinatario, aggiungi il messaggio nella rispettiva chat
        const promises = receiverIds.map(async (toId) => {
            const chatId = makeChatId(user.email, toId);
            // Aggiungi il messaggio nella sottocollezione 'messaggi'
            await addDoc(collection(db, 'Chat', chatId, 'messaggi'), message);
        });

        // Attendi che tutti i messaggi siano stati inviati
        await Promise.all(promises);

        console.log(`Cartolina condivisa con ${receiverIds.length} destinatari`);
        return { success: true, descr: "" };
    } catch (error) {
        console.error("Errore durante la condivisione:", error);
        return { success: false, error: error };
    }
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
    try {
        const docRef = await addDoc(collection(db, "Luogo"), spot);
        return docRef.id;
    } catch (err) {
        console.error("Errore inserimento Luogo:", err);
        throw err;
    }
}

/**
 * Adds a new polaroid to the database
 */
export async function addPolaroidToDatabase({ title, idLuogo, date, imageUrl }) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("Utente non autenticato");

        const docRef = await addDoc(collection(db, "Cartolina"), {
            idUtente: user.id,
            title: title,
            idLuogo: idLuogo,
            date: date,
            immagini: imageUrl ? [imageUrl] : [],
            friends: [],
            timestamp: new Date().toISOString()
        });
        return docRef.id;
    } catch (err) {
        console.error("Errore salvataggio polaroid:", err);
        throw err;
    }
}

/**
 * Recupera le polaroid create da un utente
 */
export async function getUserPolaroids(userId) {
    return getItems(
        "Cartolina",
        where('idUtente', '==', userId),
        (id, data) => ({
            id: id,
            ...data
        })
    );
}

/**
 * Ottiene tutte le notifiche dell'utente corrente
 */
export async function getUserNotifications() {
    const currentUser = await getCurrentUser();
    const utenteTo = currentUser.email;

    return getItems(
        "Notifiche",
        where('utenteTo', '==', utenteTo),
        (id, data) => ({
            id: id,
            ...data
        })
    );
}

/**
 * Invia una notifica dall'utente corrente ad un determinato utente
 */
export async function sendNotificationToUser(userId) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Utente non autenticato");
        }

        const utenteFrom = currentUser.email;
        const utenteTo = userId;

        if (!utenteTo) {
            throw new Error("Destinatario notifica non valido");
        }

        const docRef = await addDoc(collection(db, "Notifiche"), {
            utenteFrom,
            utenteTo,
            viewed: false,
            timestamp: new Date().toISOString()
        });

        return docRef.id;
    } catch (err) {
        console.error("Errore invio notifica:", err);
        throw err;
    }
}

/**
 * Cancella tutte le notifiche dell'utente corrente
 */
export async function deleteAllUserNotifications() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Utente non autenticato");
        }

        const utenteTo = currentUser.email;

        const q = query(
            collection(db, "Notifiche"),
            where("utenteTo", "==", utenteTo)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return 0; // nessuna notifica da cancellare
        }

        const deletePromises = snapshot.docs.map((docSnap) =>
            deleteDoc(doc(db, "Notifiche", docSnap.id))
        );

        await Promise.all(deletePromises);

        return snapshot.size; // numero notifiche eliminate
    } catch (err) {
        console.error("Errore cancellazione notifiche:", err);
        throw err;
    }
}


/**
 * Updates a polaroid document
 */
export async function updatePolaroid(polaroidId, dataToUpdate) {
    try {
        const docRef = doc(db, "Cartolina", polaroidId);
        await updateDoc(docRef, dataToUpdate);
        console.log(`Polaroid ${polaroidId} aggiornata`);
    } catch (err) {
        console.error("Errore aggiornamento polaroid:", err);
        throw err;
    }
}

export async function deletePolaroid(polaroidId) {
    try {
        const docRef = doc(db, "Cartolina", polaroidId);
        await deleteDoc(docRef);
        console.log(`Polaroid ${polaroidId} eliminata`);
    } catch (err) {
        console.error("Errore eliminazione polaroid:", err);
        throw err;
    }
}
