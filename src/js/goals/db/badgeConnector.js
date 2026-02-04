import {clearDocuments, createDocument, createDocumentRef, documentFromId, documentsOf} from "./goalsConnector.js";
import {ACTION_TYPE, MISSION_TYPE} from "./seed/missionTemplateSeed.js";
import {COLLECTIONS} from "../Datas.js";

const BADGES_COLLECTION = "Badge";

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
    return await createDocument(BADGES_COLLECTION, {
        UserId: userId,
        UserRef: userRef,
        MissionsCompleted: missionsBadge,
        Actions: actionsBadge
    })
}

export async function clearBadges() {
    await clearDocuments(BADGES_COLLECTION)
}

export async function badges() {
    return await documentsOf(BADGES_COLLECTION);
}

export async function badge(id) {
    return await documentFromId(BADGES_COLLECTION, id);
}

