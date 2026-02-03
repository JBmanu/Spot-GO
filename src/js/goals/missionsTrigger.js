import {
    activateAllSpotMissionsOfCurrentUserOf,
    createAllSpotMissionsForCurrentUser,
    currentUserHasSpotMissions,
    hydrateCurrentUserMissionsOf,
    updateValueOfMission,
    updateValueOfSpotMission
} from "./db/userMissionProgressConnector.js";
import {ACTION_TYPE, MISSION_TYPE} from "./db/seed/missionTemplateSeed.js";
import {checkEqualsDay, identityFun} from "./utils.js";
import {updateCurrentUserLevel} from "./db/userGoalsConnector.js";
import {updateViewMission, updateViewSpotDetails} from "./missionsViewUpdater.js";
import {loadSpotMissions} from "./loader/spotMissionLoader.js";

export async function testActiveTriggers() {
    await triggerLogin();
    // await triggerFoto({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    // await triggerReview({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    // await triggerCreatePolaroid({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    // await triggerSharePolaroid({id: "8ncqBKHfbPWlQsFc7pvT", category: CATEGORY.NATURE});
    console.log("Active triggers tested");
}

// CRATE MISSION FOR SPOT
async function activateTriggerToCreateSpotMission(btnTrigger, spotData, overlayEl, triggerAction) {
    btnTrigger.disabled = true;
    spotData.category = spotData.idCategoria;
    if (await currentUserHasSpotMissions(spotData.id)) {
        await activateAllSpotMissionsOfCurrentUserOf(spotData.id)
    } else {
        await createAllSpotMissionsForCurrentUser(spotData.id, true)
    }
    await triggerAction(spotData)
    await loadSpotMissions()
    await updateViewSpotDetails(spotData, overlayEl)
    btnTrigger.disabled = false;
    console.log("Spot missions created for current user");
}

export async function activateTriggerToCreateSpotMissionsWithFoto(btnTrigger, spotData, overlayEl) {
    await activateTriggerToCreateSpotMission(
        btnTrigger, spotData, overlayEl, triggerFoto)
}

export async function activateTriggerToCreateSpotMissionsWithCreatePolaroid(btnTrigger, spotData, overlayEl) {
    await activateTriggerToCreateSpotMission(
        btnTrigger, spotData, overlayEl, triggerCreatePolaroid)
}

export async function activateTriggerToCreateSpotMissionsWithCreateReview(btnTrigger, spotData, overlayEl) {
    await activateTriggerToCreateSpotMission(
        btnTrigger, spotData, overlayEl, triggerReview)
}


async function chooseMissionTypeAndFilterForUpdate(missionType, mapMissions, filterMission,
                                                   updateMission = value => value + 1) {
    const missions = await hydrateCurrentUserMissionsOf(missionType)
    const mappedMissions = mapMissions(missions)
    const filteredMissions = mappedMissions.filter(filterMission)
    const uncompletedMissions = filteredMissions.filter(mission => !mission.progress.IsCompleted)

    for (let mission of uncompletedMissions) {
        let updatedMissionData;
        if (missionType === MISSION_TYPE.SPOT) {
            updatedMissionData = await updateValueOfSpotMission(mission.place.id, mission.id, updateMission);
        } else {
            updatedMissionData = await updateValueOfMission(missionType, mission.id, updateMission);
        }

        // Update level
        if (updatedMissionData.isCompleted) {
            // Update Completed Mission
            await triggerCompleteMission(updatedMissionData, missionType);
            const levelData = await updateCurrentUserLevel(level => level + mission.template.Reward.Experience)
            await triggerReachLevel(levelData)
            console.log("User level updated after completing mission");
        }

        // Update View
        updateViewMission(mappedMissions, mission, updatedMissionData);
    }
}

// ACTIVE TRIGGERS
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

// PASSIVE TRIGGERS
async function triggerCompleteMission(updatedMissionData, missionType) {
    if (missionType === MISSION_TYPE.SPOT || !updatedMissionData.isCompleted) return;
    await chooseMissionTypeAndFilterForUpdate(missionType, identityFun,
        mission => mission.template.Action === ACTION_TYPE.COMPLETE_MISSIONS);
}

export async function triggerReachLevel(levelData) {
    await chooseMissionTypeAndFilterForUpdate(MISSION_TYPE.LEVEL, identityFun,
        mission => mission.template.Action === ACTION_TYPE.REACH_LEVEL,
        _ => levelData.newLevel)
}

export async function triggerObtainBadge() {

}