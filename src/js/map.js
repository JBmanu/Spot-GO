// map.js
// Import dinamici
let initializeCarousel, createSpotCardItem, addCarouselItem, getSpots,
    USER_PROTO_POSITION, distanceFromUserToSpot, createSearchBar, createNearbySpotCard,
    formatDistance, orderByDistanceFromUser;

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
    }),
    import("./common.js").then(module => {
        USER_PROTO_POSITION = module.USER_PROTO_POSITION;
        distanceFromUserToSpot = module.distanceFromUserToSpot;
        formatDistance = module.formatDistance;
        orderByDistanceFromUser = module.orderByDistanceFromUser;
    }),
    import("./createComponent.js").then(module => {
        createSearchBar = module.createSearchBar;
        createNearbySpotCard = module.createNearbySpotCard;
    }),
]).catch(err => console.error("Errore nel caricamento dei moduli in map.js:", err));

// Cache per i luoghi vicini
let spots;
// Mappa in "formato" Leaflet
let map;
// Layer corrente della mappa (stile selezionato)
let currentTileLayer;

const MAP_TILE_SERVERS = {
    OSM_STANDARD: {
        name: "OpenStreetMap Standard",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors"
    },
    CARTO_LIGHT: {
        name: "Carto Light",
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        subdomains: "abcd"
    },
    CYCLOSM: {
        name: "CyclOSM",
        url: "https://tile.cyclosm.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors & CyclOSM"
    },
    ESRI_LIGHT_GRAY: {
        name: "ESRI Light Gray",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri"
    }
};

async function initializeMap() {
    // const categoryContainer = document.getElementById("home-categories-container");

    // if (!categoryContainer) {
    //     return;
    // }

    // Carica le sezioni
    // loadSavedSpotsSection();
    loadSearchBar();
    await loadSpots();
    loadMap();
    loadMarkers();
    loadNearbySpotsList();
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

async function loadSearchBar() {
    const searchBar = await createSearchBar("Cerca Spot", (e) => {});
    document.querySelector('.home-section').prepend(searchBar);
}

async function loadSpots() {
    spots = await getSpots();
    spots = orderByDistanceFromUser(spots);
}

async function loadMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) {
        console.error("Elemento #map non trovato!");
        return;
    }

    // Inizializza la mappa
    map = L.map(mapEl).setView(USER_PROTO_POSITION, 14);

    // Aggiunta layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    // Aggiunta posizione corrente dell'utente (simulata)
    L.marker(USER_PROTO_POSITION, {
        icon: L.icon({
            iconUrl: '../assets/icons/map/Arrow.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    })
    .addTo(map)
    .bindPopup(`<b>La tua posizione</b>`);

    // setTileServer(MAP_TILE_SERVERS.ESRI_LIGHT_GRAY);
}

async function loadMarkers() {
    // Creazione dei marker Leaflet
    spots.forEach(luogo => {
        // Converto coord1 e coord2 in array [lat, lng]
        const markerPosition = [luogo.posizione.coord1, luogo.posizione.coord2];

        L.marker(markerPosition, {
            icon: L.icon({
                iconUrl: '../assets/icons/map/Marker.png',
                iconSize: [46, 46],
                iconAnchor: [23, 46]
            })
        })
        .addTo(map)
        .bindPopup(`<b>${luogo.nome}</b><br>${luogo.descrizione}`);
    });
}

async function loadNearbySpotsList() {
    const spotContainer = document.getElementById('map-nearby-spots-container');
    if (!spotContainer) return;

    spotContainer.innerHTML = "";

    for (const spot of spots) {
        try {
            // Calcolo distanza dall'utente
            const distanceMeters = distanceFromUserToSpot(spot);
            const formattedDistance = formatDistance(distanceMeters);

            // Creo la card già popolata
            const card = await createNearbySpotCard(spot, formattedDistance);

            if (card) {
                // Aggiungo la card al container
                spotContainer.appendChild(card);
            }
        } catch (err) {
            console.error("Errore nel creare la card per lo spot:", spot.nome, err);
        }
    }
}

function setTileServer(server) {
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }

    currentTileLayer = L.tileLayer(server.url, {
        attribution: server.attribution
    }).addTo(map);
}

window.reloadProfile = async function () {
    await initializeMap();
};

export { initializeMap }