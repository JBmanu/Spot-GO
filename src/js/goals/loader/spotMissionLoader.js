import {
    hydrateActiveSpotMissionsOfCurrentUser,
    hydrateInactiveSpotMissionsOfCurrentUser
} from "../db/userMissionProgressConnector.js";
import {runAllAsyncSafe} from "../utils.js";
import {CHECKBOX_ICON_PATH, MISSION_ATTRIBUTE, SPOT_ATTRIBUTE} from "../Datas.js";
import {initializeEventOpenCloseSpotMissions} from "../interaction/spotsMissions.js";
import {CATEGORY_ICON_PATH} from "../db/seed/missionTemplateSeed.js";
import {markMissionAsCompleted} from "../interaction/missionCompletable.js";


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
    missions.forEach(mission => generateHTMLSpotMissions(missionCtn, mission))
}

function generateHTMLSpotMissions(missionContainer, mission) {
    const missionTemplate = mission.template
    missionContainer.innerHTML +=
        `
        <div class="spot-mission-isolated">
            <button class="glass-medium interactive completable mission spot-mission" ${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}">
            <!-- Stato -->
            <img src="${CHECKBOX_ICON_PATH.EMPTY}" class="mission-checkbox" alt="" ${MISSION_ATTRIBUTE.CHECKBOX}/>
            <!-- Contenuto -->
            <div class="vertical-ctn gap-1.5 min-w-0 w-full">
                <div class="between-ctn w-full">
                    <span class="mission-title">${missionTemplate.Name}</span>
                    <span class="spot-mission-exp">+${missionTemplate.Reward.Experience} XP</span>
                </div>
                <p class="mission-title-description">${missionTemplate.Description}</p>
            </div>
            </button>
        </div>
`;

    if (mission.progress.IsCompleted) {
        const missionEl = missionContainer.querySelector(`[${MISSION_ATTRIBUTE.ID}="${missionTemplate.id}"]`);
        markMissionAsCompleted(missionEl)
    }
}


function generateHTMLActiveSpotCard(place, progress, missions) {
    const mainCtn = document.querySelector('.main-goals-page')
    const spotCtn = mainCtn.querySelector('.spot-card');
    spotCtn.setAttribute(SPOT_ATTRIBUTE.ID, place.id);
    const percentProgress = Math.min(100, (progress / missions.length) * 100);
    const iconPath = CATEGORY_ICON_PATH[place.idCategoria]
    spotCtn.innerHTML +=
        `<!-- Spot info -->
        <div class="spot-header open" style="pointer-events: none;" data-spot-category="${place.idCategoria}">
            <!-- Header -->
            <div class="between-ctn">
                <div class="vertical-ctn w-full">
                    <div class="between-ctn">
                        <span class="text-[17px] font-semibold text-gray-900 truncate">${place.nome}</span>
<!--                        <svg class="spot-arrow rotate-0" fill="none" stroke="currentColor" stroke-width="2"-->
<!--                            viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">-->
<!--                            <path d="m6 9 6 6 6-6"/>-->
<!--                        </svg>-->
                    </div>
                    <div class="center-ctn gap-1 spot-category"">
                        <img src="${iconPath}" class="spot-category-icon" alt=""/>
                        <span class="spot-category-title">${place.idCategoria}</span>
                    </div>
                </div>
            </div>
            <!-- Progress -->
            <div class="center-ctn gap-3">
                <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                    <div class="absolute inset-y-0 left-0 rounded-full bg-[var(--color-text)]" 
                        style="width: ${percentProgress}%;" ${SPOT_ATTRIBUTE.PROGRESS_BAR}></div>
                </div>
                <span class="min-w-9 text-right text-base font-medium text-gray-600" ${SPOT_ATTRIBUTE.PROGRESS}>
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
    const iconPath = CATEGORY_ICON_PATH[place.idCategoria]

    spotCtn.insertAdjacentHTML("beforeend",
        `<div class="glass-medium interactive spot-card" ${SPOT_ATTRIBUTE.ID}="${place.id}">
            <div class="spot-header">
                <!-- Header -->
                <div class="between-ctn pb-1">
                    <div class="vertical-ctn w-full">
                        <div class="between-ctn">
                            <span class="text-[17px] font-semibold text-gray-900 truncate">${place.nome}</span>
                            <svg class="spot-arrow" fill="none" stroke="currentColor" stroke-width="2"
                                viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        </div>
                        <div class="center-ctn gap-1 spot-category" data-spot-category="${place.idCategoria}">
                            <img src="${iconPath}" class="spot-category-icon" alt=""/>
                            <span class="spot-category-title">${place.idCategoria}</span>
                        </div>
                    </div>
                </div>
                <!-- Progress -->
                <div class="center-ctn gap-3">
                    <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                        <div class="absolute inset-y-0 left-0 rounded-full bg-[var(--color-text)]" 
                            style="width: ${percentProgress}%;" ${SPOT_ATTRIBUTE.PROGRESS_BAR}></div>
                    </div>
                    <span class="min-w-9 text-right text-base font-medium text-gray-600" ${SPOT_ATTRIBUTE.PROGRESS}>
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
