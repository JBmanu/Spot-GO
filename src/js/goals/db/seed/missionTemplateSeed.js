import {clearMissionTemplates, createMissionTemplate} from "../missionTemplateConnector.js";
import {createdBadgeIds} from "./badgeSeed.js";

export const MISSION_TYPE = {
    SPOT: "Spot",
    DAILY: "Daily",
    THEME: "Theme",
    LEVEL: "Level"
}

const MISSION_TEMPLATES = [
    // 🏞 SPOT
    {
        Name: "Scatta una foto allo spot",
        Description: "Immortala la magia in un click!",
        Type: MISSION_TYPE.SPOT,
        Category: null,
        Action: "fai_foto",
        Target: 1,
        Reward: { Experience: 20, BadgeId: createdBadgeIds[0], DiscountId: null }
    },
    {
        Name: "Scrivi una recensione allo spot",
        Description: "Racconta cosa ti ha fatto battere il cuore!",
        Type: MISSION_TYPE.SPOT,
        Category: null,
        Action: "scrivi_recensione",
        Target: 1,
        Reward: { Experience: 30, BadgeId: createdBadgeIds[1], DiscountId: null }
    },
    {
        Name: "Crea una polaroid dello spot",
        Description: "Dagli un tocco unico e condividilo!",
        Type: MISSION_TYPE.SPOT,
        Category: null,
        Action: "crea_polaroid",
        Target: 1,
        Reward: { Experience: 40, BadgeId: createdBadgeIds[2], DiscountId: null }
    },

    // 📅 GIORNALIERE
    {
        Name: "Completa il check-in giornaliero",
        Description: "Passa a salutare e inizia la giornata!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "login",
        Target: 1,
        Reward: { Experience: 10, BadgeId: createdBadgeIds[4], DiscountId: null }
    },
    {
        Name: "Scatta una foto oggi",
        Description: "Mostraci cosa hai scoperto in giro!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "fai_foto",
        Target: 1,
        Reward: { Experience: 20, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Scrivi una recensione oggi",
        Description: "Condividi emozioni a parole!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "scrivi_recensione",
        Target: 1,
        Reward: { Experience: 20, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Crea una polaroid oggi",
        Description: "Crea un ricordo unico della giornata!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "crea_polaroid",
        Target: 1,
        Reward: { Experience: 30, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Condividi una polaroid oggi",
        Description: "Diffondi bellezza, ispira gli altri!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "condividi_polaroid",
        Target: 1,
        Reward: { Experience: 25, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Completa tutte le missioni giornaliere",
        Description: "Tieni il ritmo, oggi le fai tutte!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "completa_missioni",
        Target: 4,
        Reward: { Experience: 60, BadgeId: createdBadgeIds[5], DiscountId: null }
    },

    // 🎭 PER TEMA
    // NATURA
    {
        Name: "Fotografa luoghi naturalistici",
        Description: "La natura è la tua modella speciale!",
        Type: MISSION_TYPE.THEME,
        Category: "natura",
        Action: "fai_foto_categoria",
        Target: 3,
        Reward: { Experience: 40, BadgeId: createdBadgeIds[8], DiscountId: null }
    },
    {
        Name: "Recensisci luoghi immersi nella natura",
        Description: "Fai respirare le tue parole!",
        Type: MISSION_TYPE.THEME,
        Category: "natura",
        Action: "scrivi_recensione_categoria",
        Target: 2,
        Reward: { Experience: 60, BadgeId: createdBadgeIds[8], DiscountId: null }
    },

    // CIBO
    {
        Name: "Scatta foto di locali e ristoranti",
        Description: "Prima si mangia con gli occhi!",
        Type: MISSION_TYPE.THEME,
        Category: "cibo",
        Action: "fai_foto_categoria",
        Target: 3,
        Reward: { Experience: 40, BadgeId: createdBadgeIds[7], DiscountId: null }
    },
    {
        Name: "Recensisci posti dove mangiare",
        Description: "Consiglia dove regalarsi un sorriso (e un piatto)!",
        Type: MISSION_TYPE.THEME,
        Category: "cibo",
        Action: "scrivi_recensione_categoria",
        Target: 2,
        Reward: { Experience: 60, BadgeId: createdBadgeIds[7], DiscountId: null }
    },

    // CULTURA
    {
        Name: "Fotografa arte e cultura",
        Description: "Trasforma l’arte in pixel!",
        Type: MISSION_TYPE.THEME,
        Category: "cultura",
        Action: "fai_foto_categoria",
        Target: 3,
        Reward: { Experience: 40, BadgeId: createdBadgeIds[9], DiscountId: null }
    },
    {
        Name: "Recensisci musei o luoghi culturali",
        Description: "Parlaci del tuo viaggio nel sapere!",
        Type: MISSION_TYPE.THEME,
        Category: "cultura",
        Action: "scrivi_recensione_categoria",
        Target: 2,
        Reward: { Experience: 60, BadgeId: createdBadgeIds[9], DiscountId: null }
    },

    // MISTERO
    {
        Name: "Fotografa luoghi misteriosi",
        Description: "Affronta l’ignoto e scatta!",
        Type: MISSION_TYPE.THEME,
        Category: "mistero",
        Action: "fai_foto_categoria",
        Target: 3,
        Reward: { Experience: 40, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Scrivi recensioni su posti enigmatici",
        Description: "Svela segreti con le tue parole!",
        Type: MISSION_TYPE.THEME,
        Category: "mistero",
        Action: "scrivi_recensione_categoria",
        Target: 2,
        Reward: { Experience: 60, BadgeId: null, DiscountId: null }
    },

    // 🆙 LIVELLO
    {
        Name: "Raggiungi il livello 5",
        Description: "Stai crescendo, continua così!",
        Type: MISSION_TYPE.LEVEL,
        Category: null,
        Action: "raggiungi_livello",
        Target: 5,
        Reward: { Experience: 100, BadgeId: createdBadgeIds[11], DiscountId: null }
    },
    {
        Name: "Ottieni 3 badge",
        Description: "Colleziona gloria e virtuosismi!",
        Type: MISSION_TYPE.LEVEL,
        Category: null,
        Action: "ottieni_badge",
        Target: 3,
        Reward: { Experience: 150, BadgeId: null, DiscountId: null }
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
