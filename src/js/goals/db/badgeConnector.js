import {
    clearDocuments,
    createDocument,
    createDocumentRef,
    documentFromId,
    documentsFrom,
    documentsOf, EMPTY_VALUE, isAuthenticatedUser, loadDocumentRef, updateDocument
} from "./goalsConnector.js";
import {ACTION_TYPE, MISSION_TYPE} from "./seed/missionTemplateSeed.js";
import {COLLECTIONS} from "../Datas.js";
import {arrayUnion, collection, query, where} from "firebase/firestore";
import {db} from "../../firebase.js";

export const TEMPLATE_BADGE = {Counter: 0, Badge: []}

export async function createBadge(userId) {
    const missionsBadge = Object.keys(MISSION_TYPE).reduce((acc, key) => {
        acc[key] = TEMPLATE_BADGE
        return acc;
    }, {});
    const actionsBadge = Object.keys(ACTION_TYPE).reduce((acc, key) => {
        acc[key] = TEMPLATE_BADGE
        return acc;
    }, {})

    const userRef = createDocumentRef(COLLECTIONS.USER, userId);
    return await createDocument(COLLECTIONS.BADGE, {
        UserId: userId,
        UserRef: userRef,
        SpotCompleted: [],
        Actions: actionsBadge,
        MissionsCompleted: missionsBadge
    })
}

export async function clearBadges() {
    await clearDocuments(COLLECTIONS.BADGE)
}

export async function badges() {
    return await documentsOf(COLLECTIONS.BADGE);
}

async function userBadgeOf(userId) {
    const documents = await documentsFrom(query(
        collection(db, COLLECTIONS.BADGE),
        where("UserId", "==", userId)
    ));
    return documents[0]
}

async function currentUserBadge() {
    const user = await isAuthenticatedUser();
    if (!user) return EMPTY_VALUE;
    return (await userBadgeOf(user.id))
}

// Leggere TEMPLATE_BADGE di una chiave specifica
export async function badgeValuesOfCurrentUser(category, key) {
    // category = "Actions" | "MissionsCompleted"
    const badge = await currentUserBadge()
    return badge[category]?.[key] || EMPTY_VALUE;
}

// Incrementare il counter di un badge
export async function incrementBadgeCounterOfCurrentUser(category, key, updateFun = (count) => count + 1) {
    const badge = await currentUserBadge()
    const newCounter = badge[category]?.[key]?.[`Counter`]
    await updateDocument(badge, {[`${category}.${key}.Counter`]: updateFun(newCounter)});
    // mettere cap per aggiungere all'array
    // await updateDocument(badge, {[`${category}.${key}.Badge`]: arrayUnion(amount)});
}

// Leggere tutti gli spot completati
export async function spotCompletedOfCurrentUser() {
    const badge = await currentUserBadge()
    const hydrateSpotsCompleted = badge[`SpotCompleted`]?.map(async spotRef => {
        return (await loadDocumentRef(spotRef))
    })
    return await Promise.all(hydrateSpotsCompleted);
}

// Aggiungere uno spot completato
export async function addSpotCompletedOfCurrentUser(placeId) {
    const badge = await currentUserBadge()
    const placeRef = createDocumentRef(COLLECTIONS.SPOT, placeId);
    await updateDocument(badge, {[`SpotCompleted`]: arrayUnion(placeRef)});
}


