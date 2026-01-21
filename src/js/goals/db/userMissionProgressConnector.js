import {
    clearDocuments,
    createDocument,
    createDocumentRef,
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

async function createMissionProgress(data, create, update) {
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

    const userMissions = await userMissionsOf(data.UserId)

    if (!userMissions) {
        return await createDocument(USER_MISSION_PROGRESS_COLLECTION,
            {UserRef: userRef, Missions: {...emptyMissionStructure, ...create(newMission)}});
    } else {
        return await updateDocument(userMissions, update(newMission));
    }
}

export async function createSpotMission(data) {
    return await createMissionProgress(data,
        (newMission) => ({
            [MISSION_TYPE.SPOT]: {[data.PlaceId]: [newMission]}
        }),
        (newMission) => ({
            [`Missions.${MISSION_TYPE.SPOT}.${data.PlaceId}`]: arrayUnion(newMission)
        }))
}

export async function createDailyMission(data) {
    return await createMissionProgress(data,
        (newMission) => ({[MISSION_TYPE.DAILY]: [newMission]}),
        (newMission) => ({[`Missions.${MISSION_TYPE.DAILY}`]: arrayUnion(newMission)}))
}

export async function createThemeMission(data) {
    return await createMissionProgress(data,
        (newMission) => ({[MISSION_TYPE.THEME]: [newMission]}),
        (newMission) => ({[`Missions.${MISSION_TYPE.THEME}`]: arrayUnion(newMission)}))
}

export async function createLevelMission(data) {
    return await createMissionProgress(data,
        (newMission) => ({[MISSION_TYPE.LEVEL]: [newMission]}),
        (newMission) => ({[`Missions.${MISSION_TYPE.LEVEL}`]: arrayUnion(newMission)}))
}

export async function clearUserMissionProgress() {
    await clearDocuments(USER_MISSION_PROGRESS_COLLECTION)
}

async function userMissionsOf(userId) {
    const userRef = createDocumentRef("Utente", userId);
    const documents = await documentsFrom(query(
        collection(db, USER_MISSION_PROGRESS_COLLECTION),
        where("UserRef", "==", userRef)
    ));
    return documents[0]
}

async function currentUserMissions() {
    const user = await isAuthenticatedUser();
    if (!user) return EMPTY_VALUE;
    return (await userMissionsOf(user.id))
}

async function currentUserMissionsOf(type) {
    const userMissions = await currentUserMissions()
    return userMissions?.Missions[type]
}

async function hydrateMissions(mission) {
    const missionTemplateDocument = await loadDocumentRef(mission.MissionTemplateRef);
    const placeDocument = missionTemplateDocument.data().Type === MISSION_TYPE.SPOT ?
        await loadDocumentRef(mission.PlaceRef) : EMPTY_VALUE;
    const userDocument = await loadDocumentRef(mission.UserRef);
    return {
        user: userDocument !== EMPTY_VALUE && {id: userDocument.id, ...userDocument.data()},
        place: placeDocument !== EMPTY_VALUE && {id: placeDocument.id, ...placeDocument.data()},
        template: missionTemplateDocument.data(),
        progress: mission,
    }
}

export async function hydrateCurrentUserMissionsOf(type) {
    if (type === MISSION_TYPE.SPOT) return [];
    const userMissions = await currentUserMissionsOf(type)
    return await Promise.all(userMissions.map(hydrateMissions));
}

async function hydrateCurrentUserSpotMissionsIf(isActive) {
    const activeSpotMissions = (await currentUserMissionsOf(MISSION_TYPE.SPOT));
    const result = Object.entries(activeSpotMissions)
        .filter(([, missions]) => missions.every(m => m.IsActive === isActive))
        .map(async ([_, missions]) => {
            const placeDocument = (await loadDocumentRef(missions[0].PlaceRef));
            const hydratedMissions = await Promise.all(missions.map(hydrateMissions));
            return {
                place: placeDocument !== EMPTY_VALUE && {id: placeDocument.id, ...placeDocument.data()},
                missions: hydratedMissions
            }
        })

    return await Promise.all(result);
}

export async function hydrateActiveSpotMissionsOfCurrentUser() {
    return await hydrateCurrentUserSpotMissionsIf(true)
}

export async function hydrateInactiveSpotMissionsOfCurrentUser() {
    return await hydrateCurrentUserSpotMissionsIf(false)
}