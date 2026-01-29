import {MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";
import {runAllAsyncSafe} from "../utils.js";
import {hydrateCurrentUserMissionsOf} from "../db/userMissionProgressConnector.js";
import {MISSION_ATTRIBUTE} from "../Datas.js";

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

    // <!-- MISSIONE TEMI -->
    // <div class=" p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-sm flex flex-col gap-2">
    //     <!-- Riga superiore: nome + stato -->
    //     <div>
    //         <div class="between-ctn">
    //             <span class="text-[16px] font-semibold text-gray-900 truncate">Raggiungi l’ingresso</span>
    //             <span class="w-4 h-4 rounded-full bg-blue-500" title="Missione attiva"></span>
    //             <!-- Usare bg-green-500 per completata, bg-gray-300 per bloccata -->
    //         </div>
    //         <!-- Descrizione breve -->
    //         <p class="text-sm text-gray-600 truncate">Trova l’accesso segreto nel tempio</p>
    //     </div>
    //
    //     <!-- Ricompense -->
    //     <div class="between-ctn">
    //         <span class="text-sm text-green-500">10% Sconto</span>
    //         <span class="text-sm text-blue-400">+20 XP</span>
    //         <span class="text-sm text-yellow-500">🏅 Badge</span>
    //     </div>
    //
    //     <div class="center-ctn gap-3">
    //         <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
    //             <div class="absolute inset-y-0 left-0 rounded-full bg-blue-500" style="width: 71%;"></div>
    //         </div>
    //         <span class="min-w-9 text-right text-sm text-gray-600">5 / 7</span>
    //     </div>
    // </div>


    // <!-- Lato sinistro -->
    // <div class="space-y-1">
    //     <h3 class="text-sm font-semibold text-gray-800">${missionTemplate.Name}</h3>
    //     <p class="text-xs text-gray-600">${missionTemplate.Description}</p>
    //     <div class="flex items-center gap-1 text-xs text-gray-700">
    //         <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt="Reward Icon"/>
    //         <span>+${missionTemplate.Reward.Experience} XP</span>
    //     </div>
    // </div>
    // <!-- Lato destro -->
    // <div class="center-ctn">
    //                 <span class="text-lg font-medium text-gray-500" ${MISSION_ATTRIBUTE.PROGRESS}>
    //                     ${progress} / ${missionTemplate.Target}
    //                 </span>
    // </div>

    const percentProgress = Math.min(100, (progress / missionTemplate.Target) * 100);
    // <div class=" p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-sm flex flex-col gap-2">
    container[indexCtn].innerHTML +=
        `<div class="vertical-ctn-g2 glass-strong interactive completable px-5 py-4 card" 
            ${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}">
            <!-- Riga superiore: nome + stato -->
            <div>
                <div class="between-ctn">
                    <span class="text-[16px] font-semibold text-gray-900 truncate">${missionTemplate.Name}</span>
                    <span class="w-4 h-4 rounded-full bg-blue-500" title="Missione attiva"></span>
                    <!-- Usare bg-green-500 per completata, bg-gray-300 per bloccata -->
                </div>
                <!-- Descrizione breve -->
                <p class="text-sm text-gray-600 truncate">${missionTemplate.Description}</p>
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
}
