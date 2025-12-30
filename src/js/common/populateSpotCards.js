import { getCategoryNameIt } from "../query.js";

function normalizeCat(cat) {
    return String(cat || "").trim().toLowerCase();
}

export function fillSpotCard(cardEl, spot, {
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
    const cat = normalizeCat(spot.idCategoria);
    if (cat) {
        cardEl.setAttribute("data-category", cat);
        if (wrapperEl) wrapperEl.setAttribute("data-category", cat);
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
