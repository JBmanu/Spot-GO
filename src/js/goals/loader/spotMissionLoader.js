import {activeSpotMissionProgressByUser} from "../db/userMissionProgressConnector.js";

export async function loadSpotMissions() {
    const activeSpotMissions = await activeSpotMissionProgressByUser()
    const countCompletedMissions = activeSpotMissions.filter(mission => mission.missionProgress.IsCompleted)
    console.log("Loaded active spot missions: " + activeSpotMissions)

    generateActiveSpotMissions(
        activeSpotMissions[0].place.nome,
        activeSpotMissions[0].place.idCategoria,
        countCompletedMissions.length,
        activeSpotMissions.length,
        activeSpotMissions
    )

}

function generateActiveSpotMissions(placeName, category, progress, allProgress, activeMissions) {
    const spotCtn = document.querySelector('.spot-card');

    spotCtn.innerHTML +=
        `<!-- Spot info -->
        <div class="between-ctn spot-header open">
            <!-- Icona + Luogo -->
            <div class="vertical-ctn">
                <h2 class="text-lg font-semibold text-gray-800 truncate">${placeName}</h2>
                <div class="flex items-center gap-1">
                    <img src="../assets/icons/homepage/Fast%20Food.svg" class="w-4 h-4" alt=""/>
                    <span class="text-xs text-gray-700">${category}</span>
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
                                ${progress}/${allProgress}
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

    const missionCtn = spotCtn.querySelector('.missions-spot');
    activeMissions.forEach(mission => generateSpotMissions(
        missionCtn,
        mission.missionProgress.id,
        mission.missionTemplate.Name,
        mission.missionTemplate.Description,
        mission.missionTemplate.Reward.Experience))
}

// Generate spots
function generateAllSpots(selector, title, category, progress, allProgress) {
    // spot-card-ctn serve per contenere tutte le missioni degli spot attivati
    const spotCtn = document.querySelector(selector);
    spotCtn.innerHTML +=
        `<div class="glass-medium interactive spot-card">
            <!-- Spot info -->
            <div class="between-ctn spot-header">
                <!-- Icona + Luogo -->
                <div class="vertical-ctn">
                    <h2 class="text-lg font-semibold text-gray-800 truncate"> ${title} </h2>
                    <div class="flex items-center gap-1">
                        <img src="../assets/icons/homepage/Fast%20Food.svg" class="w-4 h-4" alt=""/>
                        <span class="text-xs text-gray-700">${category}</span>
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
                            ${progress}/${allProgress}
                        </span>
                    </div>
                </div>
            </div>
            <!-- Missions -->
            <div class="vertical-ctn-g2 missions-spot pt-0" data-carousel-type="vertical" data-size="mm">
            
            </div>          
        </div>`;

}

// Generate spot missions
function generateSpotMissions(missionContainer, id, title, description, exp) {
    missionContainer.innerHTML +=
        `<button class="between-ctn interactive spot-mission completable card" db-id="${id}">
            <!-- Left -->
            <div class="vertical-ctn-g1">
                <!-- Title -->
                <h3 class="flex items-start font-semibold text-gray-800"> ${title} </h3>
                <!-- Description -->
                <p class="text-xs text-gray-600">${description}</p>
            </div>
            <!-- Reward -->
            <div class="center-ctn">
                <span class="font-semibold text-green-600">+${exp} XP</span>
                <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt=""/>
            </div>
        </button>`;
}
