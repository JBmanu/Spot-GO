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
 * Funzione di seeder per sincronizzare il database in modo incrementale.
 * Aggiunge solo i record mancanti senza cancellare quelli esistenti.
 */
export async function resetAndPopulateDatabase() {
    if (typeof window !== 'undefined') {
        console.error("resetAndPopulateDatabase può essere eseguita solo lato server/CLI.");
        return;
    }

    try {
        const { readFileSync } = await import('fs');
        const path = await import('path');
        const { setDoc, doc, getDocs, collection, query, where, limit } = await import('firebase/firestore');

        console.log("Sincronizzazione del database...");

        // Percorsi assoluti risolti rispetto alla radice del progetto
        const rootDir = process.cwd();
        const readJson = (file) => JSON.parse(readFileSync(path.join(rootDir, 'src/db/json', file), 'utf-8'));

        const luoghi = readJson('luoghi.json');
        const utenti = readJson('utenti.json');
        const relazioniUtentiLuoghi = readJson('relazioni_utenti.json');

        console.log("Sincronizzazione utenti...");
        const utentiMap = {};
        for (const utenteData of utenti) {
            const id = utenteData.email;
            // setDoc con merge: true preserva i dati extra (es. amici aggiunti dall'app)
            await setDoc(doc(db, "Utente", id), utenteData, { merge: true });
            utentiMap[utenteData.username] = id;
            console.log(`Utente sincronizzato: ${utenteData.username} (${id})`);
        }

        console.log("Sincronizzazione luoghi (check esistenza per nome)...");
        const luoghiMap = {};
        for (const luogoData of luoghi) {
            // Cerchiamo se esiste già uno spot con lo stesso nome
            const q = query(collection(db, "Luogo"), where("nome", "==", luogoData.nome), limit(1));
            const querySnapshot = await getDocs(q);

            let luogoId;
            if (!querySnapshot.empty) {
                luogoId = querySnapshot.docs[0].id;
                console.log(`Luogo già esistente: ${luogoData.nome} (ID: ${luogoId})`);
                // Opzionale: update dei dati se necessario
                await setDoc(doc(db, "Luogo", luogoId), luogoData, { merge: true });
            } else {
                const idCreatore = luogoData.idCreatore === "master" ? "master" : (utentiMap[luogoData.idCreatore] || utentiMap["paperino"]);
                const nuovoLuogo = {
                    ...luogoData,
                    idCreatore: idCreatore
                };
                luogoId = await createDocumentAutoId("Luogo", nuovoLuogo);
                console.log(`Nuovo luogo creato: ${luogoData.nome} (ID: ${luogoId})`);
            }
            luoghiMap[luogoData.nome] = luogoId;
        }

        // Cartolina e Missione demo (ID deterministici per evitare duplicati in sync ripetuti)
        const paperinoId = utentiMap["paperino"];
        if (paperinoId && luoghiMap["Colosseo"]) {
            const cartolinaId = `demo_cartolina_${paperinoId}`;
            await setDoc(doc(db, "Cartolina", cartolinaId), {
                idUtente: paperinoId,
                title: "Cartolina dal Colosseo",
                idLuogo: luoghiMap["Colosseo"],
                date: new Date().toISOString(),
                description: "Bellissima visita!",
                immagini: ["url_img1", "url_img2"],
                friends: []
            }, { merge: true });

            const missioneId = `demo_missione_${paperinoId}`;
            await setDoc(doc(db, "Missione", missioneId), {
                idUtente: paperinoId,
                idLuogo: luoghiMap["Colosseo"],
                type: "visita",
                progressione: 0,
                obiettivo: 1,
                completata: false
            }, { merge: true });
        }

        console.log("Sincronizzazione relazioni (Salvati, Visitati, Recensioni)...");
        for (const relazioneData of relazioniUtentiLuoghi) {
            const utenteId = utentiMap[relazioneData.username];
            if (!utenteId) continue;

            for (const salvatoData of relazioneData.salvati) {
                const idLuogo = luoghiMap[salvatoData.nome];
                if (idLuogo) {
                    const docId = `${utenteId}_${idLuogo}`;
                    await setDoc(doc(db, "LuogoSalvato", docId), {
                        idUtente: utenteId,
                        idLuogo,
                        dataSalvataggio: new Date().toISOString()
                    }, { merge: true });
                }
            }

            for (const visitatoData of relazioneData.visitati) {
                const idLuogo = luoghiMap[visitatoData.nome];
                if (idLuogo) {
                    const docId = `${utenteId}_${idLuogo}`;
                    await setDoc(doc(db, "LuogoVisitato", docId), {
                        idUtente: utenteId,
                        idLuogo,
                        data: visitatoData.data
                    }, { merge: true });
                }
            }

            for (const creatoData of relazioneData.creati) {
                const idLuogo = luoghiMap[creatoData.nome];
                if (idLuogo) {
                    const docId = `${utenteId}_${idLuogo}`;
                    await setDoc(doc(db, "LuogoCreato", docId), { idUtente: utenteId, idLuogo }, { merge: true });
                }
            }

            for (const recensioneData of relazioneData.recensioni) {
                const idLuogo = luoghiMap[recensioneData.nome];
                if (idLuogo) {
                    const docId = `${utenteId}_${idLuogo}`;
                    await setDoc(doc(db, "Recensione", docId), {
                        idUtente: utenteId,
                        idLuogo,
                        description: recensioneData.testo,
                        valuation: recensioneData.valutazione
                    }, { merge: true });
                }
            }
        }

        // Amicizie fisse (NEL CASO DA RIMUOVERE)
        const emails = {
            luanaG: "luana@gmail.com",
            manuelG: "julio.manuel@gmail.com",
            aleG: "alessandro@gmail.com",
            teoG: "teo@gmail.com",
            luanaI: "luana@icloud.com",
            manuelI: "julio.manuel@icloud.com",
            aleI: "alessandro@icloud.com",
            teoI: "teo@icloud.com"
        };

        const syncFriends = async (email, friendList) => {
            await setDoc(doc(db, "Amico", email), { friends: friendList }, { merge: true });
        };

        await syncFriends(emails.luanaG, [emails.manuelG, emails.aleG, emails.teoG]);
        await syncFriends(emails.manuelG, [emails.luanaG, emails.aleG, emails.teoG]);
        await syncFriends(emails.aleG, [emails.luanaG, emails.manuelG, emails.teoG]);
        await syncFriends(emails.teoG, [emails.luanaG, emails.manuelG, emails.aleG]);

        await syncFriends(emails.luanaI, [emails.manuelI, emails.aleI, emails.teoI]);
        await syncFriends(emails.manuelI, [emails.luanaI, emails.aleI, emails.teoI]);
        await syncFriends(emails.aleI, [emails.luanaI, emails.manuelI, emails.teoI]);
        await syncFriends(emails.teoI, [emails.luanaI, emails.manuelI, emails.aleI]);

        console.log("Database sincronizzato completato!");
    } catch (error) {
        console.error("Errore durante la sincronizzazione del database:", error);
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
