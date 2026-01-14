
function focusMainGoalsPage(mainPage, allSpotsPage) {
    allSpotsPage.classList.add('hidden');
    mainPage.classList.remove('hidden');
}

function focusAllSpotsMissionsPage(mainPage, allSpotsPage) {
    mainPage.classList.add('hidden');
    allSpotsPage.classList.remove('hidden');
}

export async function initializedAllSpotsMissions() {
    const mainPage = document.querySelector('.main-goals-page');
    const allSpotsPage = document.querySelector('.all-spots-missions-page');


    const backActiveSpotMissionsBtn = document.querySelector('.back-active-spot-missions');
    const viewAllBtn = document.querySelector('.view-all-spots-missions');

    backActiveSpotMissionsBtn.addEventListener('click', () => {
        focusMainGoalsPage(mainPage, allSpotsPage);
    });
    viewAllBtn.addEventListener('click', () => {
        focusAllSpotsMissionsPage(mainPage, allSpotsPage);
    });

    focusMainGoalsPage(mainPage, allSpotsPage);
    console.log("All Spots Missions initialized")
}