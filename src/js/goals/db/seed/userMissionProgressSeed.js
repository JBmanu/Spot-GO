import {getAllUsers} from "../../../database.js";
import {missionTemplatesByType} from "../missionTemplateConnector.js";
import {MISSION_TYPE} from "./missionTemplateSeed.js";
import {
    clearUserMissionProgress,
    createDailyUserMissionProgress,
    createLevelUserMissionProgress,
    createSpotUserMissionProgress,
    createThemeUserMissionProgress,
} from "../userMissionProgressConnector.js";

const SPOTS = ["8ncqBKHfbPWlQsFc7pvT", "G84q6lO8V2f1smPhjQk0", "qK5b57dBndsW77oUhGbD"]


export async function seedUserMissionProgress() {
    const users = (await getAllUsers())
    await clearUserMissionProgress()

    await seedSpotMissionsForUser(users)
    await seedMissionsForUser(users, MISSION_TYPE.DAILY, createDailyUserMissionProgress)
    await seedMissionsForUser(users, MISSION_TYPE.THEME, createThemeUserMissionProgress)
    await seedMissionsForUser(users, MISSION_TYPE.LEVEL, createLevelUserMissionProgress)
    console.log("🎉 Creazione user mission progress completata!");
}

async function seedSpotMissionsForUser(users) {
    const spotMissions = await missionTemplatesByType(MISSION_TYPE.SPOT)
    let oneActivePerUser = true;

    for (let usersKey of users) {
        oneActivePerUser = true;
        for (let post of SPOTS) {
            for (let spotMission of spotMissions) {
                await createSpotUserMissionProgress({
                    UserId: usersKey.id,
                    PlaceId: post,
                    MissionTemplateId: spotMission.id,
                    IsActive: oneActivePerUser
                })
            }
            oneActivePerUser = false;
        }
    }
}

async function seedMissionsForUser(users, missionType, toCreateMission) {
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



