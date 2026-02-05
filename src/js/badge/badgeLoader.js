function addBadgeEl(selector, badgeData) {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.insertAdjacentHTML("beforeend", `
        <div class="glass-strong vertical-ctn badge-ctn" data-badgeId="${badgeData.id}">
            <div class="icon-number-badge-ctn">
                <img src="../../assets/icons/goals/Badge.svg" alt="Badge ottenuto"
                     class="icon-badge" data-icon-badge/>
                <div class="center-ctn number-badge" data-count-badge>${badgeData.obtain}</div>
            </div>
            <p class="center-ctn description-badge line-clamp-1" data-title-badge>${badgeData.title}</p>
        </div>
    `);
}

function setBadgeInactiveEl(selector) {
    const section = document.querySelector(`[data-section-badge="${selector}"]`);
    section.innerHTML = `
        <div class="glass-strong vertical-ctn badge-ctn" data-badgeId>
            <div class="icon-number-badge-ctn">
                <img src="../../assets/icons/goals/Badge.svg" alt="Badge ottenuto"
                     class="icon-badge inactive" data-icon-badge/>
                <div class="center-ctn number-badge inactive" data-count-badge>0</div>
            </div>
            <p class="center-ctn description-badge line-clamp-1" data-title-badge>Completa missione</p>
        </div>`;
}

const SECTION_BADGE_SELECTORS = {
    SPOT_COMPLETED: "spot-completed",
    MISSIONS_COMPLETED: "mission-completed",
    ACTIONS: "action"
}

export async function loadBadges() {

    for (let selector of Object.values(SECTION_BADGE_SELECTORS)) {
        setBadgeInactiveEl(selector)
    }

}