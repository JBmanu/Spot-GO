
// Trigger attivi: l'utente fa qualcosa
import {hydrateCurrentUserMissionsOf, updateValueOfMission} from "../db/userMissionProgressConnector.js";
import {ACTION_TYPE, MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {checkEqualsDay} from "../utils.js";

export async function testActiveTriggers() {
    await triggerLogin();
    // await triggerFoto();
    // await triggerReview();
    // await triggerCreatePolaroid();
    // await triggerSharePolaroid();
}

export async function triggerLogin() {
    const missions = await hydrateCurrentUserMissionsOf(MISSION_TYPE.DAILY)
    const missionsLogin = missions.filter(mission => mission.template.Action === ACTION_TYPE.LOGIN)
    console.log("Missions LOGIN: ", missionsLogin);

    for (const mission of missionsLogin) {
        const isCompleted = mission.progress.IsCompleted
        const savedData = mission.progress.CreatedAt.toDate()
        const areEqualsDay = checkEqualsDay(savedData, new Date())
        if (!isCompleted && areEqualsDay) {
            console.log("UDATE LOGIN")
            await updateValueOfMission(MISSION_TYPE.DAILY, mission.id, value => value + 1);
        }
    }
}

export async function triggerFoto() {

}

export async function triggerReview() {

}

export async function triggerCreatePolaroid() {

}

export async function triggerSharePolaroid() {

}