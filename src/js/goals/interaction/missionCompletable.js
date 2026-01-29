export async function initializeCompletable() {
    const spotsMissions = document.querySelectorAll('.spot-mission')
    spotsMissions.forEach(spotMissions => {
        const titleSpan = spotMissions.querySelector('.mission-title');
        const radioSpan = spotMissions.querySelector('.mission-radio');

        if (!radioSpan || !titleSpan) return;
        spotMissions.addEventListener('click', () => {
            titleSpan.classList.toggle('completed')
            radioSpan.classList.toggle('completed')
        })
    })
    console.log("Completable initialized")
}

export function markMissionAsCompleted(missionEl) {
    const titleSpan = missionEl.querySelector('.mission-title');
    const radioSpan = missionEl.querySelector('.mission-radio');

    if (!radioSpan || !titleSpan) return;
    titleSpan.classList.add('completed')
    radioSpan.classList.add('completed')
}

export function markMissionAsUncompleted(missionEl) {
    const titleSpan = missionEl.querySelector('.mission-title');
    const radioSpan = missionEl.querySelector('.mission-radio');

    if (!radioSpan || !titleSpan) return;
    titleSpan.classList.remove('completed')
    radioSpan.classList.remove('completed')
}