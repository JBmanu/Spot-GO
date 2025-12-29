/**
 * Configurazione e inizializzazione di Firebase.
 */

import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// console.log("Variabili env caricate correttamente?", {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Si" : "No",
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "Si" : "No",
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Si" : "No",
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "Si" : "No",
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "Si" : "No",
//     appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Si" : "No",
// });

let app = null;
let db = null;
let auth = null;

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
    } catch (error) {
        console.error("ERRORE di configurazione in Firebase!", error);
    }
}

export { db };
