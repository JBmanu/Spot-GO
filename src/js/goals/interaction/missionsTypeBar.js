function activeButton(buttons, activeButton) {
    buttons.forEach(button => {
        const icon = button.querySelector('.mission-type-btn-icon');
        const text = button.querySelector('.mission-type-btn-title');
        icon.classList.remove('active');
        text.classList.remove('active')
    });

    // stato attivo
    const activeIcon = activeButton.querySelector('.mission-type-btn-icon');
    const activeText = activeButton.querySelector('.mission-type-btn-title');
    activeIcon.classList.add('active');
    activeText.classList.add('active');
}

function updateIndicatorPosition(container, indicator, button) {
    // Prendi il rect del bottone e del contenitore
    const buttonRect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Posizione relativa al contenitore
    const left = buttonRect.left - containerRect.left - 1;
    // Applica dimensioni e posizione
    indicator.style.width = `${buttonRect.width}px`;
    indicator.style.height = `${buttonRect.height}px`;
    indicator.style.left = `${left}px`;
}


export async function initializeMissionsBar() {
    const CONTAINER = ".missions-type-bar";
    const INDICATOR = ".missions-type-indicator";
    const BUTTON = ".mission-type-btn";

    const container = document.querySelector(CONTAINER);
    const indicator = document.querySelector(INDICATOR);
    const buttons = document.querySelectorAll(BUTTON);

    if (!buttons.length || !indicator || !container) return;
    let activeIndex = 0;

    // Inizializza indicatore sul primo bottone
    activeButton(buttons, buttons[activeIndex])
    buttons.forEach(btn => {
        btn.addEventListener("transitionend", () => {
            updateIndicatorPosition(container, indicator, buttons[activeIndex]);
        });
    })
    updateIndicatorPosition(container, indicator, buttons[activeIndex]);

    // Aggiorna indicatore al click sui bottoni
    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            activeIndex = index;
            activeButton(buttons, buttons[index]);
            updateIndicatorPosition(container, indicator, buttons[activeIndex]);

            // Gestione classe active
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Aggiorna indicatore al resize della finestra
    window.addEventListener("resize", () => updateIndicatorPosition(container, indicator, buttons[activeIndex]));

    // Classe active al bottone di default
    buttons[activeIndex].classList.add("active");
    console.log("Missions Type Bar initialized");
}
