import {initializeMissionsBar} from "./interaction/missionsTypeBar.js";
import {initializeSpotsMissions} from "./interaction/spotsMissions.js";
import {initializeTypeMissions} from "./interaction/typeMissions.js";
import {generateCompletable} from "./interaction/missionCompletable.js";
import {generateMissions} from "./generate/generateMissions.js";
import {initializedAllSpotsMissions} from "./interaction/allSpotsMissions.js";
import {seedBadges} from "./loader/badgeLoader.js";
import {seedDiscounts} from "./loader/discountLoader.js";
import {seedMissionTemplates} from "./loader/missionTemplateLoader.js";
import {getCurrentUser} from "../database.js";

let isInitialized = false;

export async function initializeGoals() {
    if (isInitialized) return;
    isInitialized = true;

    // DB
    await seedBadges();
    await seedDiscounts();
    await seedMissionTemplates();

    // Generate
    await generateMissions();
    await generateCompletable();

    // Interaction
    await initializeSpotsMissions();
    await initializedAllSpotsMissions();
    await initializeMissionsBar();
    await initializeTypeMissions();

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