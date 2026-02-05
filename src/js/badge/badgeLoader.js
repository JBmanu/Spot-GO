import {
    BADGE_COLLECTION_STRUCTURE,
    BADGE_STRUCTURE,
    currentUserBadge,
    spotCompletedOfCurrentUser
} from "./badgeConnector.js";
import {ACTION_TYPE, MISSION_TYPE} from "../goals/db/seed/missionTemplateSeed.js";

const SECTION_BADGE_SELECTORS = {
    SPOT_COMPLETED: "spot-completed",
    MISSIONS_COMPLETED: "mission-completed",
    ACTIONS: "action"
}

export async function loadBadges() {
    const badges = await currentUserBadge();

    await loadSpotsCompleted()
    await loadBadgesCompleted(badges,
        SECTION_BADGE_SELECTORS.MISSIONS_COMPLETED,
        BADGE_COLLECTION_STRUCTURE.MISSIONS_COMPLETED,
        MISSION_TYPE)
    await loadBadgesCompleted(
        badges,
        SECTION_BADGE_SELECTORS.ACTIONS,
        BADGE_COLLECTION_STRUCTURE.ACTIONS,
        ACTION_TYPE)

}

async function loadSpotsCompleted() {
    const spotsCompleted = await spotCompletedOfCurrentUser()

    clearBadgesInSection(SECTION_BADGE_SELECTORS.SPOT_COMPLETED)
    for (let spot of spotsCompleted) {
        const badgeData = {id: spot.id, obtain: 1, title: spot.nome}
        addBadgeEl(SECTION_BADGE_SELECTORS.SPOT_COMPLETED, badgeData)
    }

    for (let i = 0; i < 2; i++) {
        addBadgeInactiveEl(SECTION_BADGE_SELECTORS.SPOT_COMPLETED)
    }
}

async function loadBadgesCompleted(badges, selector, badgeStructure, typeBadges) {
    const missionsCompleted = badges[badgeStructure]
    Object.values(typeBadges).forEach(missionType => {
        const obtainsBadges = missionsCompleted[missionType]?.[BADGE_STRUCTURE.OBTAIN_BADGE]
        const id = badgeStructure + "." + missionType
        if (obtainsBadges.length > 0) {
            const badgeData = {id: id, obtain: obtainsBadges.at(-1), title: missionType}
            addBadgeEl(selector, badgeData)
        } else {
            addBadgeInactiveEl(selector, missionType)
        }
    })
}

function clearBadgesInSection(selector) {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.replaceChildren()
}

function addBadgeEl(selector, badgeData) {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.insertAdjacentHTML("beforeend", `
        <div class="glass-strong vertical-ctn badge-ctn shadow-md" data-badgeId="${badgeData.id}">
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
        <div class="glass-strong vertical-ctn badge-ctn shadow-md" data-badgeId>
            <div class="icon-number-badge-ctn">
                <img src="../../assets/icons/goals/Badge.svg" alt="Badge ottenuto"
                     class="icon-badge inactive" data-icon-badge/>
                <div class="center-ctn number-badge inactive" data-count-badge>0</div>
            </div>
            <p class="center-ctn description-badge" data-title-badge>${description}</p>
        </div>`);
}

// function setBadgeInactiveEl(selector, description = "???") {
//     const section = document.querySelector(`[data-section-badge="${selector}"]`);
//     section.innerHTML = `
//         <div class="glass-strong vertical-ctn badge-ctn" data-badgeId>
//             <div class="icon-number-badge-ctn">
//                 <img src="../../assets/icons/goals/Badge.svg" alt="Badge ottenuto"
//                      class="icon-badge inactive" data-icon-badge/>
//                 <div class="center-ctn number-badge inactive" data-count-badge>0</div>
//             </div>
//             <p class="center-ctn description-badge" data-title-badge>${description}</p>
//         </div>`;
// }
