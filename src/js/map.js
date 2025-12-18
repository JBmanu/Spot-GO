// map.js
import { initializeCarousel, createSpotCardItem, addCarouselItem } from "./carousel.js";
import { getSpots } from "./query.js";

async function initializeMap() {
    // const categoryContainer = document.getElementById("home-categories-container");

    // if (!categoryContainer) {
    //     return;
    // }

    // Carica le sezioni
    // loadSavedSpotsSection();
    loadNearbySpotsSection();
    // loadVerticalCarouselSection();

    // Gestisci i click sui filtri categoria
    // categoryContainer.addEventListener("click", (e) => {
    //     const button = e.target.closest(".home-chip");
    //     if (!button) return;

    //     const category = button.dataset.category;

    //     // Toggle categoria attiva
    //     if (activeCategories.has(category)) {
    //         deactivateCategory(categoryContainer, category);
    //     } else {
    //         activateCategory(categoryContainer, category);
    //     }

    //     // Filtra gli spot in base alle categorie selezionate
    //     loadContentByCategories(Array.from(activeCategories));
    // });
}

async function loadNearbySpotsSection() {
    try {
        const response = await fetch("../html/common-components/vertical-carousel.html");
        if (!response.ok) return;

        const html = await response.text();
        const container = document.getElementById("map-nearby-section");

        if (container) {
            container.innerHTML = html;
            initializeCarousel(".nearby-swipe-track");
        }

        const spots = await getSpots();

        console.log(spots);

        const track = document.querySelector(".vertical-carousel-track");
        spots.forEach(spot => {
            const card = createSpotCardItem(spot);
            track.appendChild(card);
        });
    } catch (err) {
        // Errore nel caricamento
    }
}

window.reloadProfile = async function () {
    await initializeMap();
};

export { initializeMap }