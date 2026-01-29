export function initializeEventOpenCloseSpotMissions(card) {
    console.log(card)
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
}


export class initializeSpotsMissions {
}