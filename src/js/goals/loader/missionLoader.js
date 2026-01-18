import {missionTemplatesByType} from "../db/missionTemplateConnector.js";
import {MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";

const MISSIONS_SECTION = new Map([
    [0, MISSION_TYPE.DAILY],
    [1, MISSION_TYPE.THEME],
    [2, MISSION_TYPE.LEVEL]
])

export async function loadMissions() {

    for (const [containerIndex, missionType] of MISSIONS_SECTION) {
        const missions = await missionTemplatesByType(missionType);
        missions.forEach(mission =>
            createMissionTemplate(
                containerIndex,
                mission.id,
                mission.Name,
                mission.Description,
                mission.Reward.Experience ?? 0,
                0,
                -1));
    }
}

function createMissionTemplate(indexCtn, id, title, description, exp, progress, allProgress) {
    const container = document.querySelectorAll('.missions-card');
    container[indexCtn].innerHTML +=
        `<div class="between-ctn glass-strong interactive completable px-5 py-4 card" db-id="${id}">
            <!-- Lato sinistro -->
            <div class="space-y-1">
                <h3 class="text-sm font-semibold text-gray-800">${title}</h3>
                <p class="text-xs text-gray-600">${description}</p>
                <div class="flex items-center gap-1 text-xs text-gray-700">
                    <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt="Reward Icon"/>
                    <span>+${exp} XP</span>
                </div>
            </div>
            <!-- Lato destro -->
            <div class="center-ctn">
                <span class="text-lg font-medium text-gray-500">${progress} / ${allProgress}</span>
            </div>
        </div>`;
}
