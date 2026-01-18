import {initializeMissionsBar} from "./interaction/missionsTypeBar.js";
import {initializeSpotsMissions} from "./interaction/spotsMissions.js";
import {initializeTypeMissions} from "./interaction/typeMissions.js";
import {initializeCompletable} from "./interaction/missionCompletable.js";
import {loadSpotMissions} from "./loader/spotMissionLoader.js";
import {initializedAllSpotsMissions} from "./interaction/allSpotsMissions.js";
import {seedBadges} from "./db/seed/badgeSeed.js";
import {seedDiscounts} from "./db/seed/discountSeed.js";
import {seedMissionTemplates} from "./db/seed/missionTemplateSeed.js";
import {loadMissions} from "./loader/missionLoader.js";
import {seedUserMissionProgress} from "./db/seed/userMissionProgressSeed.js";

let isInitialized = false;

export async function initializeGoals() {
    if (isInitialized) return;
    isInitialized = true;

    // Seed DB
    await seedBadges();
    await seedDiscounts();
    await seedMissionTemplates();
    await seedUserMissionProgress();

    // Loader
    await loadSpotMissions();
    await loadMissions();

    // Interaction
    await initializeSpotsMissions();
    await initializedAllSpotsMissions();
    await initializeMissionsBar();
    await initializeTypeMissions();
    await initializeCompletable();

    // Test
    // const missionDataId = await createMissionData("Scatta una foto :) ...", "Spot", "Foto");
    // await createMission("aaaaaa", missionDataId, "Foto", 5);


    console.log("Goals module initialized");
}

