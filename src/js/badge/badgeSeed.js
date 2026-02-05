import {
    addSpotCompletedOfCurrentUser, BADGE_COLLECTION_STRUCTURE,
    badgeValuesOfCurrentUser,
    clearBadges,
    countBadgesObtainedOfCurrentUser,
    createBadge,
    incrementBadgeCounterOfCurrentUser, spotCompletedOfCurrentUser
} from "./badgeConnector.js";
import {getAllUsers} from "../database.js";
import {MISSION_TYPE} from "../goals/db/seed/missionTemplateSeed.js";


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
    console.log("TOTAL USERS BADGED:", await countBadgesObtainedOfCurrentUser())

    console.log("🎉 Badge seeding done!");
}