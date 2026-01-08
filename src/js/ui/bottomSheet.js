export function initializeBottomSheet(bottomSheetEl, overlayEl, openButtonEl) {
    isClosing = false;

    openButtonEl.addEventListener('click', () => openBottomSheet(bottomSheetEl, overlayEl));
    overlayEl.addEventListener('click', () => closeBottomSheet(bottomSheetEl, overlayEl));

    closeBottomSheet(bottomSheetEl, overlayEl);
}

// Non dovrebbe essere globale (problema multiple istanze di bottom-sheet), ma non importa
let isClosing = false;

export function openBottomSheet(bottomSheetEl, overlayEl) {
    isClosing = false;

    bottomSheetEl.style.display = 'block';
    overlayEl.style.display = 'block';

    requestAnimationFrame(() => {
        bottomSheetEl.classList.add('active');
        overlayEl.classList.add('active');
    });
}

export function closeBottomSheet(bottomSheetEl, overlayEl) {
    isClosing = true;

    bottomSheetEl.classList.remove('active');
    overlayEl.classList.remove('active');

    const onEnd = (e) => {
        if (e.target !== bottomSheetEl) return;
        if (e.propertyName !== 'transform') return;
        if (!isClosing) return;

        bottomSheetEl.style.display = 'none';
        overlayEl.style.display = 'none';
        bottomSheetEl.removeEventListener('transitionend', onEnd);
    };

    bottomSheetEl.addEventListener('transitionend', onEnd);
}