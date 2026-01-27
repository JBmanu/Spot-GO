import { initializeBottomSheet } from "./ui/bottomSheet.js";
import { initializeBottomSheetFilters } from "./common/bottomSheetFilters.js";
import { initializeStarRating } from "./common/starRating.js";
import { initializeTimeRangeControl } from "./common/timeRange.js";

export async function loadComponentAsDocument(path) {
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
let keyboardId = 0;

export async function createSearchBarWithKeyboard(placeholder, onValueChanged) {
    if (!keyboardId) keyboardId = 0;
    const searchDoc = await loadComponentAsDocument("../html/common-components/search-bar/search-bar.html");
    const keyboardDoc = await loadComponentAsDocument("../html/common-components/search-bar/keyboard.html");
    const overlayDoc = await loadComponentAsDocument("../html/common-components/search-bar/keyboard-overlay.html");

    // Root elements
    const searchBarEl = searchDoc.body.firstElementChild;
    const keyboardEl = keyboardDoc.body.firstElementChild;
    const overlayEl = overlayDoc.body.firstElementChild;

    const searchInput = searchBarEl.querySelector("#view-all-saved-search");
    const newId = `view-all-saved-search-${keyboardId}`;
    searchInput.id = newId;
    keyboardId++;

    const clearBtn = searchDoc.querySelector("#reset-search-btn");
    clearBtn.id = `reset-search-btn-${keyboardId}`;
    clearBtn.hidden = true;

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        onValueChanged("");
        clearBtn.hidden = true;
    });

    searchInput.addEventListener('input', () => {
        clearBtn.hidden = searchInput.value.trim() == '';
    });


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

    searchInput.addEventListener("click", () => {
        searchInput.focus();
    });

    // =========================
    // FOCUS / BLUR
    // =========================
    searchInput.addEventListener("focus", () => {
        keyboard.classList.add("keyboard-visible");
        overlay.classList.add("overlay-visible");

        keyboard.style.transform = "translateY(0)";
        overlay.style.transform = "translateY(0)";

        const searchBarRect = searchBarEl.getBoundingClientRect();
        const overlayContainer = overlay.closest('[data-overlay-view]') || document.body;
        const overlayRect = overlayContainer.getBoundingClientRect();
    
        const topOffset = searchBarRect.bottom - overlayRect.top;
        overlay.style.top = topOffset + 'px';

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

    keyboard.classList.add("keyboard");
    overlay.classList.add("keyboard-overlay");

    return {
        searchBarEl,
        keyboardEl,
        overlayEl,
        newId,
    };
}

export async function createBottomSheetWithOverlay(openButtonEl) {
    const bottomSheetDoc = await loadComponentAsDocument("../html/common-components/search-bar/bottom-sheet.html");
    const overlayDoc = await loadComponentAsDocument("../html/common-components/search-bar/bottom-sheet-overlay.html");

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

export async function createSearchBarWithKeyboardAndFilters(
    { placeholder, onValueChanged, bottomSheetContentCreator, onFiltersApplied }) {
    const { searchBarEl, keyboardEl, overlayEl } =
        await createSearchBarWithKeyboard(placeholder, onValueChanged);
    
    const filterButton = searchBarEl.querySelector('#view-all-saved-filter-btn');

    const { bottomSheetEl, bottomSheetOverlayEl } =
        await createBottomSheetWithOverlay(filterButton);

    // Aggiunta del contenuto del bottom-sheet dinamicamente
    const bottomSheetContent =
        await bottomSheetContentCreator(bottomSheetEl, bottomSheetOverlayEl, filterButton, onFiltersApplied);
    
    bottomSheetEl.querySelector('.filter-content').appendChild(bottomSheetContent);

    return {
        searchBarEl,
        keyboardEl,
        overlayEl,
        bottomSheetEl,
        bottomSheetOverlayEl
    }
}

export async function createBottomSheetWithStandardFilters(bottomSheetEl, overlayEl, buttonEl, onFiltersApplied) {
    const filtersDoc = await loadComponentAsDocument("../html/common-components/search-bar/bottom-sheet-filters.html");

    const filtersEl = filtersDoc.body.firstElementChild;

    if (!filtersEl) {
        console.warn("BottomSheetFilters: elementi mancanti");
        return filtersEl;
    }

    await initializeBottomSheetFilters({
        filtersEl: filtersEl,
        bottomSheetEl : bottomSheetEl,
        overlayEl: overlayEl,
        buttonEl: buttonEl,
        onFiltersApplied: onFiltersApplied});

    return filtersEl;
}

export async function createStarRating() {
    const starRatingDoc = await loadComponentAsDocument("../html/common-components/star-rating/star-rating.html");

    const starRatingEl = starRatingDoc.body.firstElementChild;

    if (!starRatingEl) {
        console.warn("StarRating: elementi mancanti");
        return starRatingEl;
    }

    initializeStarRating(starRatingEl);

    return starRatingEl;
}

export async function createTimeRange() {
    const timeRangeDoc = await loadComponentAsDocument("../html/common-components/time-range/time-range.html");

    const timeRangeEl = timeRangeDoc.body.firstElementChild;

    if (!timeRangeEl) {
        console.warn("TimeRange: elementi mancanti");
        return timeRangeEl;
    }

    initializeTimeRangeControl(timeRangeEl);

    return timeRangeEl;
}
