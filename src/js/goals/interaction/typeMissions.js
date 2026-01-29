

function selectionSlider(cards, index) {
    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.remove("opacity-40", "scale-95");
            card.classList.add("opacity-100", "scale-100");
        } else {
            card.classList.add("opacity-40", "scale-95");
            card.classList.remove("opacity-100", "scale-100");
        }
    });
}

export async function initializeTypeMissions() {
    const buttons = document.querySelectorAll(".mission-type-btn");
    const slider = document.querySelector('.mission-type-slider');
    const cards = document.querySelectorAll(".missions-card-ctn");

    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            slider.style.transform = `translateX(-${index * 100}%)`
            selectionSlider(cards, index)
        });
    });

    selectionSlider(cards, 0)
    console.log("Missions initialized");
}