import {
    BADGE_COLLECTION_STRUCTURE,
    BADGE_STRUCTURE,
    currentUserBadge,
    spotCompletedOfCurrentUser
} from "./badgeConnector.js";
import {MISSION_TYPE} from "../goals/db/seed/missionTemplateSeed.js";

const SECTION_BADGE_SELECTORS = {
    SPOT_COMPLETED: "spot-completed",
    MISSIONS_COMPLETED: "mission-completed",
    ACTIONS: "action"
}

export async function loadBadges() {
    const badges = await currentUserBadge();

    const actions = badges[BADGE_COLLECTION_STRUCTURE.ACTIONS]

    await loadMissionsCompleted(badges)
    await loadSpotsCompleted()
}

async function loadMissionsCompleted(badges) {
    const missionsCompleted = badges[BADGE_COLLECTION_STRUCTURE.MISSIONS_COMPLETED]
    Object.values(MISSION_TYPE).forEach(missionType => {
        const obtainsBadges = missionsCompleted[missionType]?.[BADGE_STRUCTURE.OBTAIN_BADGE]
        const id = BADGE_COLLECTION_STRUCTURE.MISSIONS_COMPLETED + "." + missionType
        if (obtainsBadges.length > 0) {
            const badgeData = {id: id, obtain: obtainsBadges.at(-1), title: missionType}
            addBadgeEl(SECTION_BADGE_SELECTORS.MISSIONS_COMPLETED, badgeData)
        } else {
            addBadgeInactiveEl(SECTION_BADGE_SELECTORS.MISSIONS_COMPLETED, missionType)
        }
    })
}

async function loadSpotsCompleted() {
    const spotsCompleted = await spotCompletedOfCurrentUser()
    if (spotsCompleted.length <= 0) {
        setBadgeInactiveEl(SECTION_BADGE_SELECTORS.SPOT_COMPLETED)
        return;
    }
    clearBadgesInSection(SECTION_BADGE_SELECTORS.SPOT_COMPLETED)
    for (let spot of spotsCompleted) {
        const badgeData = {id: spot.id, obtain: 1, title: spot.nome}
        addBadgeEl(SECTION_BADGE_SELECTORS.SPOT_COMPLETED, badgeData)
    }

    for (let i = 0; i < 2; i++) {
        addBadgeInactiveEl(SECTION_BADGE_SELECTORS.SPOT_COMPLETED)
    }
}

function clearBadgesInSection(selector) {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.replaceChildren()
}

function addBadgeEl(selector, badgeData) {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.insertAdjacentHTML("beforeend", `
        <div class="glass-strong vertical-ctn badge-ctn" data-badgeId="${badgeData.id}">
            <div class="icon-number-badge-ctn">
                <img src="../../assets/icons/goals/Badge.svg" alt="Badge ottenuto"
                     class="icon-badge" data-icon-badge/>
                <div class="center-ctn number-badge" data-count-badge>${badgeData.obtain}</div>
            </div>
            <p class="center-ctn description-badge" data-title-badge>${badgeData.title}</p>
        </div>
    `);
}

function addBadgeInactiveEl(selector, description = "???") {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.insertAdjacentHTML("beforeend", `
        <div class="glass-strong vertical-ctn badge-ctn" data-badgeId>
            <div class="icon-number-badge-ctn">
                <img src="../../assets/icons/goals/Badge.svg" alt="Badge ottenuto"
                     class="icon-badge inactive" data-icon-badge/>
                <div class="center-ctn number-badge inactive" data-count-badge>0</div>
            </div>
            <p class="center-ctn description-badge" data-title-badge>${description}</p>
        </div>`);
}

function setBadgeInactiveEl(selector, description = "???") {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.innerHTML = `
        <div class="glass-strong vertical-ctn badge-ctn" data-badgeId>
            <div class="icon-number-badge-ctn">
                <img src="../../assets/icons/goals/Badge.svg" alt="Badge ottenuto"
                     class="icon-badge inactive" data-icon-badge/>
                <div class="center-ctn number-badge inactive" data-count-badge>0</div>
            </div>
            <p class="center-ctn description-badge" data-title-badge>${description}</p>
        </div>`;
}
