import {initializeMissionsBar} from "./missionsTypeBar.js";
import {initializeSpotsMissions} from "./spotsMissions.js";
import {initializeMissions} from "./missions.js";
import {initializeCompletable} from "./missionCompletable.js";

export async function initializeGoals() {
    await initializeSpotsMissions();
    await initializeMissionsBar();
    await initializeMissions();
    await initializeCompletable();

    console.log("Goals module initialized");
}
