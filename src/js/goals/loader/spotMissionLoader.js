import {missionTemplatesByType} from "../db/missionTemplateConnector.js";
import {MISSION_TYPE} from "../db/seed/missionTemplateSeed.js";

export async function loadSpotMissions() {
    for (let i = 0; i < 20; i++) {
        generateAllSpots('.all-spots-missions-ctn', "Luogo luogoso", "Cibo", i, 3)
    }


    const missions = await missionTemplatesByType(MISSION_TYPE.SPOT)
    missions.forEach(mission =>
        generateSpotMissions(
            '.missions-spot',
            mission.Name,
            mission.Description,
            100))
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
            <div class="vertical-ctn-g2 missions-spot" data-carousel-type="vertical" data-size="mm">
            
            </div>          
        </div>`;

}

// Generate spot missions
function generateSpotMissions(selectors, title, description, exp) {
    const missionCtns = document.querySelectorAll(selectors);
    missionCtns.forEach(ctn => {
        ctn.innerHTML +=
            `<button class="between-ctn interactive spot-mission completable card">
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
    })
}
