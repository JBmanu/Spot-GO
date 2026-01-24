import {MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {runAllAsyncSafe} from "../utils.js";
import {hydrateCurrentUserMissionsOf} from "../db/userMissionProgressConnector.js";

export async function loadMissions() {
    await runAllAsyncSafe(
        () => generateMissionType(MISSION_TYPE.DAILY, 0),
        () => generateMissionType(MISSION_TYPE.THEME, 1),
        () => generateMissionType(MISSION_TYPE.LEVEL, 2)
    )

    // const updatedMission = await updateValueOfMission(MISSION_TYPE.DAILY,
    //     "LfJMWzpIu7VWIauMJdfE",
    //     current => current + 1);
    // console.log("UPDATE MISSION: ", updatedMission);
    //
    // const updatedSpotMission = await updateValueOfSpotMission(
    //     "8ncqBKHfbPWlQsFc7pvT",
    //     "ceGA2KwDbHE9xsE9lzC2",
    //     current => current + 1);
    // console.log("UPDATE SPOT MISSION: ", updatedSpotMission);

    console.log("Missions loaded successfully.");
}

async function generateMissionType(missionType, containerIndex) {
    const missions = await hydrateCurrentUserMissionsOf(missionType);

    missions.forEach(mission =>
        generateHTMLMissionTemplate(
            containerIndex,
            mission.template,
            mission.progress.Current));
}

function generateHTMLMissionTemplate(indexCtn, missionTemplate, progress) {
    const container = document.querySelectorAll('.missions-card');
    container[indexCtn].innerHTML +=
        `<div class="between-ctn glass-strong interactive completable px-5 py-4 card" db-ref="${missionTemplate.ref}">
            <!-- Lato sinistro -->
            <div class="space-y-1">
                <h3 class="text-sm font-semibold text-gray-800">${missionTemplate.Name}</h3>
                <p class="text-xs text-gray-600">${missionTemplate.Description}</p>
                <div class="flex items-center gap-1 text-xs text-gray-700">
                    <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt="Reward Icon"/>
                    <span>+${missionTemplate.Reward.Experience} XP</span>
                </div>
            </div>
            <!-- Lato destro -->
            <div class="center-ctn">
                <span class="text-lg font-medium text-gray-500">${progress} / ${missionTemplate.Target}</span>
            </div>
        </div>`;
}
