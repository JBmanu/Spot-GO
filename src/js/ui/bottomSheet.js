export function initializeBottomSheet(bottomSheetEl, overlayEl, openButtonEl) {
    let isClosing = false;

    function openSheet() {
        isClosing = false;

        bottomSheetEl.style.display = 'block';
        overlayEl.style.display = 'block';

        requestAnimationFrame(() => {
            bottomSheetEl.classList.add('active');
            overlayEl.classList.add('active');
        });
    }

    function closeSheet() {
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

    openButtonEl.addEventListener('click', openSheet);
    overlayEl.addEventListener('click', closeSheet);

    closeSheet();
}
