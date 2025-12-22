// Eseguire da terminale con:
// node database.js 

import dotenv  from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";

dotenv.config({ path: path.resolve('src/.env') });

// Carica i luoghi dal file JSON
const luoghi = JSON.parse(readFileSync(path.resolve('src/db/json/luoghi.json'), 'utf-8'));

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
    "Utente", "Categoria", "Luogo", "Cartolina", "Missione", "Notifica",
    "Amico", "LuogoVisitato", "LuogoSalvato", "LuogoCreato",
    "Recensione", "CartolinaInviata"
  ];

  // Cancella tutti i documenti
  for (const col of collections) {
    await clearCollection(col);
  }

  console.log("Creazione nuovi record...");

  // --- Creazione record ---
  
  // Utente
  const utenteId = await createDocumentAutoId("Utente", {
    email: "user@example.com",
    username: "user1",
    password: "hashed_password",
    livello: 1
  });

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
  let luogoId;
  for (const luogoData of luoghi) {
    const luogo = {
      ...luogoData,
      idCreatore: luogoData.idCreatore === "master" ? "master" : utenteId
    };
    luogoId = await createDocumentAutoId("Luogo", luogo);
  }

  // Cartolina
  const cartolinaId = await createDocumentAutoId("Cartolina", {
    idUtente: utenteId,
    title: "Cartolina dal Colosseo",
    idLuogo: luogoId,
    date: new Date(),
    description: "Bellissima visita!",
    immagini: ["url_img1", "url_img2"],
    friends: [] // aggiungi amici se vuoi
  });

  // Missione
  await createDocumentAutoId("Missione", {
    idUtente: utenteId,
    idLuogo: luogoId,
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

  // LuogoVisitato
  await createDocumentAutoId("LuogoVisitato", {
    idUtente: utenteId,
    idLuogo: luogoId
  });

  // LuogoSalvato
  await createDocumentAutoId("LuogoSalvato", {
    idUtente: utenteId,
    idLuogo: luogoId
  });

  // LuogoCreato
  await createDocumentAutoId("LuogoCreato", {
    idUtente: utenteId,
    idLuogo: luogoId
  });

  // Recensione
  await createDocumentAutoId("Recensione", {
    idUtente: utenteId,
    idLuogo: luogoId,
    description: "Molto interessante!",
    valuation: 5
  });

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
