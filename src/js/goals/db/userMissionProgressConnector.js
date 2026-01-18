import {isAuthenticatedUser} from "../goals.js";
import {createDocument, documentFromId} from "./goalsConnector.js";

const USER_MISSION_PROGRESS_COLLECTION = "UserMissionProgress";

export async function createUserMissionProgress(data) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    return await createDocument(USER_MISSION_PROGRESS_COLLECTION, {
        UserId: user.UserId,
        PlaceId: data.PlaceId ?? "",
        MissionTemplateId: data.MissionTemplateId,
        Current: data.Current ?? -1,
        Target: data.Target ?? -1,
        IsCompleted: data.IsCompleted ?? false,
        IsActive: data.IsActive ?? true
    });
}

export async function userMissionProgress(id) {
    return await documentFromId(USER_MISSION_PROGRESS_COLLECTION, id)
}