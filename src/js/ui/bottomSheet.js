export function initializeBottomSheet(bottomSheetEl, overlayEl, openButtonEl) {
    function openSheet() {
        overlayEl.classList.add("active");
        bottomSheetEl.classList.add("active");
    }

    function closeSheet() {
        overlayEl.classList.remove("active");
        bottomSheetEl.classList.remove("active");
    }

    openButtonEl.addEventListener("click", openSheet);
    overlayEl.addEventListener("click", closeSheet);

    closeSheet();
}

export function closeBottomSheet() {
    // TODO
}