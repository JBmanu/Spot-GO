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

export async function triggerLogin() {
    const missions = await hydrateCurrentUserMissionsOf(MISSION_TYPE.DAILY)
    const missionsLogin = missions.filter(mission => mission.template.Action === ACTION_TYPE.LOGIN)

    for (const mission of missionsLogin) {
        const isCompleted = mission.progress.IsCompleted
        const savedData = mission.progress.CreatedAt.toDate()
        const areEqualsDay = checkEqualsDay(savedData, new Date())
        if (!isCompleted && areEqualsDay) {
            await updateValueOfMission(MISSION_TYPE.DAILY, mission.id, value => value + 1);
        }
    }
}

async function baseTriggerSpotAction(spotData, actionType) {
    const spotsMissions = await hydrateCurrentUserMissionsOf(MISSION_TYPE.SPOT)
    const spotMissions = spotsMissions.find(spot => spot.place.id === spotData.id)
    const missions = spotMissions.missions
        .filter(mission => mission.template.Action === actionType && !mission.progress.IsCompleted)

    for (const mission of missions) {
        await updateValueOfSpotMission(spotData.id, mission.id, value => value + 1);
    }

    const dailyMissions = (await hydrateCurrentUserMissionsOf(MISSION_TYPE.DAILY))
        .filter(dailyMission => dailyMission.template.Action === actionType &&
            !dailyMission.progress.IsCompleted)

    for (let dailyMission of dailyMissions) {
        await updateValueOfMission(MISSION_TYPE.DAILY, dailyMission.id, value => value + 1);
    }

    const themeMissions = (await hydrateCurrentUserMissionsOf(MISSION_TYPE.THEME))
        .filter(themeMission => themeMission.template.Action === actionType &&
            themeMission.template.Category === spotData.category &&
            !themeMission.progress.IsCompleted)

    for (let themeMission of themeMissions) {
        await updateValueOfMission(MISSION_TYPE.THEME, themeMission.id, value => value + 1);
    }
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