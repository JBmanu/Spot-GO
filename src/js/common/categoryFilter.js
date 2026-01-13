const containerStates = new WeakMap();

const CATEGORY_MAP = {
    cibo: "food",
    cultura: "culture",
    natura: "nature",
    mistero: "mystery",
    food: "food",
    culture: "culture",
    nature: "nature",
    mystery: "mystery",
};


function getContainerState(containerEl) {
    if (!containerEl) return new Set();
    if (!containerStates.has(containerEl)) {
        containerStates.set(containerEl, new Set());
    }
    return containerStates.get(containerEl);
}

export function getActiveCategories(containerEl) {
    return Array.from(getContainerState(containerEl));
}

export function normalizeCategoryName(categoryName) {
    const key = String(categoryName || "").trim().toLowerCase();
    return CATEGORY_MAP[key] || key;
}

export function resetCategoryFilter(containerEl) {
    if (!containerEl) return;
    const state = getContainerState(containerEl);
    state.clear();

    containerEl.querySelectorAll(".home-chip").forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
    });
}

export function setupCategoryFilter(containerEl, { onChange } = {}) {
    if (!containerEl) return;
    if (containerEl.dataset.categoryFilterInitialized === "true") return;
    containerEl.dataset.categoryFilterInitialized = "true";

    containerEl.addEventListener("click", (e) => {
        const button = e.target.closest(".home-chip");
        if (!button) return;

        const rawCategory = button.dataset.category;
        if (!rawCategory) return;

        const category = normalizeCategoryName(rawCategory);
        const state = getContainerState(containerEl);
        const isActive = state.has(category);

        if (isActive) {
            state.delete(category);
            button.classList.remove("active");
            button.setAttribute("aria-pressed", "false");
        } else {
            state.add(category);
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");
        }

        const active = Array.from(state);
        onChange?.(active);
    });
}
