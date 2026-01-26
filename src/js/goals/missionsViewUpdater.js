import {MISSION_TYPE} from "./db/seed/missionTemplateSeed.js";
import {ATTRIBUTE_NAME} from "./Datas.js";

function missionHTMLFrom(mission) {
    let missionSelectors = `[${ATTRIBUTE_NAME.MISSION}="${mission.id}"]`;

    if (mission.template.Type === MISSION_TYPE.SPOT) {
        const placeSelectors = `[${ATTRIBUTE_NAME.SPOT}="${mission.place.id}"]`;
        const placeHTML = document.querySelector(placeSelectors);
        return placeHTML.querySelectorAll(missionSelectors);
    } else {
        return document.querySelectorAll(missionSelectors);
    }
}

export function updateViewMission(mission, updatedData) {
    console.log("NAME: ", mission.template.Name)
    const missionHTML = missionHTMLFrom(mission)

}