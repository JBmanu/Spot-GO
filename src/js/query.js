import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "./firebase.js";
import firebase from "firebase/compat/app";

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