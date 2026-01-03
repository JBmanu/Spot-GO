




export function initializeGoals() {
    const buttons = document.querySelectorAll(".mission-type-btn");
    const indicator = document.getElementById("indicator");
    const container = document.getElementById("tab-container");

    if (!buttons.length || !indicator || !container) return;

    let activeIndex = 0;

    const updateIndicator = (index) => {
        const button = buttons[index];

        // Prendi il rect del bottone e del contenitore
        const buttonRect = button.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Posizione relativa al contenitore
        const left = buttonRect.left - containerRect.left - 1;

        // Applica dimensioni e posizione
        indicator.style.width = `${buttonRect.width}px`;
        indicator.style.height = `${buttonRect.height}px`;
        indicator.style.left = `${left}px`;
    };

    // Inizializza indicatore sul primo bottone
    updateIndicator(activeIndex);

    // Aggiorna indicatore al click sui bottoni
    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            activeIndex = index;
            updateIndicator(index);

            // Gestione classe active
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Aggiorna indicatore al resize della finestra
    window.addEventListener("resize", () => updateIndicator(activeIndex));

    // Classe active al bottone di default
    buttons[activeIndex].classList.add("active");
}
