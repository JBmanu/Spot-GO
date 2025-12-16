import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "./firebase.js";

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
