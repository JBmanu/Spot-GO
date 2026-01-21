import {
    clearDocuments,
    createDocument,
    createDocumentRef,
    documentFromId,
    documentsFrom,
    documentsOf,
    EMPTY_VALUE,
    isAuthenticatedUser,
    loadDocumentRef,
    updateDocument
} from "./goalsConnector.js";
import {arrayUnion, collection, query, Timestamp, where} from "firebase/firestore";
import {db} from "../../firebase.js";
import {MISSION_TEMPLATE_COLLECTION} from "./missionTemplateConnector.js";
import {MISSION_TYPE} from "./seed/missionTemplateSeed.js";
import {runAllAsyncSafe} from "../utils.js";

const USER_MISSION_PROGRESS_COLLECTION = "UserMissionProgress";

async function createMissionProgressByType(data, create, update) {
    const user = await isAuthenticatedUser();
    if (!user) return null;

    const userRef = createDocumentRef("Utente", data.UserId);
    const placeRef = createDocumentRef("Luogo", data.PlaceId);
    const missionTemplateRef = createDocumentRef(MISSION_TEMPLATE_COLLECTION, data.MissionTemplateId);

    const documents = await documentsFrom(query(
        collection(db, USER_MISSION_PROGRESS_COLLECTION),
        where("UserRef", "==", userRef)
    ));

    const newMission = {
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

    if (documents.length === 0) {
        console.log("Creating new UserMissionProgress for user:", user.id);
        return await createDocument(USER_MISSION_PROGRESS_COLLECTION,
            {UserRef: userRef, Missions: {...emptyMissionStructure, ...create(newMission)}});
    } else {
        console.log("Updating existing UserMissionProgress for user:", user.id);
        return await updateDocument(documents[0], update(newMission));
    }
}


export async function createSpotUserMissionProgress(data) {
    return await createMissionProgressByType(data,
        (newMission) => ({[MISSION_TYPE.SPOT]: [newMission]}),
        (newMission) => ({[`Missions.${MISSION_TYPE.SPOT}`]: arrayUnion(newMission)}))
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

export async function userMissionProgresses() {
    const userMissions = (await documentsOf(USER_MISSION_PROGRESS_COLLECTION))
    const detailedMissions = []

    for (let mission of userMissions) {
        const [userRef, placeRef, templateRef] =
            await runAllAsyncSafe(
                () => loadDocumentRef(mission.UserRef),
                () => loadDocumentRef(mission.PlaceRef),
                () => loadDocumentRef(mission.MissionTemplateRef)
            )

        const userDocument = userRef.value;
        const placeDocument = placeRef.value;
        const missionTemplateDocument = templateRef.value;

        detailedMissions.push({
            user: userDocument !== EMPTY_VALUE && {id: userDocument.id, ...userDocument.data()},
            place: placeDocument !== EMPTY_VALUE && {id: placeDocument.id, ...placeDocument.data()},
            template: missionTemplateDocument.data(),
            progress: mission,
        })
    }

    return detailedMissions
}


export async function missionsProgressByCurrentUser() {
    const user = await isAuthenticatedUser();
    if (!user) return EMPTY_VALUE;

    const userRef = createDocumentRef("Utente", user.id);
    const documents = await documentsFrom(query(
        collection(db, USER_MISSION_PROGRESS_COLLECTION),
        where("UserRef", "==", userRef)
    ));

    return documents[0]
}

export async function missionsProgressByCurrentUserAnd(type) {
    const userMissions = await missionsProgressByCurrentUser()
    console.log("TEEESSSTT: " + userMissions)
    console.log("TYPE: " + userMissions.Missions[type].length)

    const user = (await isAuthenticatedUser())
    return (await userMissionProgresses())
        .filter(data => data.user.id === user.id && data.template.Type === type)
}

export async function missionsProgressGroupByUserAnd(missionType, isActive) {
    const activeSpotMissions = (await missionsProgressByCurrentUserAnd(missionType))
        .filter(data => data.progress.IsActive === isActive)

    return activeSpotMissions.reduce((acc, mission) => {
        const placeId = mission.place.id;
        const group = acc.find(g => g.place.id === placeId);
        group ? group.missions.push(mission) : acc.push({place: mission.place, missions: [mission]})
        return acc;
    }, [])
}

export async function activeSpotMissionProgressByUser() {
    return await missionsProgressGroupByUserAnd(MISSION_TYPE.SPOT, true)
}

export async function inactiveSpotMissionsProgressByUser() {
    return await missionsProgressGroupByUserAnd(MISSION_TYPE.SPOT, false)
}