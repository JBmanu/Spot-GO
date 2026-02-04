// CAP LEVEL
export const CAP_LEVEL = 200;

// DB COLLECTIONS
export const COLLECTIONS = {
    USER: 'Utente',
    SPOT: 'Luogo',
    MISSION_TEMPLATE: 'MissionTemplate',
    USER_MISSION_PROGRESS: 'UserMissionProgress'
}

// CUSTOM ATTRIBUTES
const ATTRIBUTE_PREFIX = 'data-';

export const MISSION_ATTRIBUTE = {
    ID: `${ATTRIBUTE_PREFIX}mission-id`,
    PROGRESS: `${ATTRIBUTE_PREFIX}mission-progress`,
    PROGRESS_BAR: `${ATTRIBUTE_PREFIX}mission-progress-base`,
    CHECKBOX: `${ATTRIBUTE_PREFIX}mission-checkbox`,
}

export const SPOT_ATTRIBUTE = {
    ID: `${ATTRIBUTE_PREFIX}place-id`,
    PROGRESS: `${ATTRIBUTE_PREFIX}place-progress`,
    PROGRESS_BAR: `${ATTRIBUTE_PREFIX}place-progress-base`,
}

// CHECKBOX ICON PATHS
export const CHECKBOX_ICON_PATH = {
    COMPLETE: '../assets/icons/goals/check/check-complete.svg',
    EMPTY: '../assets/icons/goals/check/check-empty.svg',
}