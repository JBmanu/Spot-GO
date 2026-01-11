

export async function initializeMissions() {
    const buttons = document.querySelectorAll(".mission-type-btn");

    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            const slider = document.getElementById('slider');
            slider.style.transform = `translateX(-${index * 100}%)`;
        });
        console.log("Missions initialized");
    });


}