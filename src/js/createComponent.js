import { getCategoryNameIt } from "./query.js";
import { initializeBottomSheet } from "./ui/bottomSheet.js";

async function loadComponentAsDocument(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) return;

        const html = await response.text();
        const parser = new DOMParser();
        const tempDoc = parser.parseFromString(html, "text/html");
        return tempDoc;
    } catch (err) {
        console.log(`Errore nel caricamento del componente [${path}]`);
    }
}

/**
 * Crea una search bar con keyboard overlay integrata
 *
 * @param {string} placeholder
 * @param {(value: string, event: Event) => void} onValueChanged
 * @returns {Promise<{ searchBarEl: HTMLElement, keyboardOverlayEl: HTMLElement }>}
 */
export async function createSearchBarWithKeyboard(placeholder, onValueChanged) {
    const searchDoc = await loadComponentAsDocument("../html/common-components/search-bar.html");
    const keyboardDoc = await loadComponentAsDocument("../html/common-components/keyboard.html");
    const overlayDoc = await loadComponentAsDocument("../html/common-components/keyboard-overlay.html");

    // Root elements
    const searchBarEl = searchDoc.body.firstElementChild;
    const keyboardEl = keyboardDoc.body.firstElementChild;
    const overlayEl = overlayDoc.body.firstElementChild;

    const searchInput = searchBarEl.querySelector("#view-all-saved-search");
    const keyboard = keyboardEl; // id="view-all-saved-keyboard"
    const overlay = overlayEl;   // id="view-all-saved-keyboard-overlay"

    const track = document.querySelector(".view-all-saved-track");

    if (!searchInput || !keyboard || !overlay) {
        console.warn("SearchBarWithKeyboard: elementi mancanti");
        return { searchBarEl, keyboardEl, overlayEl };
    }

    // =========================
    // PLACEHOLDER
    // =========================
    searchInput.placeholder = placeholder;

    // =========================
    // INPUT
    // =========================
    searchInput.addEventListener("input", (e) => {
        onValueChanged(e.target.value, e);
    });

    // =========================
    // FOCUS / BLUR
    // =========================
    searchInput.addEventListener("focus", () => {
        keyboard.classList.add("keyboard-visible");
        overlay.classList.add("overlay-visible");

        keyboard.style.transform = "translateY(0)";
        overlay.style.transform = "translateY(0)";

        if (track && window.innerWidth <= 1024) {
            track.style.transform = "translateY(-320px)";
            track.style.transition =
                "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        }
    });

    searchInput.addEventListener("blur", () => {
        keyboard.classList.remove("keyboard-visible");
        overlay.classList.remove("overlay-visible");

        keyboard.style.transform = "translateY(100%)";
        overlay.style.transform = "translateY(100%)";

        searchInput.dispatchEvent(new Event("input", { bubbles: true }));

        if (track) {
            track.style.transform = "translateY(0)";
            track.style.transition =
                "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        }
    });

    // =========================
    // KEYBOARD BUTTONS
    // =========================
    const keyButtons = keyboard.querySelectorAll(".kb-key, .kb-space, .kb-backspace");
    const closeBtn = keyboard.querySelector(".kb-close");

    keyButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();

            const key = button.dataset.key;

            if (key === "backspace") {
                searchInput.value = searchInput.value.slice(0, -1);
            } else if (key === " ") {
                searchInput.value += " ";
            } else {
                searchInput.value += key.toLowerCase();
            }

            searchInput.focus();
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        });
    });

    closeBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        searchInput.blur();
    });

    overlay.addEventListener("click", (e) => {
        e.preventDefault();
        searchInput.blur();
    });

    keyboard.addEventListener("mousedown", (e) => e.preventDefault());

    return {
        searchBarEl,
        keyboardEl,
        overlayEl
    };
}

export async function createBottomSheetWithOverlay(openButtonEl) {
    const bottomSheetDoc = await loadComponentAsDocument("../html/common-components/bottom-sheet.html");
    const overlayDoc = await loadComponentAsDocument("../html/common-components/bottom-sheet-overlay.html");

    const bottomSheetEl = bottomSheetDoc.body.firstElementChild;
    const bottomSheetOverlayEl = overlayDoc.body.firstElementChild;

    if (!bottomSheetEl || !bottomSheetOverlayEl || !openButtonEl) {
        console.warn("BottomSheet: elementi mancanti");
        return { bottomSheetEl, bottomSheetOverlayEl };
    }

    initializeBottomSheet(bottomSheetEl, bottomSheetOverlayEl, openButtonEl);

    return {
        bottomSheetEl,
        bottomSheetOverlayEl
    };
}

export async function createSearchBarWithKeyboardAndFilters(placeholder, onValueChanged, bottomSheetContentCreator) {
    const { searchBarEl, keyboardEl, overlayEl } =
        await createSearchBarWithKeyboard(placeholder, onValueChanged);
    
    const filterButton = searchBarEl.querySelector('#view-all-saved-filter-btn');

    const { bottomSheetEl, bottomSheetOverlayEl } =
        await createBottomSheetWithOverlay(filterButton);

    // Aggiunta del contenuto del bottom-sheet dinamicamente
    const bottomSheetContent = await bottomSheetContentCreator();
    bottomSheetEl.querySelector('.filter-content').appendChild(bottomSheetContent);

    return {
        searchBarEl,
        keyboardEl,
        overlayEl,
        bottomSheetEl,
        bottomSheetOverlayEl
    }
}

export async function createBottomSheetStandardFilters() {
    const filtersDoc = await loadComponentAsDocument("../html/common-components/bottom-sheet-filters.html");

    const filtersEl = filtersDoc.body.firstElementChild;

    if (!filtersEl) {
        console.warn("BottomSheetFilters: elementi mancanti");
        return filtersEl;
    }

    return filtersEl;
}

/**
 * Crea una card "spot vicino".
 *
 * @param {Object} spot - Oggetto spot dal DB.
 * @param {string} distance - Distanza formattata (es. "350 m").
 * @returns {Promise<HTMLElement>} Elemento DOM pronto per essere aggiunto alla pagina.
 */
export async function createNearbySpotCard(spot, distance) {
    const doc = await loadComponentAsDocument("../html/common-components/nearby-spot-card.html");

    if (!doc) return null;

    const card = doc.body.firstElementChild;

    // Nome
    const title = card.querySelector('[data-field="title"]');
    if (title) title.textContent = spot.nome;

    // Immagine
    const image = card.querySelector('[data-field="image"]');
    if (image) {
        image.src = spot.immagine;
        image.alt = `Foto di ${spot.nome}`;
    }

    // Distanza
    const distanceEl = card.querySelector('[data-field="distance"]');
    if (distanceEl) distanceEl.textContent = distance;

    // Categoria
    const categoryEl = card.querySelector('[data-field="category"]');
    if (categoryEl) {
        categoryEl.textContent = await getCategoryNameIt(spot.idCategoria);
    }

    // Dataset
    card.dataset.spotId = spot.id ?? "";
    card.dataset.category = spot.idCategoria;
    card.dataset.saved = "true";

    // Eventi (?)
    card.addEventListener("click", () => {
        console.log("Apri dettaglio spot:", spot.nome);
    });

    return card;
}
