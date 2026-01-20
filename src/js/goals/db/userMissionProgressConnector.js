import {
    buildDocumentRef,
    clearDocuments,
    createDocument,
    documentFromId,
    documents,
    EMPTY_VALUE,
    isAuthenticatedUser,
    loadDocumentRef
} from "./goalsConnector.js";
import {Timestamp} from "firebase/firestore";
import {MISSION_TEMPLATE_COLLECTION} from "./missionTemplateConnector.js";
import {MISSION_TYPE} from "./seed/missionTemplateSeed.js";

const USER_MISSION_PROGRESS_COLLECTION = "UserMissionProgress";

export async function createUserMissionProgress(data) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    const userRef = await buildDocumentRef("Utente", data.UserId);
    const placeRef = await buildDocumentRef("Luogo", data.PlaceId);
    const missionTemplateRef = await buildDocumentRef(MISSION_TEMPLATE_COLLECTION, data.MissionTemplateId);

    return await createDocument(USER_MISSION_PROGRESS_COLLECTION, {
        UserRef: userRef,
        PlaceRef: placeRef,
        MissionTemplateRef: missionTemplateRef,
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
        let userDocument = await loadDocumentRef(mission.UserRef)
        let placeDocument = await loadDocumentRef(mission.PlaceRef)
        const missionTemplateDocument = await loadDocumentRef(mission.MissionTemplateRef)

        detailedMissions.push({
            user: userDocument !== EMPTY_VALUE && {id: userDocument.id, ...userDocument.data()},
            place: placeDocument !== EMPTY_VALUE && {id: placeDocument.id, ...placeDocument.data()},
            template: missionTemplateDocument.data(),
            progress: mission,
        })
    }

    return detailedMissions
}

export async function userMissionProgress(id) {
    return await documentFromId(USER_MISSION_PROGRESS_COLLECTION, id)
}

export async function missionsProgressByUserAnd(type) {
    const user = (await isAuthenticatedUser())
    return (await userMissionProgresses())
        .filter(data => data.user.id === user.id && data.template.Type === type)
}

export async function activeSpotMissionProgressByUser() {
    return (await missionsProgressByUserAnd(MISSION_TYPE.SPOT)).filter(data => data.progress.IsActive)
}

export async function inactiveSpotMissionsProgressByUser() {
    const inactiveSpotMissions = (await missionsProgressByUserAnd(MISSION_TYPE.SPOT))
        .filter(data => !data.progress.IsActive)
    return inactiveSpotMissions.reduce((acc, mission) => {
        const placeId = mission.place.id;
        const group = acc.find(g => g.place.id === placeId);
        group ? group.missions.push(mission) : acc.push({place: mission.place, missions: [mission]})
        return acc;
    }, [])
}