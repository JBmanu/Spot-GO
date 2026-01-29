import {
    hydrateActiveSpotMissionsOfCurrentUser,
    hydrateInactiveSpotMissionsOfCurrentUser
} from "../db/userMissionProgressConnector.js";
import {runAllAsyncSafe} from "../utils.js";
import {MISSION_ATTRIBUTE, SPOT_ATTRIBUTE} from "../Datas.js";
import {initializeEventOpenCloseSpotMissions} from "../interaction/spotsMissions.js";


export async function loadSpotMissions() {
    const mainCtn = document.querySelector('.main-goals-page')
    const activeSpotMissiosn = mainCtn.querySelector('.spot-card');
    activeSpotMissiosn.replaceChildren()
    const deactiveSpotsMissionsCtn = document.querySelector('.all-spots-missions-ctn');
    deactiveSpotsMissionsCtn.replaceChildren()
    await runAllAsyncSafe(
        () => generateSpotCard(hydrateActiveSpotMissionsOfCurrentUser, generateHTMLActiveSpotCard),
        () => generateSpotCard(hydrateInactiveSpotMissionsOfCurrentUser, generateHTMLInactiveSpotCard)
    )
    console.log("Spot missions loaded");
}

async function generateSpotCard(loadSpotMissionsFun, generateHTMLFun) {
    const spotMissions = await loadSpotMissionsFun()
    spotMissions.forEach(spotMission => {
        const countCompletedMissions = spotMission.missions.filter(mission => mission.progress.IsCompleted)
        generateHTMLFun(
            spotMission.place,
            countCompletedMissions.length,
            spotMission.missions
        )
    })
}

function generateSpotMissions(missionCtn, missions) {
    missions.forEach(mission => generateHTMLSpotMissions(missionCtn, mission.template))
}

function generateHTMLSpotMissions(missionContainer, missionTemplate) {
    // <div class="mission flex items-start gap-3 p-3 rounded-xl bg-white/20 border border-white/30 backdrop-blur-xl shadow-sm">
    //     <!-- Stato -->
    //     <span class="shrink-0 mt-1 w-4 h-4 rounded-full bg-blue-500"></span> <!-- Attiva: bg-blue-500, Completata: bg-green-500, Bloccata: bg-gray-300 -->
    //
    //     <!-- Contenuto -->
    //     <div class="flex-1 min-w-0">
    //         <div class="flex items-center justify-between">
    //             <span class="text-[16px] font-semibold text-gray-900 truncate">Raggiungi l’ingresso</span>
    //             <span class="text-sm text-gray-600">+20 XP</span>
    //         </div>
    //         <p class="text-sm text-gray-600 truncate">Trova l’accesso segreto</p>
    //     </div>
    // </div>

    missionContainer.innerHTML +=
        `<button class="interactive completable spot-mission" ${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}">
            <!-- Stato -->
            <span class="mission-radio"></span>
            <!-- Contenuto -->
            <div class="vertical-ctn min-w-0 w-full">
                <div class="between-ctn w-full">
                    <span class="mission-title">${missionTemplate.Name}</span>
                    <span class="text-sm text-gray-600">+${missionTemplate.Reward.Experience} XP</span>
                </div>
                <p class="flex items-start text-sm text-gray-600 truncate">${missionTemplate.Description}</p>
            </div>
        </button>`;
}

function generateHTMLActiveSpotCard(place, progress, missions) {
    const mainCtn = document.querySelector('.main-goals-page')
    const spotCtn = mainCtn.querySelector('.spot-card');
    spotCtn.setAttribute(SPOT_ATTRIBUTE.ID, place.id);
    const percentProgress = Math.min(100, (progress / missions.length) * 100);

    spotCtn.innerHTML +=
        `<!-- Spot info -->
        <div class="spot-header open">
            <!-- Header -->
            <div class="between-ctn pb-2">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="text-[17px] font-semibold text-gray-900 truncate">${place.nome}</span>
                    <span class="shrink-0 rounded-full border border-white/30 bg-white/40 px-2.5 py-0.5 text-xs text-gray-600">
                        ${place.idCategoria}
                    </span>
                </div>
    
                <!-- Chevron -->
                <svg class="spot-arrow" fill="none" stroke="currentColor" stroke-width="2"
                 viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                </svg>
<!--                    <span class="text-lg text-gray-500 transition-transform duration-200">⌄</span>-->
            </div>
            <!-- Progress -->
            <div class="center-ctn gap-3">
                <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                    <div class="absolute inset-y-0 left-0 rounded-full bg-blue-500" 
                        style="width: ${percentProgress}%;" ${SPOT_ATTRIBUTE.PROGRESS_BAR}></div>
                </div>
                <span class="min-w-9 text-right text-sm text-gray-600" ${SPOT_ATTRIBUTE.PROGRESS}>
                    ${progress} / ${missions.length}
                </span>
            </div>
        </div>
        <!-- Missions -->
        <div class="vertical-ctn-g2 missions-spot open" data-carousel-type="vertical" data-size="mm">
        </div>`;

    const spotCard = document.querySelector(`.spot-card[${SPOT_ATTRIBUTE.ID}="${place.id}"]`);
    const missionCtn = spotCard.querySelector('.missions-spot');
    generateSpotMissions(missionCtn, missions)
    initializeEventOpenCloseSpotMissions(spotCard)
}

function generateHTMLInactiveSpotCard(place, progress, missions) {
    const spotCtn = document.querySelector('.all-spots-missions-ctn');
    const percentProgress = Math.min(100, (progress / missions.length) * 100);

    spotCtn.insertAdjacentHTML("beforeend",
        `<div class="glass-medium interactive spot-card" ${SPOT_ATTRIBUTE.ID}="${place.id}">
            <div class="spot-header">
                <!-- Header -->
                <div class="between-ctn pb-2">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="text-[17px] font-semibold text-gray-900 truncate">${place.nome}</span>
                        <span class="shrink-0 rounded-full border border-white/30 bg-white/40 px-2.5 py-0.5 text-xs text-gray-600">
                            ${place.idCategoria}
                        </span>
                    </div>
        
                    <!-- Chevron -->
                    <svg class="spot-arrow" fill="none" stroke="currentColor" stroke-width="2"
                     viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
<!--                    <span class="text-lg text-gray-500 transition-transform duration-200">⌄</span>-->
                </div>
                <!-- Progress -->
                <div class="center-ctn gap-3">
                    <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                        <div class="absolute inset-y-0 left-0 rounded-full bg-blue-500" style="width: ${percentProgress}%;"></div>
                    </div>
                    <span class="min-w-9 text-right text-sm text-gray-600" ${SPOT_ATTRIBUTE.PROGRESS}>
                        ${progress} / ${missions.length}
                    </span>
                </div>
            </div>
            <!-- Missioni -->
            <div class="vertical-ctn-g2 missions-spot" data-carousel-type="vertical" data-size="mm">
            </div>
        </div>`);

    const spotCard = spotCtn.querySelector(`.spot-card[${SPOT_ATTRIBUTE.ID}="${place.id}"]`);
    const missionCtn = spotCard.querySelector('.missions-spot');
    generateSpotMissions(missionCtn, missions)
    initializeEventOpenCloseSpotMissions(spotCard)
}
