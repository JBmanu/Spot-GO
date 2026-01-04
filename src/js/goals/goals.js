import {initializeMissionsBar} from "./missionsTypeBar.js";

export async function initializeGoals() {
    await initializeMissionsBar();

    console.log("Goals module initialized");
}
