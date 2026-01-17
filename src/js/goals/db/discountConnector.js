import {addDoc, collection, deleteDoc, doc, getDoc, getDocs} from "firebase/firestore";
import {db} from "../../firebase.js";

const DISCOUNT_COLLECTION = "Discount";

export async function clearDiscounts() {
    try {
        const querySnapshot = await getDocs(collection(db, DISCOUNT_COLLECTION));
        const deletions = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletions);
        console.log("All discount cleared.");
    } catch (e) {
        console.error("Error clearing discounts: ", e);
    }
}

export async function createDiscount(data) {
    try {
        const docRef =
            await addDoc(collection(db, DISCOUNT_COLLECTION), {
                Name: data.Name,
                PlaceId: data.Description ?? "",
                Percentage: data.Percentage ?? null,
                Amount: data.Amount ?? null
            });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        return null;
    }
}

export async function discount(id) {
    const ref = doc(db, DISCOUNT_COLLECTION, id);
    const snap = await getDoc(ref);
    return snap.exists() ? {id: snap.id, ...snap.data()} : null;
}