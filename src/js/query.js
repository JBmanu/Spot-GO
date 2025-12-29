/**
 * Wrapper per le query al database (Firestore) e parsing dei documenti.
 * Espone funzioni per leggere utenti, luoghi, salvataggi e categorie.
 */

import { collection, getDocs, query, where, limit, deleteDoc, setDoc, doc, getDoc} from "firebase/firestore";
import { db } from "./firebase.js";

// Cache per le categorie
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
        // Fallback se il file non viene trovato
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

/**
 * Restituisce tutti i Luogo dalla collection.
 */
export async function getSpots() {
    return getItems(
        "Luogo", 
        null,
        (id, data) => ({
            id: id,
            descrizione: data.descrizione,
            idCategoria: data.idCategoria,
            immagine: data.immagine,
            nome: data.nome,
            posizione: {
                coord1: data.posizione.coord1,
                coord2: data.posizione.coord2
            },
            indirizzo: data.indirizzo,
            orari: data.orari,
            costo: data.costo,
            idCreatore: data.idCreatore
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
            if (id == userId) {
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
export async function getFilteredSpots(categories = [], searchText = "") {
    const noFilter = (!categories || categories.length === 0)
                  && (!searchText || searchText.trim() === "");
    if (noFilter) return await getSpots();

    // Filtra almeno per categorie lato Firestore
    let filter = null;
    if (categories.length > 0) {
        filter = where("idCategoria", "in", categories);
    }

    const spots = await getItems("Luogo", filter, (id, data) => ({ id, ...data }));

    if (!searchText || searchText.trim() === "") return spots;

    // Filtra in memoria, case-insensitive
    const searchLower = searchText.trim().toLowerCase();
    return spots.filter(spot => (spot.nome || "").toLowerCase().includes(searchLower));
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
        console.error("Errore recupero items da " + collectionName + ": " , error);
        return [];
    }
}

/**
 * Salva uno spot nei preferiti dell'utente.
 */
export async function addBookmark(idUtente, idLuogo) {
    try {
        const docRef = doc(db, "LuogoSalvato", `${idUtente}_${idLuogo}`);
        await setDoc(docRef, {
            idUtente: idUtente,
            idLuogo: idLuogo,
            dataSalvataggio: new Date()
        });
    } catch (error) {
        console.error("Errore nel salvataggio del bookmark:", error);
    }
}

/**
 * Rimuove uno spot dai preferiti dell'utente.
 */
export async function removeBookmark(idUtente, idLuogo) {
    try {
        const lukRef = collection(db, "LuogoSalvato");
        const q = query(lukRef, where("idUtente", "==", idUtente), where("idLuogo", "==", idLuogo));
        const querySnapshot = await getDocs(q);

        for (const docSnap of querySnapshot.docs) {
            await deleteDoc(docSnap.ref);
        }
    } catch (error) {
        console.error("Errore nella rimozione del bookmark:", error);
    }
}
