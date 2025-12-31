import { getCategoryNameIt } from "../query.js";

export async function createClassicSpotCard(spot, distance) {
    const template = document.getElementById("classic-spot-card-template");
    if (!template) return null;

    const card = template.content.firstElementChild.cloneNode(true);

    const image = card.querySelector('[data-field="image"]');
    if (image) {
        image.src = "../" + spot.immagine.slice(1);
        image.alt = `Foto di ${spot.nome}`;
    }

    const title = card.querySelector('[data-field="title"]');
    if (title) title.textContent = spot.nome;

    const distanceEl = card.querySelector('[data-field="distance"]');
    if (distanceEl) distanceEl.textContent = distance;

    const categoryEl = card.querySelector('[data-field="category"]');
    if (categoryEl) {
        categoryEl.textContent = await getCategoryNameIt(spot.idCategoria);
    }

    const ratingEl = card.querySelector('[data-field="rating"]');
    if (ratingEl && spot.valutazione) {
        ratingEl.textContent = spot.valutazione;
    }

    card.dataset.spotId = spot.id ?? "";
    card.dataset.category = spot.idCategoria;
    card.dataset.saved = "true";

    return card;
}
