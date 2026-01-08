let _activeCategories = new Set();

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

export function getActiveCategories() {
    return Array.from(_activeCategories);
}

export function normalizeCategoryName(categoryName) {
    const key = String(categoryName || "").trim().toLowerCase();
    return CATEGORY_MAP[key] || key;
}

export function setActiveCategories(categories = []) {
    _activeCategories = new Set(categories.map(normalizeCategoryName));
}

export function resetCategoryFilter(containerEl) {
    _activeCategories.clear();

    if (!containerEl) return;
    containerEl.querySelectorAll(".home-chip").forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
    });
}

function getSpotWrapper(card) {
    return card.closest("[data-spot-wrapper]") || card;
}

function getCardCategory(card) {
    let cat = (card.getAttribute("data-category") || "").trim();
    if (cat) return normalizeCategoryName(cat);
    const wrapperWithCat = card.closest("[data-category]");
    if (wrapperWithCat) {
        cat = (wrapperWithCat.getAttribute("data-category") || "").trim();
        if (cat) return normalizeCategoryName(cat);
    }
    const field = card.querySelector('[data-field="category"]');
    if (field) {
        cat = String(field.textContent || "").trim();
        if (cat) return normalizeCategoryName(cat);
    }
    return "";
}

export function filterSpotsByCategory(categories = [], scopeEl = document) {
    const normalizedCats = categories.map(normalizeCategoryName);
    const cards = scopeEl.querySelectorAll('[role="listitem"][data-spot-id]');
    cards.forEach((card) => {
        if (card.hidden) return;
        const wrapper = getSpotWrapper(card);
        const spotId = (card.getAttribute("data-spot-id") || "").trim();
        if (!spotId) {
            wrapper.style.display = normalizedCats.length > 0 ? "none" : "";
            return;
        }
        if (normalizedCats.length === 0) {
            wrapper.style.display = "";
            return;
        }
        const cardCat = getCardCategory(card);
        const match = cardCat ? normalizedCats.includes(cardCat) : false;
        wrapper.style.display = match ? "" : "none";
    });
}

export function setupCategoryFilter(containerEl, {scopeEl = document, onChange} = {}) {
    if (!containerEl) return;
    if (containerEl.dataset.categoryFilterInitialized === "true") return;
    containerEl.dataset.categoryFilterInitialized = "true";
    containerEl.addEventListener("click", (e) => {
        const button = e.target.closest(".home-chip");
        if (!button) return;
        const rawCategory = button.dataset.category;
        if (!rawCategory) return;
        const category = normalizeCategoryName(rawCategory);
        const isActive = _activeCategories.has(category);
        if (isActive) {
            _activeCategories.delete(category);
            button.classList.remove("active");
            button.setAttribute("aria-pressed", "false");
        } else {
            _activeCategories.add(category);
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");
        }
        const active = Array.from(_activeCategories);
        filterSpotsByCategory(active, scopeEl);
        onChange?.(active);
    });
}
