
export async function loadDailyMissions() {

}

function createMissionTemplate(title, description, exp, progress, allProgress) {
    const dailyCtn = document.querySelectorAll('.missions-card');
    dailyCtn[0].innerHTML +=
        `<div class="between-ctn glass-strong interactive completable px-5 py-4 card">
            <!-- Lato sinistro -->
            <div class="space-y-1">
                <h3 class="text-sm font-semibold text-gray-800">${title}</h3>
                <p class="text-xs text-gray-600">${description}</p>
                <div class="flex items-center gap-1 text-xs text-gray-700">
                    <img src="../assets/icons/goals/FlashOn.svg" class="w-4 h-4" alt="Reward Icon"/>
                    <span>+${exp} XP</span>
                </div>
            </div>
            <!-- Lato destro -->
            <div class="center-ctn">
                <span class="text-lg font-medium text-gray-500">${progress} / ${allProgress}</span>
            </div>
        </div>`;
}
