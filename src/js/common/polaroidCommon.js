import { getCurrentUser, getUserPolaroids, getSpotById } from "../database.js";
import { formatDate } from "./datetime.js";

const DEFAULT_POLAROID_IMG = "../assets/default-polaroid.jpg";
const TEMPLATE_PATH = "../html/common-pages/spot-templates.html";

let cachedPolaroidTemplate = null;

export async function fetchFormattedUserPolaroids(userData) {
    const user = userData || await getCurrentUser();
    if (!user) return [];

    const polaroids = await getUserPolaroids(user.id);
    if (!polaroids || polaroids.length === 0) return [];

    return Promise.all(polaroids.map(async (p) => {
        let dateStr = formatDate(p.date) || "";
        let spotName = "";

        if (p.idLuogo) {
            try {
                const spot = await getSpotById(p.idLuogo);
                if (spot?.nome) {
                    spotName = spot.nome;
                }
            } catch (e) {
                console.error("Error fetching spot info for polaroid:", e);
            }
        }

        return {
            id: p.id,
            title: p.title || "Senza Titolo",
            spotName: spotName || "Posizione sconosciuta",
            dateStr: dateStr,
            image: (p.immagini && p.immagini.length > 0) ? p.immagini[0] : "",
            date: p.date,
            idLuogo: p.idLuogo,
            idUtente: p.idUtente,
            diary: p.diary || ""
        };
    }));
}

export async function getPolaroidTemplate() {
    if (cachedPolaroidTemplate) return cachedPolaroidTemplate;

    try {
        const response = await fetch(TEMPLATE_PATH);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        cachedPolaroidTemplate = doc.querySelector('[data-template="polaroid-template"]');
        return cachedPolaroidTemplate;
    } catch (err) {
        console.error("Failed to fetch polaroid template:", err);
        return null;
    }
}

export function fillPolaroidContent(node, item) {
    const titleEl = node.querySelector('[data-slot="title"]');
    const spotNameEl = node.querySelector('[data-slot="spot-name"]');
    const dateEl = node.querySelector('[data-slot="date"]');
    const imageContainer = node.querySelector('.profile-polaroid-image');

    if (titleEl) titleEl.textContent = item.title;
    if (spotNameEl) spotNameEl.textContent = item.spotName;
    if (dateEl) dateEl.textContent = item.dateStr;

    if (imageContainer) {
        const bgImage = item.image ? `url('${item.image}')` : `url('${DEFAULT_POLAROID_IMG}')`;
        const imgUrl = item.image || DEFAULT_POLAROID_IMG;

        if (imageContainer.tagName === 'IMG') {
            imageContainer.src = imgUrl;
        } else {
            imageContainer.style.backgroundImage = bgImage;
        }
    }
}
