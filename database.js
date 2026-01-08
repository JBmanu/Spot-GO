// Eseguire da terminale con:
// node database.js 

import dotenv  from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";

dotenv.config({ path: path.resolve('src/.env') });

// Carica da file JSON
const luoghi = JSON.parse(readFileSync(path.resolve('src/db/json/luoghi.json'), 'utf-8'));
const utenti = JSON.parse(readFileSync(path.resolve('src/db/json/utenti.json'), 'utf-8'));
const relazioniUtentiLuoghi = JSON.parse(readFileSync(path.resolve('src/db/json/relazioni_utenti.json'), 'utf-8'));

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// console.log("Variabili env caricate correttamente?", {
//     apiKey: process.env.VITE_FIREBASE_API_KEY ? "Si" : "No",
//     authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? "Si" : "No",
//     projectId: process.env.VITE_FIREBASE_PROJECT_ID ? "Si" : "No",
//     storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ? "Si" : "No",
//     messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "Si" : "No",
//     appId: process.env.VITE_FIREBASE_APP_ID ? "Si" : "No",
// });

// Inizializza Firebase
let db;
let app;
let auth;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Configurazione incompleta! Controlla .env file.");
    console.error("Decommenta il log delle variabili d'ambiente per il debug.");
} else {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        window.firebaseApp = app;
        window.db = db;
        window.firebaseAuth = auth;

        console.log("Firebase inizializzato correttamente!");
    } catch (error) {
        console.error("ERRORE di configurazione in Firebase!", error);
    }
}

// --- Funzione helper per cancellare tutti i documenti di una collezione ---
async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id));
  }
  console.log(`Collezione ${collectionName} pulita.`);
}

// --- Funzione helper per creare documenti con ID automatico ---
async function createDocumentAutoId(collectionName, data) {
  const newDocRef = doc(collection(db, collectionName)); // ID automatico
  await setDoc(newDocRef, data);
  console.log(`Documento creato in ${collectionName} con ID: ${newDocRef.id}`);
  return newDocRef.id;
}

// --- Funzione principale ---
async function resetAndPopulateDatabase() {
  console.log("Cancellazione dati esistenti...");
  
  // Lista delle collezioni da resettare
  const collections = [
    "Categoria", "Luogo", "Cartolina", "Missione", "Notifica",
    "Amico", "LuogoVisitato", "LuogoSalvato", "LuogoCreato",
    "Recensione", "CartolinaInviata"
  ];

  // Cancella tutti i documenti
  for (const col of collections) {
    await clearCollection(col);
  }

  console.log("Creazione nuovi record...");

  // --- Creazione record ---
  
  // Utenti - caricati da src/db/json/utenti.json
  let utenteId;
  for (const utenteData of utenti) {
    utenteId = await createDocumentAutoId("Utente", utenteData);
  }

  // Categorie
  const categorieCulture = await createDocumentAutoId("Categoria", {
    nome: "culture"
  });
  const categoriFood = await createDocumentAutoId("Categoria", {
    nome: "food"
  });
  const categorieNature = await createDocumentAutoId("Categoria", {
    nome: "nature"
  });
  const categorieMystery = await createDocumentAutoId("Categoria", {
    nome: "mystery"
  });

  // Luoghi - caricati da src/db/json/luoghi.json
  const luoghiMap = {}; // Map per associare nome luogo a ID
  let luogoId;
  for (const luogoData of luoghi) {
    const luogo = {
      ...luogoData,
      idCreatore: luogoData.idCreatore === "master" ? "master" : utenteId
    };
    luogoId = await createDocumentAutoId("Luogo", luogo);
    luoghiMap[luogoData.nome] = luogoId;
  }

  // Cartolina
  const cartolinaId = await createDocumentAutoId("Cartolina", {
    idUtente: utenteId,
    title: "Cartolina dal Colosseo",
    idLuogo: luoghiMap["Colosseo"],
    date: new Date(),
    description: "Bellissima visita!",
    immagini: ["url_img1", "url_img2"],
    friends: [] // aggiungi amici se vuoi
  });

  // Missione
  await createDocumentAutoId("Missione", {
    idUtente: utenteId,
    idLuogo: luoghiMap["Colosseo"],
    type: "visita",
    progressione: 0,
    obiettivo: 1,
    completata: false
  });

  // Notifica
  await createDocumentAutoId("Notifica", {
    idUtente: utenteId,
    title: "Nuova missione disponibile",
    description: "Visita il Colosseo per guadagnare punti!",
    type: "mission",
    alreadySeen: false
  });

  // Amico
  await createDocumentAutoId("Amico", {
    id: utenteId,
    friends: []
  });

  // Carica relazioni da file JSON
  for (const relazioneData of relazioniUtentiLuoghi) {
    const utenteRelazione = utenti.find(u => u.username === relazioneData.username);
    if (!utenteRelazione) continue;

    // Recupera l'ID dell'utente dal database (o usa il primo creato se è paperino)
    let utenteRelazioneId = utenteId;
    if (relazioneData.username !== "paperino") {
      // Se non è paperino, cerca negli utenti creati
      // Per ora useremo utenteId che è l'ultimo creato
    }

    // LuogoSalvato
    for (const salvatoData of relazioneData.salvati) {
      const idLuogoSalvato = luoghiMap[salvatoData.nome];
      if (idLuogoSalvato) {
        await createDocumentAutoId("LuogoSalvato", {
          idUtente: utenteRelazioneId,
          idLuogo: idLuogoSalvato
        });
      }
    }

    // LuogoVisitato
    for (const visitatoData of relazioneData.visitati) {
      const idLuogoVisitato = luoghiMap[visitatoData.nome];
      if (idLuogoVisitato) {
        await createDocumentAutoId("LuogoVisitato", {
          idUtente: utenteRelazioneId,
          idLuogo: idLuogoVisitato,
          data: visitatoData.data
        });
      }
    }

    // LuogoCreato
    for (const creatoData of relazioneData.creati) {
      const idLuogoCreato = luoghiMap[creatoData.nome];
      if (idLuogoCreato) {
        await createDocumentAutoId("LuogoCreato", {
          idUtente: utenteRelazioneId,
          idLuogo: idLuogoCreato
        });
      }
    }

    // Recensione
    for (const recensioneData of relazioneData.recensioni) {
      const idLuogoRecensione = luoghiMap[recensioneData.nome];
      if (idLuogoRecensione) {
        await createDocumentAutoId("Recensione", {
          idUtente: utenteRelazioneId,
          idLuogo: idLuogoRecensione,
          description: recensioneData.testo,
          valuation: recensioneData.valutazione
        });
      }
    }
  }

  // CartolinaInviata
  await createDocumentAutoId("CartolinaInviata", {
    idCartolina: cartolinaId,
    mittente: utenteId,
    destinatario: "" // aggiungi destinatario se vuoi
  });

  console.log("Database completamente rigenerato!");
}

// --- Esegui ---
resetAndPopulateDatabase().catch(console.error);
