export async function initializeSpotsMissions() {

    document.querySelectorAll('.spot-card').forEach(card => {
        const header = card.querySelector('.spot-header');
        const missions = card.querySelector('.missions-spot');
        const arrow = card.querySelector('.spot-arrow');

        header.addEventListener('click', () => {
            missions.classList.toggle('open');
            arrow.classList.toggle('rotate-180')
            console.log("CLICCCKKKK");
        });
    });

    console.log("Spots Missions initialized")
}


