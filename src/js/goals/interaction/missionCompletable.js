export async function initializeCompletable() {
    const missions = document.querySelectorAll('.completable')

    missions.forEach(spotMissions => {
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
    const imageCheckbox = missionEl.querySelector('.mission-checkbox');

    const isolatedSpotMission = missionEl.closest('.spot-mission-isolated');
    if (isolatedSpotMission) isolatedSpotMission.classList.add('completed');

    const spotExp = missionEl.querySelector('.spot-mission-exp')
    if (spotExp) spotExp.classList.add('completed')

    if (!imageCheckbox || !titleSpan || !descriptionP) return;
    missionEl.classList.add('completed')
    titleSpan.classList.add('completed')
    descriptionP.classList.add('completed')
    imageCheckbox.src = '../assets/icons/goals/check/check-complete.svg';
}

function markMissionAsUncompleted(missionEl) {
    const titleSpan = missionEl.querySelector('.mission-title');
    const descriptionP = missionEl.querySelector('.mission-title-description');
    const imageCheckbox = missionEl.querySelector('.mission-checkbox');

    const isolatedSpotMission = missionEl.closest('.spot-mission-isolated');
    if (isolatedSpotMission) isolatedSpotMission.classList.remove('completed');

    const spotExp = missionEl.querySelector('.spot-mission-exp')
    if (spotExp) spotExp.classList.remove('completed')
    if (!imageCheckbox || !titleSpan) return;
    missionEl.classList.remove('completed')
    titleSpan.classList.remove('completed')
    descriptionP.classList.remove('completed')
    imageCheckbox.src = '../assets/icons/goals/check/check-empty.svg';
}