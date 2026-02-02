import {MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {runAllAsyncSafe} from "../utils.js";
import {hydrateCurrentUserMissionsOf} from "../db/userMissionProgressConnector.js";
import {CHECKBOX_ICON_PATH, MISSION_ATTRIBUTE} from "../Datas.js";
import {markMissionAsCompleted} from "../interaction/missionCompletable.js";

export async function loadMissions() {
    await runAllAsyncSafe(
        () => generateMissionType(MISSION_TYPE.DAILY, 0),
        () => generateMissionType(MISSION_TYPE.THEME, 1),
        () => generateMissionType(MISSION_TYPE.LEVEL, 2)
    )

    console.log("Missions loaded successfully.");
}

async function generateMissionType(missionType, containerIndex) {
    const missions = await hydrateCurrentUserMissionsOf(missionType);
    // i wish to sort mission, last missions that are completed and first missions that are nearly completed
    missions.sort((a, b) => {
        if (a.progress.IsCompleted && !b.progress.IsCompleted) return 1;
        if (!a.progress.IsCompleted && b.progress.IsCompleted) return -1;

        const aPercent = a.progress.Current / a.template.Target;
        const bPercent = b.progress.Current / b.template.Target;
        return bPercent - aPercent;
    })
    missions.forEach(mission => generateHTMLMissionTemplate(containerIndex, mission));
}

function generateHTMLMissionTemplate(indexCtn, mission) {
    const missionTemplate = mission.template
    const progress = mission.progress.Current;
    const container = document.querySelectorAll('.missions-card-ctn');
    const percentProgress = Math.min(100, (progress / missionTemplate.Target) * 100);

    container[indexCtn].insertAdjacentHTML("beforeend",
        `<div class="vertical-ctn-g2 glass-strong interactive completable mission px-3 py-3" 
            ${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}">
            <!-- Riga superiore: nome + stato -->
            <div class="vertical-ctn">
                <div class="between-ctn">
                    <span class="mission-title">${missionTemplate.Name}</span>
                    <img src="${CHECKBOX_ICON_PATH.EMPTY}" class="mission-checkbox" alt="" ${MISSION_ATTRIBUTE.CHECKBOX}/>
                </div>
                <!-- Descrizione breve -->
                <p class="mission-title-description">${missionTemplate.Description}</p>
            </div>

            <!-- Ricompense -->
            <div class="between-ctn">
                <span class="text-sm text-green-500">10% Sconto</span>
                <span class="text-sm text-blue-400">+${missionTemplate.Reward.Experience} XP</span>
                <span class="text-sm text-yellow-500">🏅 Badge</span>
            </div>

            <div class="center-ctn gap-3">
                <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                    <div class="absolute inset-y-0 left-0 rounded-full bg-blue-500" 
                    style="width: ${percentProgress}%;" ${MISSION_ATTRIBUTE.PROGRESS_BAR}></div>
                </div>
                <span class="min-w-9 text-right text-sm text-gray-600" ${MISSION_ATTRIBUTE.PROGRESS}>
                    ${progress} / ${missionTemplate.Target}
                </span>
            </div>
        </div>`);

    if (mission.progress.IsCompleted) {
        const missionEl = container[indexCtn].querySelector(`[${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}"]`);
        markMissionAsCompleted(missionEl)
    }
}
