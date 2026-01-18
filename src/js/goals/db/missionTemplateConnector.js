import {addDoc, collection, deleteDoc, doc, getDoc, getDocs} from "firebase/firestore";
import {db} from "../../firebase.js";

const MISSION_TEMPLATE_COLLECTION = "MissionTemplate";

export async function clearMissionTemplates() {
    try {
        const querySnapshot = await getDocs(collection(db, MISSION_TEMPLATE_COLLECTION));
        const deletions = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletions);
        console.log("All mission templates cleared.");
    } catch (e) {
        console.error("Error clearing mission templates: ", e);
    }
}

export async function createMissionTemplate(data) {
    try {
        const docRef =
            await addDoc(collection(db, MISSION_TEMPLATE_COLLECTION), {
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
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        return null;
    }
}

export async function missionTemplates() {
    try {
        const querySnapshot = await getDocs(collection(db, MISSION_TEMPLATE_COLLECTION));
        const missionTemplates = [];
        querySnapshot.forEach((doc) => {
            missionTemplates.push({id: doc.id, ...doc.data()});
        });
        return missionTemplates;
    } catch (e) {
        console.error("Error getting mission templates: ", e);
        return [];
    }
}

export async function missionTemplate(id) {
    return (await missionTemplates())?.filter(mission => mission.id === id)[0];
}

export async function missionTemplatesByType(type) {
    return (await missionTemplates())?.filter(mission => mission.Type === type);
}
