

export async function initializeMissions() {
    const buttons = document.querySelectorAll(".mission-type-btn");
    const slider = document.getElementById('slider');
    const slides = document.querySelectorAll(".slide");

    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            slider.style.transform = `translateX(-${index * 100}%)`

            slides.forEach((s, i) => {
                if (i === index) {
                    s.classList.remove("opacity-40", "scale-95");
                    s.classList.add("opacity-100", "scale-100");
                } else {
                    s.classList.add("opacity-40", "scale-95");
                    s.classList.remove("opacity-100", "scale-100");
                }
            });
        });
    });

    console.log("Missions initialized");
}