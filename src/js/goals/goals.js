import {initializeMissionsBar} from "./missionsTypeBar.js";
import {initializeSpotsMissions} from "./spotsMissions.js";
import {initializeTypeMissions} from "./typeMissions.js";
import {generateCompletable} from "./missionCompletable.js";
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
