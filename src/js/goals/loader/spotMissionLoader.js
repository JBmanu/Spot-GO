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
    // <!-- Left -->
    // <div class="vertical-ctn-g1">
    //     <!-- Title -->
    //     <h3 class="flex items-start font-semibold text-gray-800"> ${missionTemplate.Name} </h3>
    //     <!-- Description -->
    //     <p class="text-xs text-gray-600">${missionTemplate.Description}</p>
    // </div>
    // <!-- Reward -->
    // <div class="center-ctn">
    //     <span class="font-semibold text-green-600">+${missionTemplate.Reward.Experience} XP</span>
    //     <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt=""/>
    // </div>


    // <!-- Stato -->
    // <span class="flex-shrink-0 mt-1 w-4 h-4 rounded-full bg-blue-500"></span>
    // <!-- Attiva: bg-blue-500, Completata: bg-green-500, Bloccata: bg-gray-300 -->
    //
    // <!--                    <span class="flex-shrink-0 mt-1 w-4 h-4 rounded-full bg-green-500"></span>-->
    // <!--                    <span class="text-[16px] font-semibold text-gray-400 line-through truncate">Attiva il meccanismo</span>-->
    //
    // <!-- Contenuto -->
    // <div class="flex-1 min-w-0">
    //     <div class="flex items-center justify-between">
    //         <span class="text-[16px] font-semibold text-gray-400 line-through truncate"> Raggiungi l’ingresso </span>
    //         <!--                            <span class="text-[16px] font-semibold text-gray-900 truncate"> Raggiungi l’ingresso </span>-->
    //         <span class="text-sm text-gray-600">+20 XP</span>
    //     </div>
    //     <p class="text-sm text-gray-600 truncate">Trova l’accesso segreto</p>
    // </div>

    missionContainer.innerHTML +=
        `<button class="between-ctn interactive spot-mission completable card" 
            ${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}">
            <!-- Stato -->
            <span class="shrink-0 mt-1 w-4 h-4 rounded-full bg-blue-500"></span>
            <!-- Contenuto -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <span class="text-[16px] font-semibold text-gray-400 line-through truncate">${missionTemplate.Name}</span>
                    <span class="text-sm text-gray-600">+${missionTemplate.Reward.Experience} XP</span>
                </div>
                <p class="text-sm text-gray-600 truncate">${missionTemplate.Description}</p>
            </div>
        </button>`;
}

function generateHTMLActiveSpotCard(place, progress, missions) {
    const mainCtn = document.querySelector('.main-goals-page')
    const spotCtn = mainCtn.querySelector('.spot-card');
    spotCtn.setAttribute(SPOT_ATTRIBUTE.ID, place.id);

    // <div className="spot-header">
    //     <!-- Header -->
    //     <div className="flex items-center justify-between mb-4">
    //         <div className="flex items-center gap-3 min-w-0">
    //             <span className="text-[17px] font-semibold text-gray-900 truncate">${place.nome}</span>
    //
    //             <div className="shrink-0 rounded-full border border-white/30 bg-white/40 px-2.5 py-0.5 text-xs text-gray-600">
    //                 <img src="../assets/icons/homepage/Fast%20Food.svg" className="w-4 h-4" alt=""/>
    //                 <span className="text-xs text-gray-700">${place.idCategoria}</span>
    //             </div>
    //         </div>
    //
    //         <!-- Arrow -->
    //         <svg class="spot-arrow" fill="none" stroke="currentColor" stroke-width="2"
    //              viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
    //             <path d="m6 9 6 6 6-6"/>
    //         </svg>
    //     </div>
    //     <!-- Progress -->
    //     <div className="flex items-center gap-3">
    //         <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
    //             <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
    //                  style="width: ${percentProgress}%;"></div>
    //         </div>
    //         <span className="min-w-9 text-right text-sm text-gray-600" ${SPOT_ATTRIBUTE.PROGRESS}>
    //                     ${progress} / ${missions.length}
    //                 </span>
    //     </div>
    // </div>

    const percentProgress = Math.min(100, (progress / missions.length) * 100);
    spotCtn.innerHTML +=
        `<!-- Spot info -->
        <div class="spot-header">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
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
            <div class="flex items-center gap-3">
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
    // <!-- Spot info -->
    // <div class="between-ctn spot-header">
    //     <!-- Icona + Luogo -->
    //     <div class="vertical-ctn">
    //         <h2 class="text-lg font-semibold text-gray-800 truncate"> ${place.nome} </h2>
    //         <div class="flex items-center gap-1">
    //             <img src="../assets/icons/homepage/Fast%20Food.svg" class="w-4 h-4" alt=""/>
    //             <span class="text-xs text-gray-700">${place.idCategoria}</span>
    //         </div>
    //     </div>
    //     <!-- Mission progress -->
    //     <div class="center-ctn gap-2">
    //         <!-- Cerchio di progresso -->
    //         <div class="relative w-10 h-10">
    //             <svg class="w-10 h-10">
    //                 <!-- Cerchio sfondo -->
    //                 <circle cx="20" cy="20" r="18" stroke="#E5E7EB" stroke-width="4" fill="none"/>
    //                 <!-- Cerchio progresso -->
    //                 <circle cx="20" cy="20" r="18" stroke="#34D399" stroke-width="4" fill="none"
    //                         stroke-dasharray="113.097" stroke-dashoffset="22.619"
    //                         transform="rotate(-90 20 20)"/>
    //             </svg>
    //             <span class="center-ctn absolute inset-0 text-sm font-semibold text-gray-800"
    //                   ${SPOT_ATTRIBUTE.PROGRESS}>
    //                         ${progress}/${missions.length}
    //                     </span>
    //         </div>
    //     </div>
    // </div>
    // <!-- Missions -->
    // <div class="vertical-ctn-g2 missions-spot" data-carousel-type="vertical" data-size="mm">
    //
    // </div>
    const percentProgress = Math.min(100, (progress / missions.length) * 100);

    spotCtn.insertAdjacentHTML("beforeend",
        `<div class="glass-medium interactive spot-card" ${SPOT_ATTRIBUTE.ID}="${place.id}">

            <div class="spot-header">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
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
                <div class="flex items-center gap-3">
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
