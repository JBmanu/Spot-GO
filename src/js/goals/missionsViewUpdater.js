import {MISSION_TYPE} from "./db/seed/missionTemplateSeed.js";
import {MISSION_ATTRIBUTE, SPOT_ATTRIBUTE} from "./Datas.js";
import {hydrateCurrentUserSpotMissionsOf} from "./db/userMissionProgressConnector.js";


export function updateViewMission(missions, mission, updatedData) {
    let missionSelectors = `[${MISSION_ATTRIBUTE.ID}="${mission.id}"]`;

    if (mission.template.Type === MISSION_TYPE.SPOT) {
        const placeSelectors = `[${SPOT_ATTRIBUTE.ID}="${mission.place.id}"]`;
        const placeHTML = document.querySelector(placeSelectors);
        const progress = placeHTML.querySelector(`[${SPOT_ATTRIBUTE.PROGRESS}]`)

        if (updatedData.isCompleted) {
            const completedMissions = missions.filter(m => m.progress.IsCompleted).length + 1;
            progress.textContent = `${completedMissions} / ${missions.length}`;
        }
    } else {
        const missionHTML = document.querySelector(missionSelectors);
        const progress = missionHTML.querySelector(`[${MISSION_ATTRIBUTE.PROGRESS}]`)
        progress.textContent = `${updatedData.updatedValue} / ${updatedData.target}`;
    }
}

export async function updateViewSpotDetails(spotData, overlayEl) {
    console.log("DATA SPOT FOR UPDATE ", spotData);
    console.log("Initialize spot detail handlers ", overlayEl);
    const spotMissions = await hydrateCurrentUserSpotMissionsOf(spotData.id)

    // MANCA SE NON CI SONO MISSIONI
    // da far vedere una scritta tipo "no missions available"

    // Count all missions
    const totalEl = overlayEl.querySelector('#spot-missions-total');
    totalEl.textContent = spotMissions.length;

    // Count completed missions
    const countCompleted = spotMissions.filter(mission => mission.progress.IsCompleted).length
    const completedEl = overlayEl.querySelector('#spot-missions-completed');
    completedEl.textContent = countCompleted;
}
