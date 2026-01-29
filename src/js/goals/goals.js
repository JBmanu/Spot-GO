import {initializeMissionsBar} from "./interaction/missionsTypeBar.js";
import {initializeTypeMissions} from "./interaction/typeMissions.js";
import {initializeCompletable} from "./interaction/missionCompletable.js";
import {loadSpotMissions} from "./loader/spotMissionLoader.js";
import {initializedAllSpotsMissions} from "./interaction/allSpotsMissions.js";
import {seedBadges} from "./db/seed/badgeSeed.js";
import {seedDiscounts} from "./db/seed/discountSeed.js";
import {seedMissionTemplates} from "./db/seed/missionTemplateSeed.js";
import {loadMissions} from "./loader/missionLoader.js";
import {seedUserMissionProgress} from "./db/seed/userMissionProgressSeed.js";
import {runAllAsyncSafe} from "./utils.js";
import {testActiveTriggers} from "./missionsTrigger.js";
import {resetCurrentUserLevel} from "./db/userGoalsConnector.js";

let isInitialized = false;

export async function initializeGoals() {

    console.log("INITIALIZING Goals module...");
    if (isInitialized) return;
    isInitialized = true;

    // // User level
    // await resetCurrentUserLevel()
    //
    // // Seed DB
    // await runAllAsyncSafe(seedBadges, seedDiscounts)
    // await seedMissionTemplates();
    // await seedUserMissionProgress();

    // Loader
    await runAllAsyncSafe(loadSpotMissions, loadMissions)

    // Interaction
    await initializedAllSpotsMissions();
    await initializeMissionsBar();
    await initializeTypeMissions();
    await initializeCompletable();

    // Test triggers
    await testActiveTriggers()

    console.log("Goals module initialized");
}

// export async function loadAllMissions() {
//     await runAllAsyncSafe(loadSpotMissions, loadMissions)
// }
