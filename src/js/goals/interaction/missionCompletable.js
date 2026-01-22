export async function initializeCompletable() {
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

        mission.addEventListener('click', () => {
            mission.querySelector('.spot-mission-complete').classList.toggle('inactive');
            console.log("click completable mission")


        })
    })


    console.log("Completable initialized")
}