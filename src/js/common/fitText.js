export function fitText(selector, maxLines = 2, minFont = 10.5) {
    const elements = document.querySelectorAll(selector);
    if (!elements || elements.length === 0) return;

    elements.forEach((el) => {
        const cs = window.getComputedStyle(el);
        const originalFs = el.dataset.originalFontSize || cs.fontSize;
        el.dataset.originalFontSize = originalFs;

        let font = parseFloat(originalFs);

        let lineH = parseFloat(cs.lineHeight);
        if (isNaN(lineH)) lineH = font * 1.05;

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

export function initFitText(selector, containerSelector, maxLines = 2, minFont = 10.5) {
    fitText(selector, maxLines, minFont);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => fitText(selector, maxLines, minFont), 120);
    });

    const container = document.querySelector(containerSelector);
    if (!container) return;

    const observer = new MutationObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => fitText(selector, maxLines, minFont), 60);
    });

    observer.observe(container, { childList: true, subtree: true });
}

export function formatRatingAsText(v) {
    const n = Number(String(v ?? "").replace(",", "."));
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 10) / 10).toFixed(1);
}
