import {
    clearDocuments,
    createDocument,
    createDocumentRef,
    documentFromId,
    documentsFrom,
    EMPTY_VALUE,
    isAuthenticatedUser,
    loadDocumentRef,
    updateDocument
} from "./goalsConnector.js";
import {arrayUnion, collection, query, Timestamp, where} from "firebase/firestore";
import {db} from "../../firebase.js";
import {MISSION_TEMPLATE_COLLECTION} from "./missionTemplateConnector.js";
import {MISSION_TYPE} from "./seed/missionTemplateSeed.js";

const USER_MISSION_PROGRESS_COLLECTION = "UserMissionProgress";

async function createMissionProgressByType(data, create, update) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    const userRef = createDocumentRef("Utente", data.UserId);
    const placeRef = createDocumentRef("Luogo", data.PlaceId);
    const missionTemplateRef = createDocumentRef(MISSION_TEMPLATE_COLLECTION, data.MissionTemplateId);

    const newMission = {
        UserRef: userRef,
        PlaceRef: placeRef,
        MissionTemplateRef: missionTemplateRef,
        Current: data.Current ?? 0,
        IsCompleted: data.IsCompleted ?? false,
        IsActive: data.IsActive ?? true,
        CreatedAt: Timestamp.fromDate(new Date())
    };

    const emptyMissionStructure = {
        [MISSION_TYPE.SPOT]: [], [MISSION_TYPE.DAILY]: [], [MISSION_TYPE.THEME]: [], [MISSION_TYPE.LEVEL]: []
    };

    const userMissions = await missionsProgressByUser(data.UserId)

    if (!userMissions) {
        return await createDocument(USER_MISSION_PROGRESS_COLLECTION,
            {UserRef: userRef, Missions: {...emptyMissionStructure, ...create(newMission)}});
    } else {
        return await updateDocument(userMissions, update(newMission));
    }
}


export async function createSpotUserMissionProgress(data) {
    return await createMissionProgressByType(data,
        (newMission) => ({
            [MISSION_TYPE.SPOT]: {[data.PlaceId]: [newMission]}
        }),
        (newMission) => ({
            [`Missions.${MISSION_TYPE.SPOT}.${data.PlaceId}`]: arrayUnion(newMission)
        }))
}

export async function createDailyUserMissionProgress(data) {
    return await createMissionProgressByType(data,
        (newMission) => ({[MISSION_TYPE.DAILY]: [newMission]}),
        (newMission) => ({[`Missions.${MISSION_TYPE.DAILY}`]: arrayUnion(newMission)}))
}

export async function createThemeUserMissionProgress(data) {
    return await createMissionProgressByType(data,
        (newMission) => ({[MISSION_TYPE.THEME]: [newMission]}),
        (newMission) => ({[`Missions.${MISSION_TYPE.THEME}`]: arrayUnion(newMission)}))
}

export async function createLevelUserMissionProgress(data) {
    return await createMissionProgressByType(data,
        (newMission) => ({[MISSION_TYPE.LEVEL]: [newMission]}),
        (newMission) => ({[`Missions.${MISSION_TYPE.LEVEL}`]: arrayUnion(newMission)}))
}

export async function clearUserMissionProgress() {
    await clearDocuments(USER_MISSION_PROGRESS_COLLECTION)
}

export async function userMissionProgress(id) {
    return await documentFromId(USER_MISSION_PROGRESS_COLLECTION, id)
}

export async function missionsProgressByUser(userId) {
    const userRef = createDocumentRef("Utente", userId);
    const documents = await documentsFrom(query(
        collection(db, USER_MISSION_PROGRESS_COLLECTION),
        where("UserRef", "==", userRef)
    ));
    return documents[0]
}


export async function missionsProgressByCurrentUser() {
    const user = await isAuthenticatedUser();
    if (!user) return EMPTY_VALUE;
    return (await missionsProgressByUser(user.id))
}

export async function missionsProgressByCurrentUserAnd(type) {
    const userMissions = await missionsProgressByCurrentUser()
    return userMissions?.Missions[type]
}



async function userSpotMissionsGroupByPlaceAnd(isActive) {
    const activeSpotMissions = (await missionsProgressByCurrentUserAnd(MISSION_TYPE.SPOT));
    const result = Object.entries(activeSpotMissions)
        .filter(([, missions]) => missions.every(m => m.IsActive === isActive))
        .map(async ([_, missions]) => {
            const placeDocument = (await loadDocumentRef(missions[0].PlaceRef));
            const detailsMission = missions.map(async mission => {
                const userDocument = (await loadDocumentRef(mission.UserRef));
                const missionTemplateDocument = (await loadDocumentRef(mission.MissionTemplateRef));
                return {
                    user: userDocument !== EMPTY_VALUE && {id: userDocument.id, ...userDocument.data()},
                    place: placeDocument !== EMPTY_VALUE && {id: placeDocument.id, ...placeDocument.data()},
                    template: missionTemplateDocument.data(),
                    progress: mission,
                }
            })

            const resolvedMissions = await Promise.all(detailsMission);
            return {
                place: placeDocument !== EMPTY_VALUE && {id: placeDocument.id, ...placeDocument.data()},
                missions: resolvedMissions
            }
        })

    return await Promise.all(result);
}

export async function activeSpotMissionProgressByUser() {
    return await userSpotMissionsGroupByPlaceAnd(true)
}

export async function inactiveSpotMissionsProgressByUser() {
    return await userSpotMissionsGroupByPlaceAnd(false)
}