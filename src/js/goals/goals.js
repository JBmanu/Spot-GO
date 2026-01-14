import {initializeMissionsBar} from "./interaction/missionsTypeBar.js";
import {initializeSpotsMissions} from "./interaction/spotsMissions.js";
import {initializeTypeMissions} from "./interaction/typeMissions.js";
import {generateCompletable} from "./interaction/missionCompletable.js";
import {generateMissions} from "./GenerateMissions.js";

let isInitialized = false;

export async function initializeGoals() {
    if (isInitialized) return;
    isInitialized = true;

    // Generate
    await generateMissions();
    await generateCompletable();

    // Style
    await initializeSpotsMissions();
    await initializeMissionsBar();
    await initializeTypeMissions();

    console.log("Goals module initialized");
}
