let fitSavedObserver;
let fitSavedDebounce;

/**
 * Adatta la dimensione del titolo delle card salvate a 2 righe massime.
 */
export function fitSavedTitles() {
    const titles = document.querySelectorAll('.spot-card--saved .spot-card-title');
    if (!titles || titles.length === 0) return;

    titles.forEach((el) => {
        const cs = window.getComputedStyle(el);
        const originalFs = el.dataset.originalFontSize || cs.fontSize;
        el.dataset.originalFontSize = originalFs;

        let font = parseFloat(originalFs);
        const minFont = 10.5;

        let lineH = parseFloat(cs.lineHeight);
        if (isNaN(lineH)) lineH = font * 1.05;

        const maxLines = 2;
        const maxHeight = lineH * maxLines;

        el.style.fontSize = font + 'px';
        el.style.whiteSpace = 'normal';

        let tries = 0;
        while (el.scrollHeight > maxHeight && font > minFont && tries < 40) {
            font = Math.max(minFont, +(font - 0.5).toFixed(2));
            el.style.fontSize = font + 'px';
            tries++;
        }

        if (font < minFont) {
            el.style.fontSize = minFont + 'px';
        }
    });
}

/**
 * Inizializza l'adattamento dei titoli salvati con listener su resize e mutazioni DOM.
 */
export function initFitSavedTitles() {
    fitSavedTitles();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => fitSavedTitles(), 120);
    });

    const container = document.querySelector('.saved-swipe');
    if (!container) return;

    if (fitSavedObserver) {
        fitSavedObserver.disconnect();
    }

    fitSavedObserver = new MutationObserver(() => {
        clearTimeout(fitSavedDebounce);
        fitSavedDebounce = setTimeout(() => fitSavedTitles(), 60);
    });

    fitSavedObserver.observe(container, { childList: true, subtree: true });
}
