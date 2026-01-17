import {initializeBottomSheet} from "../ui/bottomSheet.js";
import {initializeBottomSheetFilters} from "./bottomSheetFilters.js";


async function loadTemplate(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) return null;
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        return doc.body.firstElementChild;
    } catch (err) {
        console.error(`SearchSystem: Errore caricamento [${path}]`, err);
        return null;
    }
}

export class SearchSystem {
    constructor({
                    placeholder = "Cerca...",
                    onSearch = () => {
                    },
                    onFocus = () => {
                    },
                    onBlur = () => {
                    },
                    onFiltersApply = () => {
                    },

                }) {
        this.placeholder = placeholder;
        this.onSearch = onSearch;
        this.onFocus = onFocus;
        this.onBlur = onBlur;
        this.overlayMode = overlayMode;


        if (filterConfig) {
            this.filterConfig = filterConfig;
        } else if (enableFilters) {
            this.filterConfig = {
                standard: true,
                onApply: onFiltersApply
            };
        } else {
            this.filterConfig = null;
        }

        this.elements = {
            searchBar: null,
            keyboard: null,
            overlay: null,
            input: null,
            filterBtn: null,
            bottomSheet: null,
            bottomSheetOverlay: null
        };
    }

    async init() {

        this.elements.searchBar = await loadTemplate("../html/common-components/search-bar/search-bar.html");

        this.elements.keyboard = await loadTemplate("../html/common-components/search-bar/keyboard.html");

        this.elements.overlay = await loadTemplate("../html/common-components/search-bar/keyboard-overlay.html");

        if (!this.elements.searchBar || !this.elements.keyboard || !this.elements.overlay) {
            console.error("SearchSystem: Failed to initialize. Check template paths.");
            return null;
        }

        this.elements.input = this.elements.searchBar.querySelector("input");
        this.elements.filterBtn = this.elements.searchBar.querySelector("button");


        this.setupSearchInput();
        this.setupKeyboard();
        this.setupOverlay();
        await this.setupFilterButton();

        return {
            searchBarEl: this.elements.searchBar,
            keyboardEl: this.elements.keyboard,
            overlayEl: this.elements.overlay
        };
    }

    setupSearchInput() {
        const input = this.elements.input;
        input.placeholder = this.placeholder;

        input.addEventListener("input", (e) => {
            if (this.onSearch) this.onSearch(e.target.value, e);
        });

        input.addEventListener("click", () => {
            input.focus();
        });

        input.addEventListener("focus", () => {
            this.showKeyboard();
            if (this.onFocus) this.onFocus();
        });

        input.addEventListener("blur", () => {
            this.hideKeyboard();
            if (this.onBlur) this.onBlur();
        });
    }

    setupKeyboard() {
        const keyboard = this.elements.keyboard;
        keyboard.classList.add("keyboard");
        keyboard.addEventListener("mousedown", (e) => e.preventDefault());

        const keyButtons = keyboard.querySelectorAll(".kb-key, .kb-space, .kb-backspace");
        keyButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                const key = button.dataset.key;
                const input = this.elements.input;

                if (key === "backspace") {
                    input.value = input.value.slice(0, -1);
                } else if (key === " ") {
                    input.value += " ";
                } else {
                    input.value += key.toLowerCase();
                }

                input.focus();
                input.dispatchEvent(new Event("input", {bubbles: true}));
            });
        });

        const closeBtn = keyboard.querySelector(".kb-close");
        closeBtn?.addEventListener("click", (e) => {
            e.preventDefault();
            this.elements.input.blur();
        });
    }

    setupOverlay() {
        const overlay = this.elements.overlay;
        overlay.classList.add("keyboard-overlay");

        if (this.overlayMode === "hidden") {
            overlay.classList.add("keyboard-overlay-hidden");
        } else {
            overlay.classList.remove("keyboard-overlay-hidden");
        }

        overlay.addEventListener("click", (e) => {
            e.preventDefault();
            this.elements.input.blur();
        });
    }

    async setupFilterButton() {
        const btn = this.elements.filterBtn;

        if (!this.filterConfig) {
            if (btn) btn.style.display = "none";
            return;
        }

        if (btn) btn.style.display = "flex";


        const bottomSheetEl = await loadTemplate("../html/common-components/search-bar/bottom-sheet.html");
        const bottomSheetOverlayEl = await loadTemplate("../html/common-components/search-bar/bottom-sheet-overlay.html");

        if (!bottomSheetEl || !bottomSheetOverlayEl) {
            console.warn("SearchSystem: Failed to load bottom sheet templates");
            return;
        }


        initializeBottomSheet(bottomSheetEl, bottomSheetOverlayEl, btn);

        this.elements.bottomSheet = bottomSheetEl;
        this.elements.bottomSheetOverlay = bottomSheetOverlayEl;


        if (this.filterConfig.standard) {

            const content = await loadTemplate("../html/common-components/search-bar/bottom-sheet-filters.html");
            if (content) {
                const container = bottomSheetEl.querySelector('.filter-content') || bottomSheetEl;
                container.appendChild(content);

                await initializeBottomSheetFilters({
                    filtersEl: content,
                    bottomSheetEl: bottomSheetEl,
                    overlayEl: bottomSheetOverlayEl,
                    buttonEl: btn,
                    onFiltersApplied: this.filterConfig.onApply
                });
            }
        } else if (this.filterConfig.contentCreator) {

            const content = await this.filterConfig.contentCreator(
                bottomSheetEl,
                bottomSheetOverlayEl,
                btn,
                this.filterConfig.onApply
            );

            if (content) {
                const container = bottomSheetEl.querySelector('.filter-content') || bottomSheetEl;
                container.appendChild(content);
            }
        }
    }

    showKeyboard() {
        const {keyboard, overlay, searchBar} = this.elements;
        if (!keyboard || !overlay) return;

        keyboard.classList.add("keyboard-visible");
        overlay.classList.add("overlay-visible");

        keyboard.style.transform = "translateY(0)";
        overlay.style.transform = "translateY(0)";

        const searchBarRect = searchBar.getBoundingClientRect();
        const overlayContainer = overlay.closest('[data-overlay-view]') || document.body;
        const overlayRect = overlayContainer.getBoundingClientRect();

        const topOffset = searchBarRect.bottom - overlayRect.top;
        overlay.style.top = topOffset + 'px';
    }

    hideKeyboard() {
        const {keyboard, overlay} = this.elements;
        if (!keyboard || !overlay) return;

        keyboard.classList.remove("keyboard-visible");
        overlay.classList.remove("overlay-visible");

        keyboard.style.transform = "translateY(100%)";
        overlay.style.transform = "translateY(100%)";
    }
}
