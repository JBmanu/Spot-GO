import {getAllUsers} from "../../../database.js";
import {missionTemplatesByType} from "../missionTemplateConnector.js";
import {MISSION_TYPE} from "./missionTemplateSeed.js";
import {clearUserMissionProgress, createUserMissionProgress} from "../userMissionProgressConnector.js";
import {documents, EMPTY_VALUE} from "../goalsConnector.js";

const SPOTS = ["8ncqBKHfbPWlQsFc7pvT", "G84q6lO8V2f1smPhjQk0", "qK5b57dBndsW77oUhGbD"]


export async function seedUserMissionProgress() {
    const length = (await documents("UserMissionProgress")).length
    const users = (await getAllUsers())

    console.log("length user mission progress:", length)

    await clearUserMissionProgress()
    await seedSpotMissionsForUser(users)
    await seedMissionsForUser(users)
    console.log("🎉 Creazione user mission progress completata!");
}

async function seedSpotMissionsForUser(users) {
    const spotMissions = await missionTemplatesByType(MISSION_TYPE.SPOT)
    let oneActivePerUser = true;

    for (let usersKey of users) {
        oneActivePerUser = true;
        for (let post of SPOTS) {
            for (let spotMission of spotMissions) {
                await createUserMissionProgress({
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

async function seedMissionsForUser(users) {
    const typeMissions = [MISSION_TYPE.DAILY, MISSION_TYPE.THEME, MISSION_TYPE.LEVEL]

    for (let typeMission of typeMissions) {
        const missions = await missionTemplatesByType(typeMission)
        for (let usersKey of users) {
            for (let mission of missions) {
                await createUserMissionProgress({
                    UserId: usersKey.id,
                    MissionTemplateId: mission.id,
                })
            }
        }
    }
}