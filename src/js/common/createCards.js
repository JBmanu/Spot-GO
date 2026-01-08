import { getCategoryNameIt } from "../json-data-handler.js";
import { setText, setImage, pickRating, formatRatingAsText } from "./spotCardHelpers.js";

/**
 * Crea una card classica per uno spot utilizzando un template HTML.
 */
export async function createClassicSpotCard(spot, distance) {
    const template = document.getElementById("classic-spot-card-template");
    if (!template) return null;

    const card = template.content.firstElementChild.cloneNode(true);

    setImage(card.querySelector('[data-field="image"]'), "../" + spot.immagine.slice(1), `Foto di ${spot.nome}`);

    setText(card.querySelector('[data-field="title"]'), spot.nome);

    setText(card.querySelector('[data-field="distance"]'), distance);

    const categoryEl = card.querySelector('[data-field="category"]');
    if (categoryEl) {
        categoryEl.textContent = await getCategoryNameIt(spot.idCategoria);
    }

    setText(card.querySelector('[data-field="rating"]'), formatRatingAsText(pickRating(spot)));

    card.dataset.spotId = spot.id ?? "";
    card.dataset.category = spot.idCategoria;
    card.dataset.saved = "true";

    return card;
}
