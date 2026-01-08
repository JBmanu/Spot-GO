/**
 * Imposta il contenuto testuale di un elemento se esiste.
 * @param {HTMLElement} el - L'elemento su cui impostare il testo.
 * @param {string|number} value - Il valore da impostare.
 */
export function setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
}


/**
 * Imposta l'immagine di un elemento img.
 * @param {HTMLImageElement} imgEl - L'elemento immagine.
 * @param {string} src - Il percorso dell'immagine.
 * @param {string} alt - Il testo alternativo.
 */
export function setImage(imgEl, src, alt) {
    if (!imgEl) return;
    imgEl.src = src || "";
    imgEl.alt = alt || "";
}


/**
 * Estrae il valore della valutazione da un oggetto spot, controllando varie chiavi possibili.
 * @param {Object} spot - L'oggetto spot.
 * @returns {number|null} Il valore della valutazione o null.
 */
export function pickRating(spot) {
    return spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
}


/**
 * Converte un numero di valutazione in una stringa formattata.
 * @param {number|string} v - Il valore della valutazione.
 * @returns {string} La stringa della valutazione formattata.
 */
export function formatRatingAsText(v) {
    const n = Number(String(v ?? "").replace(",", "."));
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 10) / 10).toFixed(1);
}


/**
 * Garantisce che il pulsante dei segnalibri abbia gli attributi dataset necessari.
 * @param {HTMLElement} card - L'elemento card contenente il pulsante dei segnalibri.
 * @param {Object} options - Opzioni per il pulsante.
 * @param {string} options.saved - Valore per data-saved.
 * @param {string} options.type - Valore per data-bookmark-type.
 */
export function initializeBookmarkButtonAttributes(card, {saved = "false", type = "generic"} = {}) {
    const btn = card.querySelector("[data-bookmark-button]");
    if (!btn) return;

    if (typeof btn.dataset.saved === "undefined") btn.dataset.saved = saved;
    if (!btn.hasAttribute("data-bookmark-type")) btn.setAttribute("data-bookmark-type", type);
}