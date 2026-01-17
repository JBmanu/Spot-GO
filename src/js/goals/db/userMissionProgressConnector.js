import {addDoc, collection, doc, getDoc} from "firebase/firestore";
import {db} from "../../firebase.js";


import {isAuthenticatedUser} from "../goals.js";

const USER_MISSION_PROGRESS_COLLECTION = "UserMissionProgress";

export async function createUserMissionProgress(data) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    try {
        const docRef =
            await addDoc(collection(db, USER_MISSION_PROGRESS_COLLECTION), {
                UserId: user.UserId,
                MissionTemplateId: data.MissionTemplateId,
                PlaceId: data.PlaceId ?? "",
                Current: data.Current ?? 0,
                IsCompleted: data.IsCompleted ?? false,
                IsActive: data.IsActive ?? true
            });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
}

export async function userMissionProgress(id) {
    const ref = doc(db, USER_MISSION_PROGRESS_COLLECTION, id);
    const snap = await getDoc(ref);
    return snap.exists() ? {id: snap.id, ...snap.data()} : null;
}