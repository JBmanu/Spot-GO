/**
 * Configurazione e inizializzazione di Firebase.
 */

import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    addDoc,
    doc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let db = null;
let auth = null;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Configurazione incompleta! Controlla .env file.");
} else {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        if (typeof window !== 'undefined') {
            window.firebaseApp = app;
            window.db = db;
            window.firebaseAuth = auth;
        }
    } catch (error) {
        console.error("ERRORE di configurazione in Firebase!", error);
    }
}

export { app, db, auth };

/**
 * Funzione di seeder per resettare e popolare il database.
 * Nota: Questa funzione deve essere chiamata solo in ambiente Node.js.
 */
export async function resetAndPopulateDatabase() {
    if (typeof window !== 'undefined') {
        console.error("resetAndPopulateDatabase può essere eseguita solo lato server/CLI.");
        return;
    }

    try {
        const { readFileSync } = await import('fs');
        const path = await import('path');
        const { setDoc, doc } = await import('firebase/firestore');

        console.log("Cancellazione dati esistenti...");

        const collections = [
            "Utente", "Categoria", "Luogo", "Cartolina", "Missione", "Notifica",
            "Amico", "LuogoVisitato", "LuogoSalvato", "LuogoCreato",
            "Recensione", "CartolinaInviata"
        ];

        for (const col of collections) {
            await clearCollection(col);
        }

        console.log("Creazione nuovi record...");

        // Percorsi assoluti risolti rispetto alla radice del progetto
        const rootDir = process.cwd();
        const readJson = (file) => JSON.parse(readFileSync(path.join(rootDir, 'src/db/json', file), 'utf-8'));

        const luoghi = readJson('luoghi.json');
        const utenti = readJson('utenti.json');
        const relazioniUtentiLuoghi = readJson('relazioni_utenti.json');

        const utentiMap = {};
        for (const utenteData of utenti) {
            const id = utenteData.email;
            await setDoc(doc(db, "Utente", id), utenteData);
            utentiMap[utenteData.username] = id;
            console.log(`Utente creato: ${utenteData.username} (${id})`);
        }

        const luoghiMap = {};
        for (const luogoData of luoghi) {
            const idCreatore = luogoData.idCreatore === "master" ? "master" : (utentiMap[luogoData.idCreatore] || utentiMap["paperino"]);
            const luogo = {
                ...luogoData,
                idCreatore: idCreatore
            };
            const luogoId = await createDocumentAutoId("Luogo", luogo);
            luoghiMap[luogoData.nome] = luogoId;
        }

        const paperinoId = utentiMap["paperino"];
        await createDocumentAutoId("Cartolina", {
            idUtente: paperinoId,
            title: "Cartolina dal Colosseo",
            idLuogo: luoghiMap["Colosseo"],
            date: new Date(),
            description: "Bellissima visita!",
            immagini: ["url_img1", "url_img2"],
            friends: []
        });

        await createDocumentAutoId("Missione", {
            idUtente: paperinoId,
            idLuogo: luoghiMap["Colosseo"],
            type: "visita",
            progressione: 0,
            obiettivo: 1,
            completata: false
        });

        for (const relazioneData of relazioniUtentiLuoghi) {
            const utenteId = utentiMap[relazioneData.username];
            if (!utenteId) continue;

            for (const salvatoData of relazioneData.salvati) {
                const idLuogo = luoghiMap[salvatoData.nome];
                if (idLuogo) {
                    await createDocumentAutoId("LuogoSalvato", { idUtente: utenteId, idLuogo });
                }
            }

            for (const visitatoData of relazioneData.visitati) {
                const idLuogo = luoghiMap[visitatoData.nome];
                if (idLuogo) {
                    await createDocumentAutoId("LuogoVisitato", { idUtente: utenteId, idLuogo, data: visitatoData.data });
                }
            }

            for (const creatoData of relazioneData.creati) {
                const idLuogo = luoghiMap[creatoData.nome];
                if (idLuogo) {
                    await createDocumentAutoId("LuogoCreato", { idUtente: utenteId, idLuogo });
                }
            }

            for (const recensioneData of relazioneData.recensioni) {
                const idLuogo = luoghiMap[recensioneData.nome];
                if (idLuogo) {
                    await createDocumentAutoId("Recensione", {
                        idUtente: utenteId,
                        idLuogo,
                        description: recensioneData.testo,
                        valuation: recensioneData.valutazione
                    });
                }
            }
        }

        // TODO: rimuovere
        const luanaGmail = "luana@gmail.com";
        const manuelGmail = "julio.manuel@gmail.com";
        const alessandroGmail = "alessandro@gmail.com";
        const teoGmail = "teo@gmail.com";

        const luanaIcloud = "luana@icloud.com";
        const manuelIcloud = "julio.manuel@icloud.com";
        const alessandroIcloud = "alessandro@icloud.com";
        const teoIcloud = "teo@icloud.com";

        await setDoc(doc(db, "Amico", luanaGmail), { friends: [manuelGmail, alessandroGmail, teoGmail] });
        await setDoc(doc(db, "Amico", manuelGmail), { friends: [luanaGmail, alessandroGmail, teoGmail] });
        await setDoc(doc(db, "Amico", alessandroGmail), { friends: [luanaGmail, manuelGmail, teoGmail] });
        await setDoc(doc(db, "Amico", teoGmail), { friends: [luanaGmail, manuelGmail, alessandroGmail] });

        await setDoc(doc(db, "Amico", luanaIcloud), { friends: [manuelIcloud, alessandroIcloud, teoIcloud] });
        await setDoc(doc(db, "Amico", manuelIcloud), { friends: [luanaIcloud, alessandroIcloud, teoIcloud] });
        await setDoc(doc(db, "Amico", alessandroIcloud), { friends: [luanaIcloud, manuelIcloud, teoIcloud] });
        await setDoc(doc(db, "Amico", teoIcloud), { friends: [luanaIcloud, manuelIcloud, alessandroIcloud] });

    } catch (error) {
        console.error("Errore durante il reset del database:", error);
    }
}

/**
 * Cancella tutti i documenti di una collezione.
 */
export async function clearCollection(collectionName) {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnap.id));
    }
    console.log(`Collezione ${collectionName} pulita.`);
}

/**
 * Crea un documento con ID automatico.
 */
export async function createDocumentAutoId(collectionName, data) {
    const newDocRef = await addDoc(collection(db, collectionName), data);
    console.log(`Documento creato in ${collectionName} con ID: ${newDocRef.id}`);
    return newDocRef.id;
}

// Esecuzione automatica del seeder se richiesto (es. tramite vite-node)
if (typeof process !== 'undefined' && process.env.DB_PUSH === 'true') {
    resetAndPopulateDatabase().catch(console.error);
}
