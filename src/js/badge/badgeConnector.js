import {
    clearDocuments,
    createDocument,
    createDocumentRef,
    documentsFrom,
    documentsOf,
    EMPTY_VALUE,
    isAuthenticatedUser,
    loadDocumentRef,
    updateDocument
} from "../goals/db/goalsConnector.js";
import {ACTION_TYPE, MISSION_TYPE} from "../goals/db/seed/missionTemplateSeed.js";
import {COLLECTIONS} from "../goals/Datas.js";
import {arrayUnion, collection, query, where} from "firebase/firestore";
import {db} from "../firebase.js";

export const BADGE_COLLECTION_STRUCTURE = {
    SPOT_COMPLETED: "SpotCompleted",
    ACTIONS: "Actions",
    MISSIONS_COMPLETED: "MissionsCompleted"
}

export const BADGE_STRUCTURE = {
    OBTAIN_BADGE: "ObtainBadge",
    CAP: "Cap",
    COUNTER: "Counter"
}

export const TEMPLATE_BADGE = {
    [BADGE_STRUCTURE.OBTAIN_BADGE]: [],
    [BADGE_STRUCTURE.CAP]: 5,
    [BADGE_STRUCTURE.COUNTER]: 0,
}

export async function createBadge(userId) {
    const missionsBadge = Object.values(MISSION_TYPE).reduce((acc, key) => {
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
        [BADGE_COLLECTION_STRUCTURE.SPOT_COMPLETED]: [],
        [BADGE_COLLECTION_STRUCTURE.ACTIONS]: actionsBadge,
        [BADGE_COLLECTION_STRUCTURE.MISSIONS_COMPLETED]: missionsBadge
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

export async function currentUserBadge() {
    const user = await isAuthenticatedUser();
    if (!user) return EMPTY_VALUE;
    return (await userBadgeOf(user.id))
}

// Leggere TEMPLATE_BADGE di una chiave specifica
export async function badgeValuesOfCurrentUser(category, key) {
    const badge = await currentUserBadge()
    return badge[category]?.[key] || EMPTY_VALUE;
}

export async function countBadgesObtainedOfCurrentUser() {
    const badge = await currentUserBadge()
    const spotCompleted = badge[BADGE_COLLECTION_STRUCTURE.SPOT_COMPLETED] || []
    const missionsCompleted = badge[BADGE_COLLECTION_STRUCTURE.MISSIONS_COMPLETED] || []
    const actions = badge[BADGE_COLLECTION_STRUCTURE.ACTIONS] || []

    const countedMissions = Object.values(missionsCompleted).reduce((acc, missionBadge) => {
        acc += missionBadge[BADGE_STRUCTURE.OBTAIN_BADGE].length
        return acc;
    }, 0)

    const countedActions = Object.values(actions).reduce((acc, actionBadge) => {
        acc += actionBadge[BADGE_STRUCTURE.OBTAIN_BADGE].length
        return acc;
    }, 0)

    return spotCompleted.length + countedMissions + countedActions
}

// Incrementare il counter di un badge
export async function incrementBadgeCounterOfCurrentUser(category, key, updateFun = (count) => count + 1) {
    const badge = await currentUserBadge()
    const obtainBadge = badge[category]?.[key]?.[BADGE_STRUCTURE.OBTAIN_BADGE]
    const cap = badge[category]?.[key]?.[BADGE_STRUCTURE.CAP]
    const counter = badge[category]?.[key]?.[BADGE_STRUCTURE.COUNTER]
    const updateCounter = updateFun(counter)
    await updateDocument(badge, {[`${category}.${key}.${BADGE_STRUCTURE.COUNTER}`]: updateCounter});

    // voglio aggiungere nella lista dei obtainBadge ogni volta che il counter supera il valore cap
    // ovvero se cap è 5 quando updateCounter diventa 5 lo aggiungo all'array, se diventa 6 no, se diventa 10 lo aggiungo di nuovo
    // pero se aggiorno il counter da 4 a 15 lo aggingo ma anche i valori intermedi 5 e 10 ma se non sono gia presenti
    const newObtainBadges = []
    for (let i = cap; i <= updateCounter; i += cap) {
        if (!obtainBadge.includes(i)) {
            newObtainBadges.push(i)
        }
    }
    if (newObtainBadges.length > 0) {
        const path = `${category}.${key}.${BADGE_STRUCTURE.OBTAIN_BADGE}`
        await updateDocument(badge, {[path]: arrayUnion(...newObtainBadges)});
    }
}

// Leggere tutti gli spot completati
export async function spotCompletedOfCurrentUser() {
    const spotsCompleted = (await currentUserBadge())[BADGE_COLLECTION_STRUCTURE.SPOT_COMPLETED]
    const hydrateSpotsCompleted = spotsCompleted?.map(async spotRef => await loadDocumentRef(spotRef))
    return await Promise.all(hydrateSpotsCompleted);
}

// Aggiungere uno spot completato
export async function addSpotCompletedOfCurrentUser(placeId) {
    const badge = await currentUserBadge()
    const placeRef = createDocumentRef(COLLECTIONS.SPOT, placeId);
    await updateDocument(badge, {[BADGE_COLLECTION_STRUCTURE.SPOT_COMPLETED]: arrayUnion(placeRef)});
}


