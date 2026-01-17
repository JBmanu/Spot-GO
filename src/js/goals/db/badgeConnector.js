import {addDoc, collection, deleteDoc, doc, getDoc, getDocs} from "firebase/firestore";
import {db} from "../../firebase.js";

const BADGES_COLLECTION = "Badge";

export async function clearBadges() {
    try {
        const querySnapshot = await getDocs(collection(db, BADGES_COLLECTION));
        const deletions = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletions);
        console.log("All badges cleared.");
    } catch (e) {
        console.error("Error clearing badges: ", e);
    }
}

export async function createBadge(data) {
    try {
        const docRef =
            await addDoc(collection(db, BADGES_COLLECTION), {
                Name: data.Name,
                Description: data.Description,
                Icon: data.Icon ?? "",
                UnlockConditionType: data.UnlockConditionType,
                UnlockValue: data.UnlockValue
            });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        return null;
    }
}

export async function badges() {
    try {
        const querySnapshot = await getDocs(collection(db, BADGES_COLLECTION));
        const badges = [];
        querySnapshot.forEach((doc) => {
            badges.push({id: doc.id, ...doc.data()});
        });
        return badges;
    } catch (e) {
        console.error("Error getting documents: ", e);
        return [];
    }
}

export async function badge(id) {
    const ref = doc(db, BADGES_COLLECTION, id);
    const snap = await getDoc(ref);
    return snap.exists() ? {id: snap.id, ...snap.data()} : null;
}

