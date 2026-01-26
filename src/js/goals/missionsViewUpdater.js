import {MISSION_TYPE} from "./db/seed/missionTemplateSeed.js";
import {MISSION_ATTRIBUTE, SPOT_ATTRIBUTE} from "./Datas.js";

function missionHTMLFrom(mission) {
    let missionSelectors = `[${MISSION_ATTRIBUTE.ID}="${mission.id}"]`;

    if (mission.template.Type === MISSION_TYPE.SPOT) {
        const placeSelectors = `[${SPOT_ATTRIBUTE.ID}="${mission.place.id}"]`;
        const placeHTML = document.querySelector(placeSelectors);
        return placeHTML.querySelectorAll(missionSelectors);
    } else {
        return document.querySelectorAll(missionSelectors);
    }
}

export function updateViewMission(missions, mission, updatedData) {
    let missionSelectors = `[${MISSION_ATTRIBUTE.ID}="${mission.id}"]`;

    if (mission.template.Type === MISSION_TYPE.SPOT) {
        const placeSelectors = `[${SPOT_ATTRIBUTE.ID}="${mission.place.id}"]`;
        const placeHTML = document.querySelector(placeSelectors);
        const progress = placeHTML.querySelector(`[${SPOT_ATTRIBUTE.PROGRESS}]`)
        const missionHTML = placeHTML.querySelector(missionSelectors);

        if (updatedData.isCompleted) {
            console.log("MISSIONS: ", missions);
            const completedMissions = missions.filter(m => m.progress.IsCompleted).length + 1;
            progress.innerHTML = `${completedMissions} / ${missions.length}`;
        }
    } else {
        const missionHTML = document.querySelector(missionSelectors);
        const progress = missionHTML.querySelector(`[${MISSION_ATTRIBUTE.PROGRESS}]`)
        progress.innerHTML = `${updatedData.updatedValue} / ${updatedData.target}`;
    }

}