import {initializeMissionsBar} from "./missionsTypeBar.js";
import {initializeSpotsMissions} from "./spotsMissions.js";

export async function initializeGoals() {
    await initializeMissionsBar();
    await initializeSpotsMissions()

    console.log("Goals module initialized");
}
