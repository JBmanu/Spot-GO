const CONTAINER = ".mission-type-bar";
const INDICATOR = ".indicator-mission-type-bar";
const BUTTON = ".mission-type-btn";

function activeButton(buttons, activeButton) {
    const ICON_ACTIVE_CLASS = "icon";
    const ICON_INACTIVE_CLASS = "icon-mini";

    const TEXT_ACTIVE_CLASS = "font-semibold";
    const TEXT_INACTIVE_CLASS = "font-normal";

    buttons.forEach(button => {
        const icon = button.querySelector("img");
        const text = button.querySelector("span");

        // reset stato
        icon.classList.remove(ICON_ACTIVE_CLASS);
        icon.classList.add(ICON_INACTIVE_CLASS);
        text.classList.remove(TEXT_ACTIVE_CLASS);
        text.classList.add(TEXT_INACTIVE_CLASS);
    });

    // stato attivo
    const activeIcon = activeButton.querySelector("img");
    const activeText = activeButton.querySelector("span");

    activeIcon.classList.remove(ICON_INACTIVE_CLASS);
    activeIcon.classList.add(ICON_ACTIVE_CLASS);
    activeText.classList.remove(TEXT_INACTIVE_CLASS);
    activeText.classList.add(TEXT_ACTIVE_CLASS);
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
