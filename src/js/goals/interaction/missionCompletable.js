export async function initializeCompletable() {
    const spotsMissions = document.querySelectorAll('.spot-mission')
    spotsMissions.forEach(spotMissions => {
        const titleSpan = spotMissions.querySelector('.mission-title');
        if (!titleSpan) return;

        spotMissions.addEventListener('click', () => {
            console.log( "Clicked mission completable")
            if (titleSpan.classList.contains('completed')) {
                markMissionAsUncompleted(spotMissions)
            } else {
                markMissionAsCompleted(spotMissions)
            }
        })
    })
    console.log("Completable initialized")
}

export function markMissionAsCompleted(missionEl) {
    const titleSpan = missionEl.querySelector('.mission-title');
    const descriptionP = missionEl.querySelector('.mission-title-description');
    const imageCheckbox = missionEl.querySelector('.spot-mission-checkbox');

    if (!imageCheckbox || !titleSpan || !descriptionP) return;
    titleSpan.classList.add('completed')
    descriptionP.classList.add('completed')
    imageCheckbox.src = '../assets/icons/goals/check/check-complete.svg';
}

export function markMissionAsUncompleted(missionEl) {
    const titleSpan = missionEl.querySelector('.mission-title');
    const descriptionP = missionEl.querySelector('.mission-title-description');
    const imageCheckbox = missionEl.querySelector('.spot-mission-checkbox');

    if (!imageCheckbox || !titleSpan) return;
    titleSpan.classList.remove('completed')
    descriptionP.classList.remove('completed')
    imageCheckbox.src = '../assets/icons/goals/check/check-empty.svg';
}