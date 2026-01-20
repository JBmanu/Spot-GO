import {clearDocuments, createDocument, documentFromId, documentsFiltered} from "./goalsConnector.js";

export const MISSION_TEMPLATE_COLLECTION = "MissionTemplate";

export async function createMissionTemplate(data) {
    return await createDocument(MISSION_TEMPLATE_COLLECTION, {
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
    await clearDocuments(MISSION_TEMPLATE_COLLECTION)
}

export async function missionTemplate(id) {
    return await documentFromId(MISSION_TEMPLATE_COLLECTION, id);
}

export async function missionTemplatesByType(type) {
    return await documentsFiltered(MISSION_TEMPLATE_COLLECTION, mission => mission.Type === type);
}
