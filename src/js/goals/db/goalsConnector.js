import {addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc} from "firebase/firestore";
import {db} from "../../firebase.js";
import {getCurrentUser} from "../../database.js";

export const EMPTY_VALUE = "NONE";

function hasInvalid(...args) {
    return args.some(v => v === undefined || v === null || v === "" || v === EMPTY_VALUE);
}

export async function isAuthenticatedUser() {
    const user = await getCurrentUser();
    if (!user) console.error("Utente non autenticato");
    return user
}

export async function clearDocuments(collectionName) {
    if (hasInvalid(collectionName)) return;

    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletions = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletions);
        console.log("All documents " + collectionName + " cleared.");
    } catch (e) {
        console.error("Error clearing " + collectionName + ": ", e);
    }
}

export async function createDocument(collectionName, data) {
    if (hasInvalid(collectionName, data)) return EMPTY_VALUE;
    try {
        const docRef =
            await addDoc(collection(db, collectionName), data);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document into " + collectionName + ": ", e);
        return EMPTY_VALUE;
    }
}

export async function updateDocument(document, data) {
    if (hasInvalid(document, data)) return false;
    try {
        await updateDoc(document.ref, data);
        return true;
    } catch (e) {
        console.error("Error updating document " + document.id + ": ", e);
        return false;
    }
}

export function createDocumentRef(collectionName, id) {
    if (hasInvalid(collectionName, id)) return EMPTY_VALUE;
    return doc(db, collectionName, id);
}

export async function documentsOf(collectionName) {
    if (hasInvalid(collectionName)) return [];
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({
                id: doc.id,
                ref: doc.ref,
                ...doc.data()
            });
        });
        return documents;
    } catch (e) {
        console.error("Error getting collection " + collectionName + ": ", e);
        return [];
    }
}

export async function documentsFrom(query) {
    if (hasInvalid(query)) return [];
    try {
        const querySnapshot = await getDocs(query);
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({
                id: doc.id,
                ref: doc.ref,
                ...doc.data()
            });
        });
        return documents;
    } catch (e) {
        console.error("Error getting documents from query: ", e);
        return [];
    }
}

export async function loadDocumentRef(documentRef) {
    if (hasInvalid(documentRef)) return EMPTY_VALUE;
    try {
        const doc = (await getDoc(documentRef));
        return {id: doc.id, ref: doc.ref, ...doc.data()};
    } catch (e) {
        console.error("Error loading document " + documentRef.id ?? "NONE" + "ref: ", e);
        return EMPTY_VALUE;
    }
}

export async function documentsFiltered(collectionName, filterFn) {
    return (await documentsOf(collectionName)).filter(filterFn);
}

export async function documentFromId(collectionName, id) {
    const firstItem = (await documentsFiltered(collectionName, document => document.id === id))[0];
    return firstItem ? firstItem : EMPTY_VALUE;
}
