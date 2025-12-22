import { collection, getDocs, query, where, limit, deleteDoc, setDoc, doc } from "firebase/firestore";
import { db } from "./firebase.js";
import firebase from "firebase/compat/app";

// Cache per le categorie
let categorieCache = null;

/**
 * Carica le categorie dal file JSON e le converte in una mappa
 * @returns {Promise<Object>} Mappa id_categoria -> nome italiano
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
 * Converte un ID categoria nel nome italiano
 * @param {string} categoriaId - ID della categoria (es. "culture")
 * @returns {Promise<string>} Nome della categoria in italiano
 */
export async function getCategoryNameIt(categoriaId) {
    const categorieMap = await getCategorieMap();
    return categorieMap[categoriaId] || categoriaId;
}

/**
 * Restituisce i dati del primo utente nella collezione "Utente"
 * @returns {Promise<Object|null>} Oggetto dati utente o null se non trovato
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

/** Restituisce tutte le recensioni dell'utente con userId*/
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

/**
 * Generic methods to get documents from collection.
 * @param {*} collectionName name of collection
 * @param {*} filter optional filter of query
 * @param {*} itemParser converts from firebase snapshot (id, data) to javascript object
 * @returns ritorna un array di oggetti definiti dal itemParser
 */
async function getItems(collectionName, filter, itemParser) {
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
 * Salva uno spot nei preferiti dell'utente
 * @param {string} idUtente - ID dell'utente
 * @param {string} idLuogo - ID del luogo
 */
export async function addBookmark(idUtente, idLuogo) {
    try {
        const docRef = doc(db, "LuogoSalvato", `${idUtente}_${idLuogo}`);
        await setDoc(docRef, {
            idUtente: idUtente,
            idLuogo: idLuogo,
            dataSalvataggio: new Date()
        });
        console.log(`Luogo ${idLuogo} salvato per l'utente ${idUtente}`);
    } catch (error) {
        console.error("Errore nel salvataggio del bookmark:", error);
    }
}

/**
 * Rimuove uno spot dai preferiti dell'utente
 * @param {string} idUtente - ID dell'utente
 * @param {string} idLuogo - ID del luogo
 */
export async function removeBookmark(idUtente, idLuogo) {
    try {
        const lukRef = collection(db, "LuogoSalvato");
        const q = query(lukRef, where("idUtente", "==", idUtente), where("idLuogo", "==", idLuogo));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            deleteDoc(docSnap.ref);
        });
        console.log(`Luogo ${idLuogo} rimosso dai preferiti dell'utente ${idUtente}`);
    } catch (error) {
        console.error("Errore nella rimozione del bookmark:", error);
    }
}

