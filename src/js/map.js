// map.js
// Import dinamici
let initializeCarousel, createSpotCardItem, addCarouselItem, getSpots;

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

Promise.all([
    import("./carousel.js").then(module => {
        initializeCarousel = module.initializeCarousel;
        createSpotCardItem = module.createSpotCardItem;
        addCarouselItem = module.addCarouselItem;
    }),
    import("./query.js").then(module => {
        getSpots = module.getSpots;
    })
]).catch(err => console.error("Errore nel caricamento dei moduli in map.js:", err));

// Cache per i luoghi vicini
let spots;
// Mappa in "formato" Leaflet
let map;

async function initializeMap() {
    // const categoryContainer = document.getElementById("home-categories-container");

    // if (!categoryContainer) {
    //     return;
    // }

    // Carica le sezioni
    // loadSavedSpotsSection();
    await loadSpots();
    loadMap();
    loadMarkers();
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

async function loadSpots() {
    spots = await getSpots();
}

async function loadMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) {
        console.error("Elemento #map non trovato!");
        return;
    }

    // Inizializza la mappa centrata su Roma (lat, lon) con zoom 13
    map = L.map(mapEl).setView([41.8902, 12.4922], 13);

    // Aggiunge layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    // Marker esempio
    const marker = L.marker([41.8902, 12.4922]).addTo(map);
    marker.bindPopup("<b>Colosseo</b><br>Roma").openPopup();
}

async function loadMarkers() {
    // Creazione dei marker Leaflet
    spots.forEach(luogo => {
        // Converto coord1 e coord2 in array [lat, lng]
        const markerPosition = [luogo.posizione.coord1, luogo.posizione.coord2];

        L.marker(markerPosition)
        .addTo(map)
        .bindPopup(`<b>${luogo.nome}</b><br>${luogo.descrizione}`);
    });
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