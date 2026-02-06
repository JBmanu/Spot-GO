const statusStates = new WeakMap();

export const mapping = {
    'salvato': 'saved',
    'badge': 'badge',
    'creato': 'mine'
};

/**
 * Recupera o inizializza lo stato dei filtri per un dato contenitore.
 * Utilizziamo un oggetto per mappare i 3 stati boolean.
 */
export function getStatusState(containerEl) {
    if (!containerEl) return { badges: false, saved: false, mine: false };
    if (!statusStates.has(containerEl)) {
        statusStates.set(containerEl, {
            saved: false,
            badge: false,
            mine: false
        });
    }
    return statusStates.get(containerEl);
}

export function getActiveStatusFilters(containerEl) {
    return { ...getStatusState(containerEl) };
}

export function setupStatusFilter(containerEl, { onChange } = {}) {
    if (!containerEl) return;
    if (containerEl.dataset.statusFilterInitialized === "true") return;
    containerEl.dataset.statusFilterInitialized = "true";

    containerEl.addEventListener("click", (e) => {
        const button = e.target.closest(".home-chip");
        if (!button) return;

        const rawCategory = button.dataset.category;
        if (!rawCategory) return;
        
        const stateKey = mapping[rawCategory];
        const state = getStatusState(containerEl);
        
        if (stateKey) {
            state[stateKey] = !state[stateKey];

            // Aggiornamento UI
            button.classList.toggle("active", state[stateKey]);
            button.setAttribute("aria-pressed", state[stateKey] ? "true" : "false");

            onChange?.({ ...state });
        }
    });
}

export function resetStatusFilter(containerEl) {
    if (!containerEl) return;
    const state = getStatusState(containerEl);
    state.badge = false;
    state.saved = false;
    state.mine = false;

    containerEl.querySelectorAll(".home-chip").forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
    });
}