import {documentFromId, isAuthenticatedUser, updateDocument} from "./goalsConnector.js";

const USER_COLLECTION = "Utente";


export async function updateCurrentUserLevel(updateFun) {
    const user = await isAuthenticatedUser();
    const userDocument =  await documentFromId(USER_COLLECTION, user.id)
    const updatedLevel = updateFun(userDocument.livello)
    await updateDocument(userDocument, {[`livello`]: updatedLevel});
    return {oldLevel: userDocument.livello, newLevel: updatedLevel};
}
