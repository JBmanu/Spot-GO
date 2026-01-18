import {getAllUsers} from "../../../database.js";
import {missionTemplatesByType} from "../missionTemplateConnector.js";
import {MISSION_TYPE} from "./missionTemplateSeed.js";
import {clearUserMissionProgress, createUserMissionProgress} from "../userMissionProgressConnector.js";
import {documents} from "../goalsConnector.js";

const SPOTS = ["8ncqBKHfbPWlQsFc7pvT", "G84q6lO8V2f1smPhjQk0", "qK5b57dBndsW77oUhGbD"]


export async function seedUserMissionProgress() {
    const length = (await documents("UserMissionProgress")).length
    console.log("length user mission progress:", length)

    await clearUserMissionProgress()
    await seedSpotMissionsForUser()
    console.log("🎉 Creazione user mission progress completata!");
}

async function seedSpotMissionsForUser() {
    const spotMissions = await missionTemplatesByType(MISSION_TYPE.SPOT)
    const users = (await getAllUsers())

    for (let post of SPOTS) {
        for (let usersKey of users) {
            for (let spotMission of spotMissions) {
                await createUserMissionProgress({
                    UserId: usersKey.id,
                    PlaceId: post,
                    MissionTemplateId: spotMission.id
                })
            }
        }
    }
}