import {clearMissionTemplates, createMissionTemplate} from "../missionTemplateConnector.js";
import {createdBadgeIds} from "./badgeSeed.js";

export const MISSION_TYPE = {
    SPOT: "Spot",
    DAILY: "Daily",
    THEME: "Theme",
    LEVEL: "Level"
}

export const CATEGORY = {
    NATURE: "nature",
    FOOD: "food",
    CULTURE: "culture",
    MYSTERY: "mystery"
}

const ICON_PREFIX = '../assets/icons/homepage/';
export const CATEGORY_ICON_PATH = {
    [CATEGORY.NATURE]: ICON_PREFIX + "Oak Tree.svg",
    [CATEGORY.FOOD]: ICON_PREFIX + "Fast Food.svg",
    [CATEGORY.CULTURE]: ICON_PREFIX + "Cathedral.svg",
    [CATEGORY.MYSTERY]: ICON_PREFIX + "Desura.svg",
}


export const ACTION_TYPE = {
    LOGIN: "login",
    FOTO: "fai_foto",
    REVIEW: "scrivi_recensione",
    CREATE_POLAROID: "crea_polaroid",
    SHARE_POLAROID: "condividi_polaroid",
    COMPLETE_MISSIONS: "completa_missioni",
    REACH_LEVEL: "raggiungi_livello",
    OBTAIN_BADGE: "ottieni_badge"
}

const MISSION_TEMPLATES = [
    // 🏞 SPOT
    {
        Name: "Scatta una foto",
        Description: "Immortala la magia in un click!",
        Type: MISSION_TYPE.SPOT,
        Category: null,
        Action: ACTION_TYPE.FOTO,
        Target: 1,
        Reward: {Experience: 20, BadgeId: createdBadgeIds[0], DiscountId: null}
    },
    {
        Name: "Scrivi una recensione",
        Description: "Racconta cosa ti ha fatto battere il cuore!",
        Type: MISSION_TYPE.SPOT,
        Category: null,
        Action: ACTION_TYPE.REVIEW,
        Target: 1,
        Reward: {Experience: 30, BadgeId: createdBadgeIds[1], DiscountId: null}
    },
    {
        Name: "Crea una polaroid",
        Description: "Dagli un tocco unico e condividilo!",
        Type: MISSION_TYPE.SPOT,
        Category: null,
        Action: ACTION_TYPE.CREATE_POLAROID,
        Target: 1,
        Reward: {Experience: 40, BadgeId: createdBadgeIds[2], DiscountId: null}
    },

    // 📅 GIORNALIERE
    {
        Name: "Completa il check-in giornaliero",
        Description: "Passa a salutare e inizia la giornata!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: ACTION_TYPE.LOGIN,
        Target: 1,
        Reward: {Experience: 10, BadgeId: createdBadgeIds[4], DiscountId: null}
    },
    {
        Name: "Scatta una foto oggi",
        Description: "Mostraci cosa hai scoperto in giro!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: ACTION_TYPE.FOTO,
        Target: 1,
        Reward: {Experience: 20, BadgeId: null, DiscountId: null}
    },
    {
        Name: "Scrivi una recensione oggi",
        Description: "Condividi emozioni a parole!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: ACTION_TYPE.REVIEW,
        Target: 1,
        Reward: {Experience: 20, BadgeId: null, DiscountId: null}
    },
    {
        Name: "Crea una polaroid oggi",
        Description: "Crea un ricordo unico della giornata!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: ACTION_TYPE.CREATE_POLAROID,
        Target: 1,
        Reward: {Experience: 30, BadgeId: null, DiscountId: null}
    },
    {
        Name: "Condividi una polaroid oggi",
        Description: "Diffondi bellezza, ispira gli altri!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: ACTION_TYPE.SHARE_POLAROID,
        Target: 1,
        Reward: {Experience: 25, BadgeId: null, DiscountId: null}
    },
    {
        Name: "Completa tutte le missioni giornaliere",
        Description: "Tieni il ritmo, oggi le fai tutte!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: ACTION_TYPE.COMPLETE_MISSIONS,
        Target: 4,
        Reward: {Experience: 60, BadgeId: createdBadgeIds[5], DiscountId: null}
    },

    // 🎭 PER TEMA
    // NATURA
    {
        Name: "Fotografa luoghi naturalistici",
        Description: "La natura è la tua modella speciale!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.NATURE,
        Action: ACTION_TYPE.FOTO,
        Target: 3,
        Reward: {Experience: 40, BadgeId: createdBadgeIds[8], DiscountId: null}
    },
    {
        Name: "Recensisci luoghi immersi nella natura",
        Description: "Fai respirare le tue parole!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.NATURE,
        Action: ACTION_TYPE.REVIEW,
        Target: 2,
        Reward: {Experience: 60, BadgeId: createdBadgeIds[8], DiscountId: null}
    },

    // CIBO
    {
        Name: "Scatta foto di locali e ristoranti",
        Description: "Prima si mangia con gli occhi!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.FOOD,
        Action: ACTION_TYPE.FOTO,
        Target: 3,
        Reward: {Experience: 40, BadgeId: createdBadgeIds[7], DiscountId: null}
    },
    {
        Name: "Recensisci posti dove mangiare",
        Description: "Consiglia dove regalarsi un sorriso (e un piatto)!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.FOOD,
        Action: ACTION_TYPE.REVIEW,
        Target: 2,
        Reward: {Experience: 60, BadgeId: createdBadgeIds[7], DiscountId: null}
    },

    // CULTURA
    {
        Name: "Fotografa arte e cultura",
        Description: "Trasforma l’arte in pixel!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.CULTURE,
        Action: ACTION_TYPE.FOTO,
        Target: 3,
        Reward: {Experience: 40, BadgeId: createdBadgeIds[9], DiscountId: null}
    },
    {
        Name: "Recensisci musei o luoghi culturali",
        Description: "Parlaci del tuo viaggio nel sapere!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.CULTURE,
        Action: ACTION_TYPE.REVIEW,
        Target: 2,
        Reward: {Experience: 60, BadgeId: createdBadgeIds[9], DiscountId: null}
    },

    // MISTERO
    {
        Name: "Fotografa luoghi misteriosi",
        Description: "Affronta l’ignoto e scatta!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.MYSTERY,
        Action: ACTION_TYPE.FOTO,
        Target: 3,
        Reward: {Experience: 40, BadgeId: null, DiscountId: null}
    },
    {
        Name: "Scrivi recensioni su posti enigmatici",
        Description: "Svela segreti con le tue parole!",
        Type: MISSION_TYPE.THEME,
        Category: CATEGORY.MYSTERY,
        Action: ACTION_TYPE.REVIEW,
        Target: 2,
        Reward: {Experience: 60, BadgeId: null, DiscountId: null}
    },

    // 🆙 LIVELLO
    {
        Name: "Raggiungi il livello 5",
        Description: "Stai crescendo, continua così!",
        Type: MISSION_TYPE.LEVEL,
        Category: null,
        Action: ACTION_TYPE.REACH_LEVEL,
        Target: 5,
        Reward: {Experience: 100, BadgeId: createdBadgeIds[11], DiscountId: null}
    },
    {
        Name: "Ottieni 3 badge",
        Description: "Colleziona gloria e virtuosismi!",
        Type: MISSION_TYPE.LEVEL,
        Category: null,
        Action: ACTION_TYPE.OBTAIN_BADGE,
        Target: 3,
        Reward: {Experience: 150, BadgeId: null, DiscountId: null}
    }
];

let createdMissionTemplateIds = [];

export async function seedMissionTemplates() {
    await clearMissionTemplates()
    for (const mission of MISSION_TEMPLATES) {
        const id = await createMissionTemplate(mission);
        createdMissionTemplateIds.push(id);
    }

    console.log("🎉 Creazione " + MISSION_TEMPLATES.length + "mission template completata!");
}
