import {MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {missionsProgressByUserAnd} from "../db/userMissionProgressConnector.js";

const MISSIONS_SECTION = new Map([
    [0, MISSION_TYPE.DAILY],
    [1, MISSION_TYPE.THEME],
    [2, MISSION_TYPE.LEVEL]
])

export async function loadMissions() {

    for (const [containerIndex, missionType] of MISSIONS_SECTION) {
        const missions = await missionsProgressByUserAnd(missionType);

        missions.forEach(mission =>
            createMissionTemplate(
                containerIndex,
                mission.id,
                mission.template,
                mission.progress.Current));
    }
    console.log("Missions loaded successfully.");
}

function createMissionTemplate(indexCtn, id, missionTemplate, progress) {
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
