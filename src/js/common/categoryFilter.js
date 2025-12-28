// js/features/spots/categoryFilter.js

/**
 * Filtra le card spot in base alle categorie selezionate.
 * Requisiti:
 * - card: [role="listitem"][data-spot-id]
 * - categoria preferita su wrapper: [data-category] (es. .saved-spot-shell)
 *   oppure su card: data-category
 *   oppure testo: [data-field="category"]
 */

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

/**
 * Imposta lo stato (utile quando torni in homepage e vuoi ripristinare chip + filtro).
 */
export function setActiveCategories(categories = []) {
    _activeCategories = new Set(categories.map(normalizeCategoryName));
}

/**
 * Resetta stato + UI chip (se container passato).
 */
export function resetCategoryFilter(containerEl) {
    _activeCategories.clear();

    if (!containerEl) return;
    containerEl.querySelectorAll(".home-chip").forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
    });
}

/**
 * Trova la categoria associata alla card.
 * Priorità:
 * 1) card data-category
 * 2) wrapper più vicino con data-category (es. saved-spot-shell)
 * 3) [data-field="category"] testo
 */
function getCardCategory(card) {
    // 1) data-category sulla card
    let cat = (card.getAttribute("data-category") || "").trim();
    if (cat) return normalizeCategoryName(cat);

    // 2) data-category sul wrapper
    const wrapperWithCat = card.closest("[data-category]");
    if (wrapperWithCat) {
        cat = (wrapperWithCat.getAttribute("data-category") || "").trim();
        if (cat) return normalizeCategoryName(cat);
    }

    // 3) testo categoria nella card
    const field = card.querySelector('[data-field="category"]');
    if (field) {
        cat = String(field.textContent || "").trim();
        if (cat) return normalizeCategoryName(cat);
    }

    return ""; // sconosciuta
}

/**
 * Filtra card nel DOM.
 * scopeEl: limita la ricerca (consigliato: document.getElementById("main"))
 *
 * NOTE: nascondiamo/mostriamo il WRAPPER (se esiste) per non lasciare "pedestal" visibili.
 */
export function filterSpotsByCategory(categories = [], scopeEl = document) {
    const normalizedCats = categories.map(normalizeCategoryName);

    const cards = scopeEl.querySelectorAll('[role="listitem"][data-spot-id]');

    cards.forEach((card) => {
        // ignora template / roba nascosta
        if (card.closest("[data-template]")) return;
        if (card.hidden) return;

        const spotId = (card.getAttribute("data-spot-id") || "").trim();

        const wrapper =
            card.closest(".saved-spot-shell") || // caso saved
            card.closest("[data-spot-wrapper]") || // se un giorno ne aggiungi uno generico
            card;

        // placeholder/slot vuoti
        if (!spotId) {
            wrapper.style.display = normalizedCats.length > 0 ? "none" : "";
            return;
        }

        // se nessun filtro, mostra tutto
        if (normalizedCats.length === 0) {
            wrapper.style.display = "";
            return;
        }

        const cardCat = getCardCategory(card);
        const match = cardCat ? normalizedCats.includes(cardCat) : false;

        wrapper.style.display = match ? "" : "none";
    });
}

/**
 * Aggancia il listener alle chip categorie in homepage.
 * containerEl: #home-categories-container
 * options:
 *  - scopeEl: dove filtrare (default: document)
 *  - onChange(activeCategories)
 */
export function setupCategoryFilter(containerEl, { scopeEl = document, onChange } = {}) {
    if (!containerEl) return;

    // evita doppio attach quando la homepage viene reinizializzata
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
