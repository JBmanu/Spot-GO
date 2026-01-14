import {initializeMissionsBar} from "./missionsTypeBar.js";
import {initializeSpotsMissions} from "./spotsMissions.js";
import {initializeMissions} from "./missions.js";
import {initializeCompletable} from "./missionCompletable.js";

let isInitialized = false;

export async function initializeGoals() {
    if (isInitialized) return;
    isInitialized = true;
    await initializeSpotsMissions();
    await initializeMissionsBar();
    await initializeMissions();
    await initializeCompletable();

    console.log("Goals module initialized");
}
