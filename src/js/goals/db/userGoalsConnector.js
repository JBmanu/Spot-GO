import {documentFromId, isAuthenticatedUser, updateDocument} from "./goalsConnector.js";
import {CAP_LEVEL, COLLECTIONS} from "../Datas.js";

export async function resetCurrentUserLevel() {
    await updateCurrentUserLevel(() => 0);
}

export async function currentUserLevel() {
    const user = await isAuthenticatedUser();
    const userDocument = await documentFromId(COLLECTIONS.USER, user.id)
    return {
        level: Math.trunc(userDocument.livello / CAP_LEVEL),
        remainingExp: userDocument.livello % CAP_LEVEL,
        progress: userDocument.livello
    }
}

export async function updateCurrentUserLevel(updateFun) {
    const user = await isAuthenticatedUser();
    const userDocument = await documentFromId(COLLECTIONS.USER, user.id)
    const updatedLevel = updateFun(userDocument.livello)
    await updateDocument(userDocument, {[`livello`]: updatedLevel});
    return {oldLevel: userDocument.livello, newLevel: updatedLevel};
}
