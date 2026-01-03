export function initializeGoals() {
    const buttons = document.querySelectorAll(".tab-btn");
    const indicator = document.getElementById("indicator");

    console.log("bottoni presi: " + buttons.length);
    console.log("indicatore preso: " + (indicator ? "sì" : "no"));

    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            console.log("bottone cliccato: " + index);
            indicator.style.transform = `translateX(${index * 100}%)`;
        });
    });
}
