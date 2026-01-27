import {clearDocuments, createDocument, documentFromId, documentsFiltered} from "./goalsConnector.js";
import {COLLECTIONS} from "../Datas.js";

export async function createMissionTemplate(data) {
    return await createDocument(COLLECTIONS.MISSION_TEMPLATE, {
        Name: data.Name,
        Description: data.Description,
        Type: data.Type,
        Category: data.Category ?? "",
        Action: data.Action,
        Target: data.Target,
        Reward: {
            Experience: data.Reward?.Experience ?? null,
            BadgeId: data.Reward?.BadgeId ?? "",
            DiscountId: data.Reward?.DiscountId ?? ""
        }
    });
}

export async function clearMissionTemplates() {
        await clearDocuments(COLLECTIONS.MISSION_TEMPLATE)
}

export async function missionTemplate(id) {
    return await documentFromId(COLLECTIONS.MISSION_TEMPLATE, id);
}

export async function missionTemplatesByType(type) {
    return await documentsFiltered(COLLECTIONS.MISSION_TEMPLATE, mission => mission.Type === type);
}
