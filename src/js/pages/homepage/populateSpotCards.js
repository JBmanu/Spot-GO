import {getCategoryNameIt} from "../../query.js";
import {normalizeCategoryName} from "../../common/categoryFilter.js";

/**
 * Riempie un elemento card con i dati di uno spot.
 * @param {HTMLElement} cardEl - L'elemento card da riempire.
 * @param {Object} spot - L'oggetto spot con i dati.
 * @param {Object} options - Opzioni aggiuntive.
 * @param {HTMLElement} options.wrapperEl - L'elemento wrapper opzionale.
 * @param {boolean} options.setCategoryText - Se impostare il testo della categoria.
 * @param {boolean} options.hideIfMissingId - Se nascondere se manca l'ID.
 */
export function fillSpotCard(cardEl,
                             spot,
                             {
                                 wrapperEl = null,
                                 setCategoryText = true,
                                 hideIfMissingId = true,
                             } = {}) {
    if (!cardEl) return;
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
    const titleEl = cardEl.querySelector('[data-field="title"]');
    if (titleEl) titleEl.textContent = spot.nome || "Spot";
    const imageEl = cardEl.querySelector('[data-field="image"]');
    if (imageEl) {
        imageEl.src = spot.immagine || "";
        imageEl.alt = spot.nome || "Foto spot";
    }
    const normalizedCat = normalizeCategoryName(spot.idCategoria);
    if (normalizedCat) {
        cardEl.setAttribute("data-category", normalizedCat);
        if (wrapperEl) wrapperEl.setAttribute("data-category", normalizedCat);
    } else {
        cardEl.removeAttribute("data-category");
        if (wrapperEl) wrapperEl.removeAttribute("data-category");
    }
    if (setCategoryText) {
        const categoryEl = cardEl.querySelector('[data-field="category"]');
        if (categoryEl) {
            getCategoryNameIt(spot.idCategoria).then(name => {
                categoryEl.textContent = name || spot.idCategoria;
            }).catch(() => {
                categoryEl.textContent = spot.idCategoria;
            });
        }
    }
}
