import {
    hydrateActiveSpotMissionsOfCurrentUser,
    hydrateInactiveSpotMissionsOfCurrentUser
} from "../db/userMissionProgressConnector.js";
import {runAllAsyncSafe} from "../utils.js";
import {ATTRIBUTE_NAME} from "../Datas.js";


export async function loadSpotMissions() {
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
    missionContainer.innerHTML +=
        `<button class="between-ctn interactive spot-mission completable card" 
            ${ATTRIBUTE_NAME.MISSION}="${missionTemplate.id}">
            <!-- Left -->
            <div class="vertical-ctn-g1">
                <!-- Title -->
                <h3 class="flex items-start font-semibold text-gray-800"> ${missionTemplate.Name} </h3>
                <!-- Description -->
                <p class="text-xs text-gray-600">${missionTemplate.Description}</p>
            </div>
            <!-- Reward -->
            <div class="center-ctn">
                <span class="font-semibold text-green-600">+${missionTemplate.Reward.Experience} XP</span>
                <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt=""/>
            </div>
        </button>`;
}

function generateHTMLActiveSpotCard(place, progress, missions) {
    const spotCtn = document.querySelector('.spot-card');
    spotCtn.setAttribute(ATTRIBUTE_NAME.SPOT, place.id);
    spotCtn.innerHTML +=
        `<!-- Spot info -->
        <div class="between-ctn spot-header open">
            <!-- Icona + Luogo -->
            <div class="vertical-ctn">
                <h2 class="text-lg font-semibold text-gray-800 truncate">${place.nome}</h2>
                <div class="flex items-center gap-1">
                    <img src="../assets/icons/homepage/Fast%20Food.svg" class="w-4 h-4" alt=""/>
                    <span class="text-xs text-gray-700">${place.idCategoria}</span>
                </div>
            </div>
            <!-- Mission progress -->
            <div class="center-ctn gap-2">
                <!-- Cerchio di progresso -->
                <div class="relative w-10 h-10">
                    <svg class="w-10 h-10">
                        <!-- Cerchio sfondo -->
                        <circle cx="20" cy="20" r="18" stroke="#E5E7EB" stroke-width="4" fill="none"/>
                        <!-- Cerchio progresso -->
                        <circle cx="20" cy="20" r="18" stroke="#34D399" stroke-width="4" fill="none"
                            stroke-dasharray="113.097" stroke-dashoffset="22.619"
                            transform="rotate(-90 20 20)"/>
                    </svg>
                    <span class="center-ctn absolute inset-0 text-sm font-semibold text-gray-800">
                        ${progress}/${missions.length}
                    </span>
                    </div>
                    <!-- Arrow -->
                    <svg class="spot-arrow" fill="none" stroke="currentColor" stroke-width="2"
                        viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <!-- Missions -->
            <div class="vertical-ctn-g2 missions-spot open" data-carousel-type="vertical" data-size="mm">
            </div>`;

    const spotCard = document.querySelector(`.spot-card[${ATTRIBUTE_NAME.SPOT}="${place.id}"]`);
    const missionCtn = spotCard.querySelector('.missions-spot');
    generateSpotMissions(missionCtn, missions)
}

function generateHTMLInactiveSpotCard(place, progress, missions) {
    const spotCtn = document.querySelector('.all-spots-missions-ctn');
    spotCtn.innerHTML +=
        `<div class="glass-medium interactive spot-card" ${ATTRIBUTE_NAME.SPOT}="${place.id}">
            <!-- Spot info -->
            <div class="between-ctn spot-header">
                <!-- Icona + Luogo -->
                <div class="vertical-ctn">
                    <h2 class="text-lg font-semibold text-gray-800 truncate"> ${place.nome} </h2>
                    <div class="flex items-center gap-1">
                        <img src="../assets/icons/homepage/Fast%20Food.svg" class="w-4 h-4" alt=""/>
                        <span class="text-xs text-gray-700">${place.idCategoria}</span>
                    </div>
                </div>
                <!-- Mission progress -->
                <div class="center-ctn gap-2">
                    <!-- Cerchio di progresso -->
                    <div class="relative w-10 h-10">
                        <svg class="w-10 h-10">
                            <!-- Cerchio sfondo -->
                            <circle cx="20" cy="20" r="18" stroke="#E5E7EB" stroke-width="4" fill="none"/>
                            <!-- Cerchio progresso -->
                            <circle cx="20" cy="20" r="18" stroke="#34D399" stroke-width="4" fill="none"
                                stroke-dasharray="113.097" stroke-dashoffset="22.619"
                                transform="rotate(-90 20 20)"/>
                        </svg>
                        <span class="center-ctn absolute inset-0 text-sm font-semibold text-gray-800">
                            ${progress}/${missions.length}
                        </span>
                    </div>
                </div>
            </div>
            <!-- Missions -->
            <div class="vertical-ctn-g2 missions-spot" data-carousel-type="vertical" data-size="mm">
            
            </div>          
        </div>`;

    const spotCard = spotCtn.querySelector(`.spot-card[${ATTRIBUTE_NAME.SPOT}="${place.id}"]`);
    const missionCtn = spotCard.querySelector('.missions-spot');
    generateSpotMissions(missionCtn, missions)
}
