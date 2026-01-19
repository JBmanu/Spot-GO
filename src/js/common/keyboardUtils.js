let activeKeyboard = null;

export function attachSimulatedKeyboard(keyboardEl) {
    if (!keyboardEl) {
        console.warn("attachSimulatedKeyboard: keyboardEl is null or undefined.");
        return;
    }

    removeSimulatedKeyboard();

    activeKeyboard = keyboardEl;
    const appToolbar = document.querySelector(".app-toolbar");

    if (appToolbar) {
        appToolbar.appendChild(activeKeyboard);
    } else {
        document.body.appendChild(activeKeyboard);
        console.warn("attachSimulatedKeyboard: .app-toolbar not found, attached to body.");
    }
}

export function removeSimulatedKeyboard() {
    if (activeKeyboard) {
        activeKeyboard.remove();
    }
}
