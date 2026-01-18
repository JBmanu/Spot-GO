import {initializeMissionsBar} from "./interaction/missionsTypeBar.js";
import {initializeSpotsMissions} from "./interaction/spotsMissions.js";
import {initializeTypeMissions} from "./interaction/typeMissions.js";
import {initializeCompletable} from "./interaction/missionCompletable.js";
import {missionsLoad} from "./loader/spotMissionLoader.js";
import {initializedAllSpotsMissions} from "./interaction/allSpotsMissions.js";
import {seedBadges} from "./db/seed/badgeSeed.js";
import {seedDiscounts} from "./db/seed/discountSeed.js";
import {seedMissionTemplates} from "./db/seed/missionTemplateSeed.js";
import {getCurrentUser} from "../database.js";
import {loadDailyMissions} from "./loader/missionLoader.js";

let isInitialized = false;

export async function initializeGoals() {
    if (isInitialized) return;
    isInitialized = true;

    // Seed DB
    await seedBadges();
    await seedDiscounts();
    await seedMissionTemplates();

    // Loader
    await missionsLoad();
    await loadDailyMissions();

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

// Verifica se l'utente è autenticato, altrimenti logga un errore.
export async function isAuthenticatedUser() {
    const user = await getCurrentUser();
    if (!user) console.error("Utente non autenticato");
    return user
}