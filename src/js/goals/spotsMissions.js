
export async function initializeSpotsMissions() {

    document.querySelectorAll('.spot-card').forEach(card => {
        const header = card.querySelector('.spot-header');
        const missions = card.querySelector('.missions');

        header.addEventListener('click', () => {
            const isOpen = missions.classList.contains('hidden');

            if (isOpen) {
                missions.classList.remove('hidden');
                setTimeout(() => missions.classList.add('max-h-[800px]'), 10); // apertura smooth
            } else {
                missions.classList.remove('max-h-[800px]');
                setTimeout(() => missions.classList.add('hidden'), 300); // chiusura dopo animazione
            }
        });
    });
    console.log("Spots Missions initialized")
}


