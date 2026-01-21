import {clearDocuments, createDocument, documentFromId, documentsOf} from "./goalsConnector.js";

const BADGES_COLLECTION = "Badge";

export async function createBadge(data) {
    return await createDocument(BADGES_COLLECTION, {
        Name: data.Name,
        Description: data.Description,
        Icon: data.Icon ?? "",
        UnlockConditionType: data.UnlockConditionType,
        UnlockValue: data.UnlockValue
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

