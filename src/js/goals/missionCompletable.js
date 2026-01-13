export async function initializeCompletable() {
    let spotMissions = document.querySelectorAll('.spot-mission');
    let completableOverlay = document.querySelectorAll('.spot-mission-complete');

    completableOverlay.forEach(overlay => overlay.classList.add('inactive'))

    spotMissions.forEach(btn => {
        btn.addEventListener('click', () => {
            const completableOverlay = btn.querySelector('.spot-mission-complete');
            completableOverlay.classList.toggle('inactive');

            // auto-hide dopo 1.8s (come iOS toast)
            // setTimeout(() => completableOverlay.classList.remove('inactive'), 1800);
        });
    });

    console.log("Completable initialized")
}