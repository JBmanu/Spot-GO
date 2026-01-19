import {
    buildDocumentRef,
    clearDocuments,
    createDocument,
    documentFromId,
    documents,
    isAuthenticatedUser
} from "./goalsConnector.js";
import {getDoc, Timestamp} from "firebase/firestore";
import {MISSION_TEMPLATE_COLLECTION} from "./missionTemplateConnector.js";
import {MISSION_TYPE} from "./seed/missionTemplateSeed.js";

const USER_MISSION_PROGRESS_COLLECTION = "UserMissionProgress";

export async function createUserMissionProgress(data) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    const userRef = await buildDocumentRef("Utente", data.UserId ?? "");
    const placeRef = await buildDocumentRef("Luogo", data.PlaceId ?? "");
    const missionTemplateRef = await buildDocumentRef(MISSION_TEMPLATE_COLLECTION, data.MissionTemplateId ?? "");

    return await createDocument(USER_MISSION_PROGRESS_COLLECTION, {
        UserRef: userRef ?? "",
        PlaceRef: placeRef ?? "",
        MissionTemplateRef: missionTemplateRef ?? "",
        Current: data.Current ?? 0,
        IsCompleted: data.IsCompleted ?? false,
        IsActive: data.IsActive ?? true,
        CreatedAt: Timestamp.fromDate(new Date())
    });
}

export async function clearUserMissionProgress() {
    await clearDocuments(USER_MISSION_PROGRESS_COLLECTION)
}

export async function userMissionProgresses() {
    const userMissions = (await documents(USER_MISSION_PROGRESS_COLLECTION))
    const detailedMissions = []

    for (let mission of userMissions) {
        const userDocument = await getDoc(mission.UserRef)
        const placeDocument = await getDoc(mission.PlaceRef)
        const missionTemplateDocument = await getDoc(mission.MissionTemplateRef)

        detailedMissions.push({
            user: {id: userDocument.id, ...userDocument.data() ?? ""},
            place: {id: placeDocument.id, ...placeDocument.data() ?? ""},
            missionTemplate: missionTemplateDocument.data() ?? "",
            missionProgress: mission,
        })
    }

    return detailedMissions
}

export async function userMissionProgress(id) {
    return await documentFromId(USER_MISSION_PROGRESS_COLLECTION, id)
}

export async function spotMissionProgressByUser() {
    const user = (await isAuthenticatedUser())
    return (await userMissionProgresses())
        .filter(data => data.user.email === user.id && data.missionTemplate.Type === MISSION_TYPE.SPOT)
}

export async function activeSpotMissionProgressByUser() {
    return (await spotMissionProgressByUser()).filter(data => data.missionProgress.IsActive)
}

export async function inactiveSpotMissionsProgressByUser() {
    const inactiveSpotMissions = (await spotMissionProgressByUser()).filter(data => !data.missionProgress.IsActive)
    return inactiveSpotMissions.reduce((acc, mission) => {
        const placeId = mission.place.id;
        const group = acc.find(g => g.place.id === placeId);
        group ? group.missions.push(mission) : acc.push({place: mission.place, missions: [mission]})
        return acc;
    }, [])
}