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
    missions.forEach(mission => generateHTMLMissionTemplate(containerIndex, mission));
}

function generateHTMLMissionTemplate(indexCtn, mission) {
    const missionTemplate = mission.template
    const progress = mission.progress.Current;
    const container = document.querySelectorAll('.missions-card-ctn');
    const percentProgress = Math.min(100, (progress / missionTemplate.Target) * 100);

    container[indexCtn].innerHTML +=
        `<div class="vertical-ctn-g2 glass-strong interactive completable px-3 py-3" 
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
        </div>`;

    if (mission.progress.IsCompleted) {
        const missionEl = container[indexCtn].querySelector(`[${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}"]`);
        markMissionAsCompleted(missionEl)
    }
}
