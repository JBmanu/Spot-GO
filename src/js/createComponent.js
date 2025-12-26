import { getCategoryNameIt } from "./query.js";

async function loadComponentAsDocument(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) return;

        const html = await response.text();
        const parser = new DOMParser();
        const tempDoc = parser.parseFromString(html, "text/html");
        return tempDoc;
    } catch (err) {
        console.log(`Errore nel caricamento del componente [${path}]`);
    }
}

/**
 * Crea una search bar configurabile.
 *
 * @param {string} placeholder - Testo mostrato nel campo di ricerca.
 * @param {(value: string, event: Event) => void} onValueChanged - Funzione eseguita quando la ricerca cambia.
 * @returns {Promise<HTMLElement>} Elemento DOM pronto per essere aggiunto alla pagina.
 */
export async function createSearchBar(placeholder, onValueChanged) {
    const doc = await loadComponentAsDocument("../html/common-components/search-bar.html");
    const root = doc.body.firstElementChild;

    const input = root.querySelector("#view-all-saved-search");

    // Placeholder
    input.placeholder = placeholder;

    // OnValueChanged
    input.addEventListener("input", e => {
        onValueChanged(e.target.value);
    });

    return root;
}

// TODO
export async function createKeyboardOverlay() {
    // return root;
}

/**
 * Crea una card "spot vicino".
 *
 * @param {Object} spot - Oggetto spot dal DB.
 * @param {string} distance - Distanza formattata (es. "350 m").
 * @returns {Promise<HTMLElement>} Elemento DOM pronto per essere aggiunto alla pagina.
 */
export async function createNearbySpotCard(spot, distance) {
    const doc = await loadComponentAsDocument("../html/common-components/nearby-spot-card.html");

    if (!doc) return null;

    const card = doc.body.firstElementChild;

    // Nome
    const title = card.querySelector('[data-field="title"]');
    if (title) title.textContent = spot.nome;

    // Immagine
    const image = card.querySelector('[data-field="image"]');
    if (image) {
        image.src = spot.immagine;
        image.alt = `Foto di ${spot.nome}`;
    }

    // Distanza
    const distanceEl = card.querySelector('[data-field="distance"]');
    if (distanceEl) distanceEl.textContent = distance;

    // Categoria
    const categoryEl = card.querySelector('[data-field="category"]');
    if (categoryEl) {
        categoryEl.textContent = await getCategoryNameIt(spot.idCategoria);
    }

    // Dataset
    card.dataset.spotId = spot.id ?? "";
    card.dataset.category = spot.idCategoria;
    card.dataset.saved = "true";

    // Eventi (?)
    card.addEventListener("click", () => {
        console.log("Apri dettaglio spot:", spot.nome);
    });

    return card;
}
