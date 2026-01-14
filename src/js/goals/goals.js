import { initializeMissionsBar } from "./missionsTypeBar.js";
import { initializeSpotsMissions } from "./spotsMissions.js";
import { initializeMissions } from "./missions.js";

export async function initializeGoals() {
    await initializeSpotsMissions();
    await initializeMissionsBar();
    await initializeMissions();

    console.log("Goals module initialized");
}
