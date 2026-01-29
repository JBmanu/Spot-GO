import {MISSION_TYPE} from "./db/seed/missionTemplateSeed.js";
import {CHECKBOX_ICON_PATH as ICONBOX_ICON_PATH, MISSION_ATTRIBUTE, SPOT_ATTRIBUTE} from "./Datas.js";
import {hydrateCurrentUserSpotMissionsOf} from "./db/userMissionProgressConnector.js";
import {markMissionAsCompleted} from "./interaction/missionCompletable.js";


export function updateViewMission(missions, mission, updatedData) {
    const missionSelectors = `[${MISSION_ATTRIBUTE.ID}="${mission.id}"]`;
    const missionHTML = document.querySelector(missionSelectors);

    if (mission.template.Type === MISSION_TYPE.SPOT) {
        const placeSelectors = `[${SPOT_ATTRIBUTE.ID}="${mission.place.id}"]`;
        const placeHTML = document.querySelector(placeSelectors);
        const progress = placeHTML.querySelector(`[${SPOT_ATTRIBUTE.PROGRESS}]`)
        const progressBar = placeHTML.querySelector(`[${SPOT_ATTRIBUTE.PROGRESS_BAR}]`)
        const checkbox = missionHTML.querySelector(`[${MISSION_ATTRIBUTE.CHECKBOX}]`)

        if (updatedData.isCompleted) {
            const completedMissions = missions.filter(m => m.progress.IsCompleted).length + 1;
            progress.textContent = `${completedMissions} / ${missions.length}`;
            progressBar.style.width = `${(completedMissions / missions.length) * 100}%`;
            checkbox.src = ICONBOX_ICON_PATH.COMPLETE
            markMissionAsCompleted(missionHTML)
        }
    } else {
        const progress = missionHTML.querySelector(`[${MISSION_ATTRIBUTE.PROGRESS}]`)
        const progressBar = missionHTML.querySelector(`[${MISSION_ATTRIBUTE.PROGRESS_BAR}]`)
        progress.textContent = `${updatedData.updatedValue} / ${updatedData.target}`;
        progressBar.style.width = `${(updatedData.updatedValue / updatedData.target) * 100}%`;

        if (updatedData.isCompleted) {
            const checkbox = missionHTML.querySelector(`[${MISSION_ATTRIBUTE.CHECKBOX}]`)
            checkbox.src = ICONBOX_ICON_PATH.COMPLETE;
            markMissionAsCompleted(missionHTML)
        }
    }
}

export async function updateViewSpotDetails(spotData, overlayEl) {
    const spotMissions = await hydrateCurrentUserSpotMissionsOf(spotData.id)
    // MANCA SE NON CI SONO MISSIONI
    // da far vedere una scritta tipo "no missions available"
    if (!spotMissions) return

    // Count all missions
    const totalEl = overlayEl.querySelector('#spot-missions-total');
    totalEl.textContent = spotMissions.length;

    // Count completed missions
    const countCompleted = spotMissions.filter(mission => mission.progress.IsCompleted).length
    const completedEl = overlayEl.querySelector('#spot-missions-completed');
    completedEl.textContent = countCompleted;

    // Update each mission
    const missionsCtnEL = overlayEl.querySelector('#spot-missions-list');
    const missionEls = missionsCtnEL.querySelectorAll('.mission-banner');
    spotMissions.forEach((mission, index) => {
        const missionEl = missionEls[index];
        missionEl.textContent = mission.template.Name;
        if (mission.progress.IsCompleted) missionEl.classList.add('completed');
        else missionEl.classList.remove('completed');
    });
}
