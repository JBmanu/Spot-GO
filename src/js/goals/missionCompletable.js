export async function initializeCompletable() {
    // let spotMissions = document.querySelectorAll('.spot-mission');
    // let completableOverlay = document.querySelectorAll('.spot-mission-complete');
    //
    // completableOverlay.forEach(overlay => overlay.classList.add('inactive'))
    //
    // spotMissions.forEach(btn => {
    //     btn.addEventListener('click', () => {
    //         const completableOverlay = btn.querySelector('.spot-mission-complete');
    //         completableOverlay.classList.toggle('inactive');
    //     });
    // });

    const completableMissions = document.querySelectorAll('.completable');
    completableMissions.forEach(mission => {
        const completeDiv = mission.querySelector('.spot-mission-complete');
        if (completeDiv) return;

        mission.innerHTML += `
            <!-- Complete -->
            <div class="center-ctn spot-mission-complete inactive">
                <span class="text-lg font-bold text-green-700">COMPLETATO ✔</span>
            </div>
        `;
        // const box = document.createElement('div');
        // box.className = `center-ctn spot-mission-complete inactive`;
        // box.innerHTML = `<span class="text-lg font-bold text-green-700">COMPLETATO ✔</span>`;
        // mission.appendChild(box);

        mission.addEventListener('click', () => {
            mission.querySelector('.spot-mission-complete').classList.toggle('inactive');
        })
    })


    console.log("Completable initialized")
}