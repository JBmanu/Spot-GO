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
import {MISSION_TYPE} from "./seed/missionTemplateSeed.js";
import {COLLECTIONS} from "../Datas.js";
import {missionTemplatesByType} from "./missionTemplateConnector.js";


async function createMissionProgress(data, create, update) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    const userRef = createDocumentRef("Utente", data.UserId);
    const placeRef = createDocumentRef("Luogo", data.PlaceId);
    const missionTemplateRef = createDocumentRef(COLLECTIONS.MISSION_TEMPLATE, data.MissionTemplateId);

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
        return await createDocument(COLLECTIONS.USER_MISSION_PROGRESS,
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

export async function createAllSpotMissions(userId, placeId, isActive = true) {
    const spotMissions = await missionTemplatesByType(MISSION_TYPE.SPOT)
    for (let spotMission of spotMissions) {
        await createSpotMission({
            UserId: userId,
            PlaceId: placeId,
            MissionTemplateId: spotMission.id,
            IsActive: isActive
        })
    }
}

export async function createAllSpotMissionsForCurrentUser(placeId, isActive = true) {
    const user = await isAuthenticatedUser();
    if (!user) return null;
    await createAllSpotMissions(user.id, placeId, isActive)
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
    await clearDocuments(COLLECTIONS.USER_MISSION_PROGRESS)
}

async function userMissionsOf(userId) {
    const userRef = createDocumentRef("Utente", userId);
    const documents = await documentsFrom(query(
        collection(db, COLLECTIONS.USER_MISSION_PROGRESS),
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

async function hydrateMission(mission) {
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
    const userMissions = await currentUserMissionsOf(type)
    if (type === MISSION_TYPE.SPOT) {
        const spotMissions = userMissions.map(Object.values)
            .map(async missions => {
                const placeData = (await loadDocumentRef(missions[0].PlaceRef));
                const hydratedMissions = await Promise.all(missions.map(hydrateMission));
                return {place: placeData !== EMPTY_VALUE && placeData, missions: hydratedMissions}
            })
        return await Promise.all(spotMissions);
    }
    return await Promise.all(userMissions.map(hydrateMission));
}

export async function hydrateCurrentUserSpotMissionsOf(placeId) {
    const spotsMissions = await hydrateCurrentUserMissionsOf(MISSION_TYPE.SPOT)
    return spotsMissions.find(spot => spot.place.id === placeId)?.missions
}

async function hydrateCurrentUserSpotMissionsIf(isActive) {
    const activeSpotMissions = await hydrateCurrentUserMissionsOf(MISSION_TYPE.SPOT);
    return activeSpotMissions.filter(spot => spot.missions.every(m => m.progress.IsActive === isActive))
}

export async function hydrateActiveSpotMissionsOfCurrentUser() {
    return await hydrateCurrentUserSpotMissionsIf(true)
}

export async function hydrateInactiveSpotMissionsOfCurrentUser() {
    return await hydrateCurrentUserSpotMissionsIf(false)
}

export async function currentUserHasSpotMissions(placeId) {
    return (await currentUserMissions())?.[MISSION_TYPE.SPOT][placeId]
}

async function updateValueMission(missions, mission, pathUpdate, updateFun) {
    const current = mission.progress.Current
    const target = mission.template.Target
    const updatedValue = updateFun(current) > target ? target : updateFun(current);
    const isCompleted = updatedValue >= target;
    const userMissions = await userMissionsOf(mission.user.id)

    await updateDocument(userMissions, {[`${pathUpdate}.Current`]: updatedValue});
    if (!mission.progress.IsCompleted && isCompleted) {
        await updateDocument(userMissions, {[`${pathUpdate}.IsCompleted`]: true});
    }

    const missionsCount = missions.length;
    let completedCount = missions.filter(m => m.progress.IsCompleted).length;
    completedCount = isCompleted ? completedCount + 1 : completedCount;

    return {
        missions: missionsCount, completedMissions: completedCount,
        isCompleted: isCompleted, target: target, updatedValue: updatedValue
    };
}

export async function updateValueOfSpotMission(placeId, missionTemplateId, updateFun) {
    const spotsMissions = (await currentUserMissions())?.[MISSION_TYPE.SPOT];
    const spotMissions = spotsMissions?.[placeId];
    const missions = await Promise.all(Object.values(spotMissions).map(hydrateMission));
    const mission = await hydrateMission(spotMissions?.[missionTemplateId]);
    const pathUpdate = `${MISSION_TYPE.SPOT}.${placeId}.${missionTemplateId}`;

    return await updateValueMission(missions, mission, pathUpdate, updateFun);
}

export async function updateValueOfMission(type, missionTemplateId, updateFun) {
    const missions = await hydrateCurrentUserMissionsOf(type);
    const mission = missions.filter(mission => mission.id === missionTemplateId)[0];
    const pathUpdate = `${type}.${mission.id}`;

    return await updateValueMission(missions, mission, pathUpdate, updateFun);
}

export async function deactivateAllSpotMissionsOfCurrentUser() {
    const user = await isAuthenticatedUser();
    const spotsMissions = await hydrateActiveSpotMissionsOfCurrentUser()
    const userMissions = await userMissionsOf(user.id)

    for (let spotMissions of spotsMissions) {
        for (let mission of spotMissions.missions) {
            const pathUpdate = `${MISSION_TYPE.SPOT}.${spotMissions.place.id}.${mission.id}`;
            await updateDocument(userMissions, {[`${pathUpdate}.IsActive`]: false});
        }
    }
}



