// DB COLLECTIONS

export const COLLECTIONS = {
    USER: 'Utente',
    MISSION_TEMPLATE: 'MissionTemplate',
    USER_MISSION_PROGRESS: 'UserMissionProgress'
}

// CUSTOM ATTRIBUTES
const ATTRIBUTE_PREFIX = 'data-';

export const MISSION_ATTRIBUTE = {
    ID: `${ATTRIBUTE_PREFIX}mission-id`,
    PROGRESS: `${ATTRIBUTE_PREFIX}mission-progress`,
}

export const SPOT_ATTRIBUTE = {
    ID: `${ATTRIBUTE_PREFIX}place-id`,
    PROGRESS: `${ATTRIBUTE_PREFIX}place-progress`,
}

