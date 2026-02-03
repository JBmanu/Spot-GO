import {getAllUsers} from "../../../database.js";
import {missionTemplatesByType} from "../missionTemplateConnector.js";
import {MISSION_TYPE} from "./missionTemplateSeed.js";
import {
    clearUserMissionProgress, createAllSpotMissions,
    createDailyMission,
    createLevelMission,
    createSpotMission,
    createThemeMission,
} from "../userMissionProgressConnector.js";

const SPOTS = ["8ncqBKHfbPWlQsFc7pvT", "G84q6lO8V2f1smPhjQk0", "qK5b57dBndsW77oUhGbD"]


export async function seedUserMissionProgress() {
    const users = (await getAllUsers())
    await clearUserMissionProgress()

    await seedSpotMissionsForUser(users)
    await seedMissionsForUser(users, MISSION_TYPE.DAILY, createDailyMission)
    await seedMissionsForUser(users, MISSION_TYPE.THEME, createThemeMission)
    await seedMissionsForUser(users, MISSION_TYPE.LEVEL, createLevelMission)
    console.log("🎉 Creazione user mission progress completata!");
}

async function seedSpotMissionsForUser(users) {
    let oneActivePerUser = true;

    for (let user of users) {
        oneActivePerUser = true;
        for (let placeId of SPOTS) {
            await createAllSpotMissions(user.id, placeId, oneActivePerUser)
            oneActivePerUser = false;
        }
    }
}

export async function seedMissionsForUser(users, missionType, toCreateMission) {
    const missions = await missionTemplatesByType(missionType)
    for (let usersKey of users) {
        for (let mission of missions) {
            await toCreateMission({
                UserId: usersKey.id,
                MissionTemplateId: mission.id,
            })
        }
    }
}


