import {initializeMissionsBar} from "./interaction/missionsTypeBar.js";
import {initializeTypeMissions} from "./interaction/typeMissions.js";
import {initializeCompletable} from "./interaction/missionCompletable.js";
import {loadSpotMissions} from "./loader/spotMissionLoader.js";
import {initializedAllSpotsMissions} from "./interaction/allSpotsMissions.js";
import {MISSION_TYPE, seedMissionTemplates} from "./db/seed/missionTemplateSeed.js";
import {loadMissions, sortMissionsByProgressOf} from "./loader/missionLoader.js";
import {runAllAsyncSafe} from "./utils.js";
import {testActiveTriggers} from "./missionsTrigger.js";
import {updateDailyMissionsIfNextDay} from "./db/userMissionProgressConnector.js";
import {resetCurrentUserLevel} from "./db/userGoalsConnector.js";
import {seedUserMissionProgress} from "./db/seed/userMissionProgressSeed.js";
import {seedDiscounts} from "./db/seed/discountSeed.js";
import {seedBadges} from "../badge/badgeSeed.js";

let isInitialized = false;

export async function initializeGoals() {

    console.log("INITIALIZING Goals module...");
    Object.values(MISSION_TYPE).forEach(sortMissionsByProgressOf)
    if (isInitialized) return;
    isInitialized = true;

    // Reset user datas
    // await resetCurrentUserLevel()

    // Seed DB
    await runAllAsyncSafe(seedBadges, seedDiscounts)
    // await seedMissionTemplates();
    // await seedUserMissionProgress();

    // Update daily missions if new day
    await updateDailyMissionsIfNextDay()

    // Loader
    await runAllAsyncSafe(loadSpotMissions, loadMissions)

    // Interaction
    await initializedAllSpotsMissions();
    await initializeMissionsBar();
    await initializeTypeMissions();
    await initializeCompletable();

    // Test triggers
    await testActiveTriggers()
    Object.values(MISSION_TYPE).forEach(sortMissionsByProgressOf)
    console.log("Goals module initialized");
}

// export async function loadAllMissions() {
//     await runAllAsyncSafe(loadSpotMissions, loadMissions)
// }
