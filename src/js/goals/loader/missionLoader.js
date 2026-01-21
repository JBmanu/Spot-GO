import {MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {missionsProgressByCurrentUserAnd} from "../db/userMissionProgressConnector.js";
import {runAllAsyncSafe} from "../utils.js";

export async function loadMissions() {
    await runAllAsyncSafe(
        () => generateMissionType(MISSION_TYPE.DAILY, 0),
        () => generateMissionType(MISSION_TYPE.THEME, 1),
        () => generateMissionType(MISSION_TYPE.LEVEL, 2)
    )

    console.log("Missions loaded successfully.");
}

async function generateMissionType(missionType, containerIndex) {
    const missions = await missionsProgressByCurrentUserAnd(missionType);
    console.log("MISSION TYPE:", missionType, "\n", missions);
    missions.forEach(mission =>
        generateHTMLMissionTemplate(
            containerIndex,
            mission.id,
            mission.template,
            mission.progress.Current));
}

function generateHTMLMissionTemplate(indexCtn, id, missionTemplate, progress) {
    const container = document.querySelectorAll('.missions-card');
    container[indexCtn].innerHTML +=
        `<div class="between-ctn glass-strong interactive completable px-5 py-4 card" db-id="${id}">
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
