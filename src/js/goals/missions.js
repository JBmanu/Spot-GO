

export async function initializeMissions() {
    const buttons = document.querySelectorAll(".mission-type-btn");
    const slider = document.getElementById('slider');

    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => slider.style.transform = `translateX(-${index * 100}%)`);
    });

    // const buttons = document.querySelectorAll(".mission-type-btn");
    // const slider = document.getElementById('slider');
    // const slides = [...document.querySelectorAll('.slide')];
    //
    // function animate(index) {
    //     slides.forEach((slide, i) => {
    //         const offset = i - index;
    //         const card = slide.querySelector('.card');
    //
    //         // offset 0 = attivo, 1 = a destra, -1 = a sinistra
    //         const scale = 1 - Math.min(Math.abs(offset) * 0.1, 0.2);
    //         const opacity = 1 - Math.min(Math.abs(offset) * 0.4, 0.6);
    //
    //         card.style.transform = `scale(${scale}) translateX(${offset * 30}px)`;
    //         card.style.opacity = opacity;
    //     });
    // }
    //
    // buttons.forEach((btn, index) => {
    //     btn.addEventListener("click", () => {
    //         slider.style.transition = 'transform 0.65s cubic-bezier(.22,.61,.36,1)';
    //         slider.style.transform = `translateX(-${index * 100}%)`;
    //         // animazione durante la transizione
    //         let start;
    //         function step(ts) {
    //             if (!start) start = ts;
    //             const progress = (ts - start) / 650;
    //             animate(index);
    //             if (progress < 1) requestAnimationFrame(step);
    //         }
    //         requestAnimationFrame(step);
    //     });
    // });
    //
    // animate(0); // stato iniziale
    console.log("Missions initialized");
}
