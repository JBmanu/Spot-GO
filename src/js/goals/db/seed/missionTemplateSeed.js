import {clearMissionTemplates, createMissionTemplate} from "../missionTemplateConnector.js";

export const MISSION_TYPE = {
    SPOT: "spot",
    DAILY: "daily",
    THEME: "theme",
    LEVEL: "level"
}


const MISSION_TEMPLATES = [
    // 🏞 SPOT
    {
        Name: "Scatta una foto allo spot",
        Description: "Immortala la magia in un click!",
        Type: "spot",
        Category: null,
        Action: "fai_foto",
        Target: 1,
        Reward: { Experience: 20, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Scrivi una recensione allo spot",
        Description: "Racconta cosa ti ha fatto battere il cuore!",
        Type: "spot",
        Category: null,
        Action: "scrivi_recensione",
        Target: 1,
        Reward: { Experience: 30, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Crea una polaroid dello spot",
        Description: "Dagli un tocco unico e condividilo!",
        Type: "spot",
        Category: null,
        Action: "crea_polaroid",
        Target: 1,
        Reward: { Experience: 40, BadgeId: null, DiscountId: null }
    },

    // 📅 GIORNALIERE
    {
        Name: "Completa il check-in giornaliero",
        Description: "Passa a salutare e inizia la giornata!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "login",
        Target: 1,
        Reward: { Experience: 10, BadgeId: null, DiscountId: null }
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
        Name: "Completa tutte le missioni giornaliere",
        Description: "Tieni il ritmo, oggi le fai tutte!",
        Type: MISSION_TYPE.DAILY,
        Category: null,
        Action: "completa_missioni",
        Target: 4,
        Reward: { Experience: 60, BadgeId: null, DiscountId: null }
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

    // 🎭 PER TEMA
    // NATURA
    {
        Name: "Fotografa luoghi naturalistici",
        Description: "La natura è la tua modella speciale!",
        Type: MISSION_TYPE.THEME,
        Category: "natura",
        Action: "fai_foto_categoria",
        Target: 3,
        Reward: { Experience: 40, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Recensisci luoghi immersi nella natura",
        Description: "Fai respirare le tue parole!",
        Type: MISSION_TYPE.THEME,
        Category: "natura",
        Action: "scrivi_recensione_categoria",
        Target: 2,
        Reward: { Experience: 60, BadgeId: null, DiscountId: null }
    },

    // CIBO
    {
        Name: "Scatta foto di locali e ristoranti",
        Description: "Prima si mangia con gli occhi!",
        Type: MISSION_TYPE.THEME,
        Category: "cibo",
        Action: "fai_foto_categoria",
        Target: 3,
        Reward: { Experience: 40, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Recensisci posti dove mangiare",
        Description: "Consiglia dove regalarsi un sorriso (e un piatto)!",
        Type: MISSION_TYPE.THEME,
        Category: "cibo",
        Action: "scrivi_recensione_categoria",
        Target: 2,
        Reward: { Experience: 60, BadgeId: null, DiscountId: null }
    },

    // CULTURA
    {
        Name: "Fotografa arte e cultura",
        Description: "Trasforma l’arte in pixel!",
        Type: MISSION_TYPE.THEME,
        Category: "cultura",
        Action: "fai_foto_categoria",
        Target: 3,
        Reward: { Experience: 40, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Recensisci musei o luoghi culturali",
        Description: "Parlaci del tuo viaggio nel sapere!",
        Type: MISSION_TYPE.THEME,
        Category: "cultura",
        Action: "scrivi_recensione_categoria",
        Target: 2,
        Reward: { Experience: 60, BadgeId: null, DiscountId: null }
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
        Type: "level",
        Category: null,
        Action: "raggiungi_livello",
        Target: 5,
        Reward: { Experience: 100, BadgeId: null, DiscountId: null }
    },
    {
        Name: "Ottieni 3 badge",
        Description: "Colleziona gloria e virtuosismi!",
        Type: "level",
        Category: null,
        Action: "ottieni_badge",
        Target: 3,
        Reward: { Experience: 150, BadgeId: null, DiscountId: null }
    }
];

export async function seedMissionTemplates() {
    await clearMissionTemplates()
    console.log(`Creazione di ${MISSION_TEMPLATES.length} missioni...`);
    for (const mission of MISSION_TEMPLATES) {
        const id = await createMissionTemplate(mission);
    }
    console.log("🎉 Fine!");
}
