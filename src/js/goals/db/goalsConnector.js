import {addDoc, collection, deleteDoc, doc, getDoc, getDocs} from "firebase/firestore";
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

export async function createDocumentRef(collectionName, id) {
    if (hasInvalid(collectionName, id)) return EMPTY_VALUE;
    try {
        return (await doc(db, collectionName, id));
    } catch (e) {
        console.error("Error building document ref for " + collectionName + " with id " + id + ": ", e);
        return EMPTY_VALUE;
    }
}

export async function documents(collectionName) {
    if (hasInvalid(collectionName)) return [];
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

export async function loadDocumentRef(documentRef) {
    if (hasInvalid(documentRef)) return EMPTY_VALUE;
    try {
        return (await getDoc(documentRef));
    } catch (e) {
        console.error("Error loading document " + documentRef.id ?? "NONE" + "ref: ", e);
        return EMPTY_VALUE;
    }
}

export async function documentsFiltered(collectionName, filterFn) {
    return (await documents(collectionName)).filter(filterFn);
}

export async function documentFromId(collectionName, id) {
    const firstItem = (await documentsFiltered(collectionName, document => document.id === id))[0];
    return firstItem ? firstItem : EMPTY_VALUE;
}

