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
import {collection, query, Timestamp, where} from "firebase/firestore";
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
            {UserRef: userRef, ...emptyMissionStructure, ...create(newMission)});
    } else {
        return await updateDocument(userMissions, update(newMission));
    }
}

export async function createSpotMission(data) {

    return await createMissionProgress(data,
        (newMission) => ({
            [MISSION_TYPE.SPOT]: {[data.PlaceId]: {[data.MissionTemplateId]: newMission}}
        }),
        (newMission) => ({
            [`${MISSION_TYPE.SPOT}.${data.PlaceId}.${data.MissionTemplateId}`]: newMission
        }))
}

export async function createDailyMission(data) {
    return await createMissionProgress(data,
        (newMission) => ({[MISSION_TYPE.DAILY]: {[data.MissionTemplateId]: newMission}}),
        (newMission) => ({[`${MISSION_TYPE.DAILY}.${data.MissionTemplateId}`]: newMission}))
}

export async function createThemeMission(data) {
    return await createMissionProgress(data,
        (newMission) => ({[MISSION_TYPE.THEME]: {[data.MissionTemplateId]: newMission}}),
        (newMission) => ({[`${MISSION_TYPE.THEME}.${data.MissionTemplateId}`]: newMission}))
}

export async function createLevelMission(data) {
    return await createMissionProgress(data,
        (newMission) => ({[MISSION_TYPE.LEVEL]: {[data.MissionTemplateId]: newMission}}),
        (newMission) => ({[`${MISSION_TYPE.LEVEL}.${data.MissionTemplateId}`]: newMission}))
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
    return Object.values(userMissions?.[type]);
}

async function hydrateMissions(mission) {
    const missionTemplateData = await loadDocumentRef(mission.MissionTemplateRef);
    const placeData = missionTemplateData.Type === MISSION_TYPE.SPOT ?
        await loadDocumentRef(mission.PlaceRef) : EMPTY_VALUE;
    const userData = await loadDocumentRef(mission.UserRef);

    return {
        id: missionTemplateData.id,
        user: userData !== EMPTY_VALUE && userData,
        place: placeData !== EMPTY_VALUE && placeData,
        template: missionTemplateData,
        progress: mission,
    }
}

export async function hydrateCurrentUserMissionsOf(type) {
    if (type === MISSION_TYPE.SPOT) return [];
    const userMissions = await currentUserMissionsOf(type)
    return await Promise.all(userMissions.map(hydrateMissions));
}

async function hydrateCurrentUserSpotMissionsIf(isActive) {
    const activeSpotMissions = await currentUserMissionsOf(MISSION_TYPE.SPOT);

    const result = activeSpotMissions.map(Object.values)
        .filter(missions => missions.every(m => m.IsActive === isActive))
        .map(async missions => {
            const placeData = (await loadDocumentRef(missions[0].PlaceRef));
            const hydratedMissions = await Promise.all(missions.map(hydrateMissions));
            return {place: placeData !== EMPTY_VALUE && placeData, missions: hydratedMissions}
        })

    return await Promise.all(result);
}

export async function hydrateActiveSpotMissionsOfCurrentUser() {
    return await hydrateCurrentUserSpotMissionsIf(true)
}

export async function hydrateInactiveSpotMissionsOfCurrentUser() {
    return await hydrateCurrentUserSpotMissionsIf(false)
}

export async function updateValueOfSpotMission(placeId, missionTemplateId, updateFun) {
    const spotsMissions = (await currentUserMissions())?.[MISSION_TYPE.SPOT];
    const spotMissions = spotsMissions?.[placeId];
    const mission = spotMissions?.[missionTemplateId];
    const hydrateMission = await hydrateMissions(mission)

    const current = hydrateMission.progress.Current
    const target = hydrateMission.template.Target
    const updatedValue = updateFun(current)
    const isCompleted = updatedValue >= target;
    const userMissions = await userMissionsOf(hydrateMission.user.id)

    const path = `${MISSION_TYPE.SPOT}.${placeId}.${missionTemplateId}`;
    await updateDocument(userMissions, {[`${path}.Current`]: updatedValue});

    if (!hydrateMission.progress.IsCompleted && isCompleted) {
        await updateDocument(userMissions, {[`${path}.IsCompleted`]: true});
    }

    const missionsCount = Object.keys(spotMissions).length;
    let completedCount = Object.values(spotMissions).filter(m => m?.IsCompleted).length;
    completedCount = isCompleted ? completedCount + 1 : completedCount;

    return {missions: missionsCount, completedMissions: completedCount,
        isCompleted: isCompleted, updatedValue: updatedValue};
}

export async function updateValueOfMission(type, missionTemplateId, updateFun) {
    const missions = await hydrateCurrentUserMissionsOf(type);
    const mission = missions.filter(mission => mission.id === missionTemplateId)[0];
    const user = mission.user;
    const currentValue = mission.progress.Current
    const targetValue = mission.template.Target
    const updatedValue = updateFun(currentValue)
    const isCompleted = updatedValue >= targetValue;
    const userMissions = await userMissionsOf(user.id)

    await updateDocument(userMissions, {[`${type}.${mission.id}.Current`]: updatedValue});

    if (!mission.progress.IsCompleted && isCompleted) {
        await updateDocument(userMissions, {[`${type}.${mission.id}.IsCompleted`]: true});
    }

    console.log("Current: ", currentValue, " Update: ", updateFun(currentValue))
    return {isCompleted: isCompleted, updatedValue: updatedValue};
}


