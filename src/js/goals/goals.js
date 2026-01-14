import { initializeMissionsBar } from "./missionsTypeBar.js";
import { initializeSpotsMissions } from "./spotsMissions.js";
import { initializeMissions } from "./missions.js";

let isInitialized = false;

export async function initializeGoals() {
    if (isInitialized) return;
    isInitialized = true;

    await initializeSpotsMissions();
    await initializeMissionsBar();
    await initializeMissions();

    console.log("Goals module initialized");
}
