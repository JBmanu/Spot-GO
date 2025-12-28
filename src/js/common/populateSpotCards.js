// src/js/common/populateSpotCards.js

/**
 * Funzioni generiche per riempire (renderizzare) una card spot.
 * Questo file NON decide "quali dati" prendere: decide solo come inserirli nel DOM.
 *
 * Convenzioni attese nel template:
 * - card: [role="listitem"]
 * - titolo: [data-field="title"]
 * - immagine: [data-field="image"] (img)
 * - categoria: [data-field="category"] (opzionale)
 *
 * Supporta filtro categorie:
 * - imposta data-category sulla card
 * - opzionalmente imposta data-category su un wrapper (se passato)
 */

/**
 * Normalizza la categoria in formato stringa usabile in data-attribute.
 */
function normalizeCat(cat) {
    return String(cat || "").trim().toLowerCase();
}

/**
 * Riempie una singola card con i dati di uno spot.
 * @param {HTMLElement} cardEl - elemento con role="listitem"
 * @param {Object} spot - oggetto spot (es. { id, nome, immagine, idCategoria })
 * @param {Object} [options]
 * @param {HTMLElement|null} [options.wrapperEl=null] - se vuoi mettere data-category sul wrapper (es. saved shell)
 * @param {boolean} [options.setCategoryText=true] - se vuoi scrivere la categoria nel field testuale
 * @param {boolean} [options.hideIfMissingId=true] - nasconde se spot.id mancante
 */
export function fillSpotCard(cardEl, spot, {
    wrapperEl = null,
    setCategoryText = true,
    hideIfMissingId = true,
} = {}) {
    if (!cardEl) return;

    // spot mancante => nascondi / reset minimo
    if (!spot) {
        cardEl.style.display = "none";
        cardEl.removeAttribute("data-spot-id");
        cardEl.removeAttribute("data-category");
        return;
    }

    const id = String(spot.id || "").trim();
    if (!id && hideIfMissingId) {
        cardEl.style.display = "none";
        cardEl.removeAttribute("data-spot-id");
        cardEl.removeAttribute("data-category");
        return;
    }

    cardEl.style.display = "";
    cardEl.setAttribute("data-spot-id", id);

    // Titolo
    const titleEl = cardEl.querySelector('[data-field="title"]');
    if (titleEl) titleEl.textContent = spot.nome || "Spot";

    // Immagine
    const imageEl = cardEl.querySelector('[data-field="image"]');
    if (imageEl) {
        imageEl.src = spot.immagine || "";
        imageEl.alt = spot.nome || "Foto spot";
    }

    // Categoria (per filtro: data-category)
    const cat = normalizeCat(spot.idCategoria);
    if (cat) {
        cardEl.setAttribute("data-category", cat);
        if (wrapperEl) wrapperEl.setAttribute("data-category", cat);
    } else {
        cardEl.removeAttribute("data-category");
        if (wrapperEl) wrapperEl.removeAttribute("data-category");
    }

    // Categoria (testo dentro la card) se presente
    if (setCategoryText) {
        const categoryEl = cardEl.querySelector('[data-field="category"]');
        if (categoryEl) categoryEl.textContent = spot.idCategoria || "";
    }
}

/**
 * Helper opzionale: riempie una lista di card "slot-based" (come Nearby),
 * usando un array di spot. Se gli spot finiscono, nasconde le card extra.
 *
 * @param {HTMLElement} containerEl
 * @param {Object[]} spots
 * @param {Object} [options]
 * @param {string} [options.cardSelector='[role="listitem"][data-spot-id]']
 * @param {Function} [options.getWrapper] - (card)=>wrapperEl, se vuoi wrapper per data-category
 */
export function fillSpotSlots(containerEl, spots, {
    cardSelector = '[role="listitem"][data-spot-id]',
    getWrapper = null,
} = {}) {
    if (!containerEl) return;

    const cards = containerEl.querySelectorAll(cardSelector);
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const spot = spots?.[i];

        const wrapperEl = getWrapper ? getWrapper(card) : null;
        fillSpotCard(card, spot, { wrapperEl });
    }
}
