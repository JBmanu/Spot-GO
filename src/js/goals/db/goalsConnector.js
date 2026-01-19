import {addDoc, collection, deleteDoc, doc, getDocs} from "firebase/firestore";
import {db} from "../../firebase.js";
import {getCurrentUser} from "../../database.js";

export async function isAuthenticatedUser() {
    const user = await getCurrentUser();
    if (!user) console.error("Utente non autenticato");
    return user
}

export async function createDocument(collectionName, data) {
    try {
        const docRef =
            await addDoc(collection(db, collectionName), data);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document into " + collectionName + ": ", e);
        return null;
    }
}

export async function clearDocuments(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletions = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletions);
        console.log("All documents " + collectionName + " cleared.");
    } catch (e) {
        console.error("Error clearing " + collectionName + ": ", e);
    }
}

export async function documents(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({id: doc.id, ...doc.data()});
        });
        return documents;
    } catch (e) {
        console.error("Error getting collection " + collectionName + ": ", e);
        return [];
    }
}

export async function buildDocumentRef(collectionName, id) {
    return (await doc(db, collectionName, id));
}

export async function documentsFiltered(collectionName, filterFn) {
    return (await documents(collectionName)).filter(filterFn);
}

export async function documentFromId(collectionName, id) {
    return (await documentsFiltered(collectionName, document => document.id === id))[0];
}

