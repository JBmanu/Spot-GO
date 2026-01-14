import {initializeMissionsBar} from "./interaction/missionsTypeBar.js";
import {initializeSpotsMissions} from "./interaction/spotsMissions.js";
import {initializeTypeMissions} from "./interaction/typeMissions.js";
import {generateCompletable} from "./interaction/missionCompletable.js";
import {generateMissions} from "./generateMissions.js";
import {initializedAllSpotsMissions} from "./interaction/allSpotsMissions.js";

let isInitialized = false;

export async function initializeGoals() {
    if (isInitialized) return;
    isInitialized = true;

    // Generate
    await generateMissions();
    await generateCompletable();

    // Interaction
    await initializeSpotsMissions();
    await initializedAllSpotsMissions();
    await initializeMissionsBar();
    await initializeTypeMissions();

    console.log("Goals module initialized");
}
