import {clearDocuments, createDocument, documentFromId, isAuthenticatedUser} from "./goalsConnector.js";

const USER_MISSION_PROGRESS_COLLECTION = "UserMissionProgress";

export async function createUserMissionProgress(data) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    return await createDocument(USER_MISSION_PROGRESS_COLLECTION, {
        UserId: data.UserId ?? "",
        PlaceId: data.PlaceId ?? "",
        MissionTemplateId: data.MissionTemplateId ?? "",
        Current: 0,
        IsCompleted: false,
        IsActive: true
    });
}

export async function clearUserMissionProgress() {
    await clearDocuments(USER_MISSION_PROGRESS_COLLECTION)
}

export async function userMissionProgress(id) {
    return await documentFromId(USER_MISSION_PROGRESS_COLLECTION, id)
}