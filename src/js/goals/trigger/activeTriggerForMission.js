// Trigger attivi: l'utente fa qualcosa
import {
    hydrateCurrentUserMissionsOf,
    updateValueOfMission,
    updateValueOfSpotMission
} from "../db/userMissionProgressConnector.js";
import {ACTION_TYPE, CATEGORY, MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {checkEqualsDay} from "../utils.js";

export async function testActiveTriggers() {
    await triggerLogin();
    await triggerFoto({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    await triggerReview({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    await triggerCreatePolaroid({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    await triggerSharePolaroid({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
}

async function chooseMissionTypeAndFilterForUpdate(missionType, filterMission) {
    const missions = await hydrateCurrentUserMissionsOf(missionType)
    const filteredMissions = missions
        .filter(mission => filterMission(mission) && !mission.progress.IsCompleted)

    for (let mission of filteredMissions) {
        if (missionType === MISSION_TYPE.SPOT) {
            await updateValueOfSpotMission(mission.place.id, mission.id, value => value + 1);
        } else {
            await updateValueOfMission(missionType, mission.id, value => value + 1);
        }
    }
}

export async function triggerLogin() {
    await chooseMissionTypeAndFilterForUpdate(MISSION_TYPE.DAILY,
        mission => {
            const savedData = mission.progress.CreatedAt.toDate()
            const areEqualsDay = checkEqualsDay(savedData, new Date())
            return mission.template.Action === ACTION_TYPE.LOGIN && areEqualsDay
        })
}

async function baseTriggerSpotAction(spotData, actionType) {
    const spotsMissions = await hydrateCurrentUserMissionsOf(MISSION_TYPE.SPOT)
    const spotMissions = spotsMissions.find(spot => spot.place.id === spotData.id)

    const missions = spotMissions.missions
        .filter(mission => mission.template.Action === actionType && !mission.progress.IsCompleted)

    for (const mission of missions) {
        await updateValueOfSpotMission(mission.place.id, mission.id, value => value + 1);
    }

    await chooseMissionTypeAndFilterForUpdate(MISSION_TYPE.DAILY, mission =>
        mission.template.Action === actionType)

    await chooseMissionTypeAndFilterForUpdate(MISSION_TYPE.THEME, mission =>
        mission.template.Action === actionType && mission.template.Category === spotData.category)
}

export async function triggerFoto(spotData) {
    await baseTriggerSpotAction(spotData, ACTION_TYPE.FOTO);
}

export async function triggerReview(spotData) {
    await baseTriggerSpotAction(spotData, ACTION_TYPE.REVIEW);
}

export async function triggerCreatePolaroid(spotData) {
    await baseTriggerSpotAction(spotData, ACTION_TYPE.CREATE_POLAROID);
}

export async function triggerSharePolaroid(spotData) {
    await baseTriggerSpotAction(spotData, ACTION_TYPE.SHARE_POLAROID);
}