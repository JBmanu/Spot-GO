import { getCategoryNameIt, pickRating } from "../../database.js";
import { normalizeCategoryName } from "../../common/categoryFilter.js";
import { formatRatingAsText } from "../../common/fitText.js";
import { initializeBookmarkButton } from "../../common/bookmark.js";
import { distanceFromUserToSpot, formatDistance } from "../../common.js";

const fieldMap = {
    title: (el, spot) => el.textContent = spot.nome || "Spot",
    image: (el, spot) => {
        el.src = spot.immagine?.startsWith('.') ? "../" + spot.immagine.slice(1) : (spot.immagine || "");
        el.alt = spot.nome || "Foto spot";
    },
    rating: (el, spot) => el.textContent = formatRatingAsText(pickRating(spot)) || "4.5",
    distance: (el, spot) => {
        el.textContent = formatDistance(distanceFromUserToSpot(spot)) || "0 m";
    },
    category: async (el, spot) => {
        el.textContent = await getCategoryNameIt(spot.idCategoria).catch(() => spot.idCategoria || "");
    }
};

export function populateSingleSpotCard(cardEl, spot, {
    wrapperEl = null, setCategoryText = true, hideIfMissingId = true,
} = {}) {
    if (!cardEl) return;

    if (!spot || (!String(spot.id || "").trim() && hideIfMissingId)) {
        cardEl.style.display = "none";
        ["data-spot-id", "data-category"].forEach(attr => {
            cardEl.removeAttribute(attr);
            if (wrapperEl) wrapperEl.removeAttribute(attr);
        });
        return;
    }

    cardEl.style.display = "";
    const spotId = String(spot.id);
    cardEl.setAttribute("data-spot-id", spotId);
    if (wrapperEl) wrapperEl.setAttribute("data-spot-id", spotId);

    const normalizedCat = normalizeCategoryName(spot.idCategoria);
    if (normalizedCat) {
        cardEl.setAttribute("data-category", normalizedCat);
        if (wrapperEl) wrapperEl.setAttribute("data-category", normalizedCat);
    } else {
        cardEl.removeAttribute("data-category");
        if (wrapperEl) wrapperEl.removeAttribute("data-category");
    }

    cardEl.querySelectorAll("[data-field]").forEach(el => {
        const fieldName = el.dataset.field;
        if (fieldMap[fieldName] && fieldName !== 'category') {
            fieldMap[fieldName](el, spot);
        }
    });

    if (setCategoryText) {
        const categoryEl = cardEl.querySelector('[data-field="category"]');
        if (categoryEl) fieldMap.category(categoryEl, spot);
    }
}

export async function generateSpotCardList({
    containerId,
    templateSelector,
    getSpotsFunction,
    sortFunction = null,
    limit = 10,
    useWrapper = false,
    setCategoryText = true,
    additionalFields = [],
    bookmarkInit = initializeBookmarkButton,
    customCardSetup = null,
} = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let actualSelector = templateSelector;
    if (!actualSelector && container.dataset.template) {
        actualSelector = `template[data-template="${container.dataset.template}"]`;
    }

    const templateElement = document.querySelector(actualSelector) || container.querySelector(actualSelector);
    if (!templateElement) return;

    templateElement.hidden = true;
    templateElement.setAttribute("aria-hidden", "true");

    try {
        let spots = await getSpotsFunction();
        if (sortFunction) {
            spots = spots.slice().sort(sortFunction);
        }
        const list = spots.slice(0, limit);

        Array.from(container.children).forEach((child) => {
            if (child === templateElement) return;

            if (child.classList.contains('carousel-horizontal_track') ||
                child.classList.contains('carousel-vertical-track')) {
                Array.from(child.children).forEach(trackChild => {
                    if (!trackChild.dataset.template) trackChild.remove();
                });
                return;
            }

            if (child.getAttribute("role") === "listitem" && !child.dataset.template) {
                child.remove();
            }
        });

        if (!list.length) return;

        const appendTarget = container.querySelector('.carousel-horizontal_track') ||
            container.querySelector('.carousel-vertical-track') ||
            container;

        const fragment = document.createDocumentFragment();

        for (const spot of list) {
            const element = templateElement.content.cloneNode(true).firstElementChild;
            if (!element) continue;

            let card, wrapperEl;
            if (useWrapper) {
                wrapperEl = element;
                card = element.querySelector('article') || element;
            } else {
                card = element;
                wrapperEl = null;
                if (!card.hasAttribute("role")) card.setAttribute("role", "listitem");
            }

            populateSingleSpotCard(card, spot, { wrapperEl, setCategoryText });

            if (card.style.display === "none") continue;

            for (const field of additionalFields) {
                const el = card.querySelector(field.selector);
                if (!el) continue;
                if (field.type === 'image') {
                    el.src = field.valueFunction(spot) || "";
                    el.alt = spot.nome || "Foto spot";
                } else {
                    el.textContent = field.valueFunction(spot) ?? "";
                }
            }

            if (bookmarkInit) bookmarkInit(card);
            if (customCardSetup) customCardSetup(card, spot);

            fragment.appendChild(element);
        }

        appendTarget.appendChild(fragment);
    } catch (error) {
        console.error(`Error populating ${containerId}:`, error);
    }
}
