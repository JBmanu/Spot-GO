import {
    addSpotCompletedOfCurrentUser, BADGE_COLLECTION_STRUCTURE,
    badgeValuesOfCurrentUser,
    clearBadges,
    createBadge, incrementBadgeCounterOfCurrentUser,
    spotCompletedOfCurrentUser
} from "../badgeConnector.js";
import {createDocumentRef} from "../goalsConnector.js";
import {COLLECTIONS} from "../../Datas.js";
import {MISSION_TYPE} from "./missionTemplateSeed.js";
import {getAllUsers} from "../../../database.js";

// 🎯 Badge catalogo in ITALIANO
const BADGES_TO_CREATE = [
    // --- SPOT ---
    {
        Name: "Esploratore Principiante",
        Description: "Completa la tua prima missione spot",
        Icon: null,
        UnlockConditionType: "spot",
        UnlockValue: 1
    },
    {
        Name: "Guida Locale",
        Description: "Scrivi una recensione per uno spot",
        Icon: null,
        UnlockConditionType: "spot",
        UnlockValue: 1
    },
    {
        Name: "Creatore di Ricordi",
        Description: "Crea una Polaroid in uno spot",
        Icon: null,
        UnlockConditionType: "spot",
        UnlockValue: 1
    },
    {
        Name: "Cacciatore di Spot",
        Description: "Completa 10 missioni spot",
        Icon: null,
        UnlockConditionType: "spot",
        UnlockValue: 10
    },

    // --- DAILY ---
    {
        Name: "Giornata Iniziata",
        Description: "Completa una missione giornaliera",
        Icon: null,
        UnlockConditionType: "daily",
        UnlockValue: 1
    },
    {
        Name: "Rituale Quotidiano",
        Description: "Completa 7 missioni giornaliere",
        Icon: null,
        UnlockConditionType: "daily",
        UnlockValue: 7
    },
    {
        Name: "Costanza Assoluta",
        Description: "Completa 30 missioni giornaliere",
        Icon: null,
        UnlockConditionType: "daily",
        UnlockValue: 30
    },

    // --- THEME / TEMA ---
    {
        Name: "Buongustaio",
        Description: "Scatta foto in spot della categoria cibo",
        Icon: null,
        UnlockConditionType: "theme",
        UnlockValue: 5
    },
    {
        Name: "Amante della Natura",
        Description: "Completa 3 missioni in spot natura",
        Icon: null,
        UnlockConditionType: "theme",
        UnlockValue: 3
    },
    {
        Name: "Collezionista di Cultura",
        Description: "Completa 5 missioni in luoghi d'arte o storici",
        Icon: null,
        UnlockConditionType: "theme",
        UnlockValue: 5
    },
    {
        Name: "Uomo Misterioso",
        Description: "Completa 10 missioni in spot a tema mistero",
        Icon: null,
        UnlockConditionType: "theme",
        UnlockValue: 10
    },

    // --- LEVEL / LIVELLI ---
    {
        Name: "Livello 5",
        Description: "Raggiungi il livello 5",
        Icon: null,
        UnlockConditionType: "level",
        UnlockValue: 5
    },
    {
        Name: "Livello 10",
        Description: "Raggiungi il livello 10",
        Icon: null,
        UnlockConditionType: "level",
        UnlockValue: 10
    },
    {
        Name: "Esploratore d'Élite",
        Description: "Raggiungi il livello 20",
        Icon: null,
        UnlockConditionType: "level",
        UnlockValue: 20
    },

    // --- META / MISTA ---
    {
        Name: "Grande Viaggiatore",
        Description: "Completa missioni di tutti i tipi",
        Icon: null,
        UnlockConditionType: "mixed",
        UnlockValue: 1
    },
    {
        Name: "Collezionista",
        Description: "Ottieni 10 badge",
        Icon: null,
        UnlockConditionType: "mixed",
        UnlockValue: 10
    },
    {
        Name: "Maestro delle Missioni",
        Description: "Completa 100 missioni di qualsiasi tipo",
        Icon: null,
        UnlockConditionType: "mixed",
        UnlockValue: 100
    }
];


export async function seedBadges() {
    await clearBadges();
    const users = (await getAllUsers())

    for (let user of users) {
        await createBadge(user.id)
    }

    await incrementBadgeCounterOfCurrentUser(BADGE_COLLECTION_STRUCTURE.MISSIONS_COMPLETED, MISSION_TYPE.SPOT, (count) => count + 20)
    const readBadges = await badgeValuesOfCurrentUser(BADGE_COLLECTION_STRUCTURE.MISSIONS_COMPLETED, MISSION_TYPE.SPOT)
    console.log(readBadges)


    await addSpotCompletedOfCurrentUser("05WOu7RbWAAnofbMZuAO")

    const spotCompleted = await spotCompletedOfCurrentUser();
    console.log(spotCompleted)



    console.log("🎉 " + BADGES_TO_CREATE.length + "Badge seeding done!");
}