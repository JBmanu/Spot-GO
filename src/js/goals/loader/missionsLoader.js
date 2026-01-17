export async function missionsLoad() {
    for (let i = 0; i < 20; i++) {
        generateAllSpots('.all-spots-missions-ctn', "Luogo luogoso", "Cibo", i, 3)
    }

    for (let i = 0; i < 3; i++) {
        generateSpotMissions(
            '.missions-spot',
            "Scatta la foto",
            "Usa quella fotocamera del cellulare, ora!",
            100)
    }

    // for (let i = 0; i < 2; i++) {
    //     generateDailyMissions(
    //         "Daily Mission",
    //         "Complete daily activities",
    //         50,
    //         i,
    //         2)
    // }
    for (let i = 0; i < 3; i++) {
        generateThemeMissions(
            "Theme Mission",
            "Complete daily activities",
            100,
            i,
            3)
    }
    for (let i = 0; i < 4; i++) {
        generateLevelMissions(
            "Level Mission",
            "Complete daily activities",
            150,
            i,
            4)
    }
}

// Generate active spot missions
// function generateActiveSpotMissions() {
//     generateSpotMissions(
//         '.missions-spot',
//         "Scatta la foto",
//         "Usa quella fotocamera del cellulare, ora!",
//         100)
// }

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
                    <!-- Arrow -->
<!--                    <svg class="spot-arrow" fill="none" stroke="currentColor" stroke-width="2"-->
<!--                        viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">-->
<!--                        <path d="m6 9 6 6 6-6"/>-->
<!--                    </svg>-->
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
                    <p class="text-xs text-gray-600"> ${description} </p>
                </div>
                <!-- Reward -->
                <div class="center-ctn">
                    <span class="font-semibold text-green-600">+${exp} XP</span>
                    <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt=""/>
                </div>
            </button>`;
    })
}

// Generate Daily missions
function generateDailyMissions(title, description, exp, progress, allProgress) {
    const dailyCtn = document.querySelectorAll('.missions-card');
    dailyCtn[0].innerHTML +=
        `<div class="between-ctn glass-strong interactive completable px-5 py-4 card">
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

// Generate Theme missions
function generateThemeMissions(title, description, exp, progress, allProgress) {
    const themeCtn = document.querySelectorAll('.missions-card');
    themeCtn[1].innerHTML +=
        `<div class="between-ctn glass-strong interactive completable px-5 py-4 card">
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

// Generate Level missions
function generateLevelMissions(title, description, exp, progress, allProgress) {
    const levelCtn = document.querySelectorAll('.missions-card');
    levelCtn[2].innerHTML +=
        `<div class="between-ctn glass-strong interactive completable px-5 py-4 card">
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