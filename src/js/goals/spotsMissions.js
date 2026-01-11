export async function initializeSpotsMissions() {

    // document.querySelectorAll('.spot-card').forEach(card => {
    //     const header = card.querySelector('.spot-header');
    //     const missions = card.querySelector('.missions');
    //
    //     header.addEventListener('click', () => {
    //         const isOpen = missions.classList.contains('hidden');
    //
    //         if (isOpen) {
    //             missions.classList.remove('hidden');
    //             setTimeout(() => missions.classList.add('max-h-[800px]'), 10); // apertura smooth
    //         } else {
    //             missions.classList.remove('max-h-[800px]');
    //             setTimeout(() => missions.classList.add('hidden'), 300); // chiusura dopo animazione
    //         }
    //     });
    // });
    document.querySelectorAll('.spot-card').forEach(card => {
        const header = card.querySelector('.spot-header');
        const missions = card.querySelector('.missions');
        const arrow = card.querySelector('.arrow');

        header.addEventListener('click', () => {
            const isOpen = missions.classList.contains('open');

            if (!isOpen) {
                missions.classList.add(
                    'pt-2',
                    'max-h-[1000px]',
                    'opacity-100',
                    'scale-100',
                    'blur-none',
                    'open'
                );
                missions.classList.remove(
                    'max-h-0',
                    'opacity-0',
                    'scale-95',
                    'blur-sm'
                );
                arrow.classList.add('rotate-180');
            } else {
                missions.classList.add(
                    'max-h-0',
                    'opacity-0',
                    'scale-95',
                    'blur-sm'
                );
                missions.classList.remove(
                    'pt-2',
                    'max-h-[1000px]',
                    'opacity-100',
                    'scale-100',
                    'blur-none',
                    'open'
                );
                arrow.classList.remove('rotate-180');
            }
        });
    });
    console.log("Spots Missions initialized")
}


