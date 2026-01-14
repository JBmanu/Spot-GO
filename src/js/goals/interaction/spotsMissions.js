export async function initializeSpotsMissions() {
    initializeActiveSpotMissions();
    initializeAllSpotMissions();
    console.log("Spots Missions initialized")
}

function initializeActiveSpotMissions() {

}

function initializeAllSpotMissions() {
    document.querySelectorAll('.spot-card').forEach(card => {
        const header = card.querySelector('.spot-header');
        const missions = card.querySelector('.missions-spot');

        header.addEventListener('click', () => {
            header.classList.toggle('open');
            missions.classList.toggle('open');
            console.log("click spot missions")

            const arrow = card.querySelector('.spot-arrow');
            if (!arrow) return;
            arrow.classList.toggle('rotate-180')
        });
    });
}



