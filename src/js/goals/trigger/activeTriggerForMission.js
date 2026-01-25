import {
    hydrateCurrentUserMissionsOf,
    updateValueOfMission,
    updateValueOfSpotMission
} from "../db/userMissionProgressConnector.js";
import {ACTION_TYPE, CATEGORY, MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {checkEqualsDay, identityFun} from "../utils.js";

export async function testActiveTriggers() {
    await triggerLogin();
    await triggerFoto({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    await triggerReview({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    await triggerCreatePolaroid({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    await triggerSharePolaroid({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
}

async function chooseMissionTypeAndFilterForUpdate(missionType, mapMissions, filterMission) {
    const missions = await hydrateCurrentUserMissionsOf(missionType)
    const filteredMissions = mapMissions(missions)
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
        identityFun, mission => {
            const savedData = mission.progress.CreatedAt.toDate()
            const areEqualsDay = checkEqualsDay(savedData, new Date())
            return mission.template.Action === ACTION_TYPE.LOGIN && areEqualsDay
        })
}

async function baseTriggerSpotAction(spotData, actionType) {
    await chooseMissionTypeAndFilterForUpdate(MISSION_TYPE.SPOT,
        spotsMissions => spotsMissions.find(spot => spot.place.id === spotData.id).missions,
        mission => mission.template.Action === actionType)

    await chooseMissionTypeAndFilterForUpdate(MISSION_TYPE.DAILY, identityFun,
        mission => mission.template.Action === actionType)

    await chooseMissionTypeAndFilterForUpdate(MISSION_TYPE.THEME, identityFun,
        mission => mission.template.Action === actionType && mission.template.Category === spotData.category)
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