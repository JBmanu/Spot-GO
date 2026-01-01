// map.js
// Import dinamici
let getSpots,
    USER_PROTO_POSITION, distanceFromUserToSpot, createNearbySpotCard,
    formatDistance, orderByDistanceFromUser, getFilteredSpots,
    createSearchBarWithKeyboardAndFilters, createBottomSheetWithStandardFilters,
    initializeSpotClickHandlers, initializeVerticalCarousel, createClassicSpotCard,
    openDetailHandler, openNewSpotPage;

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

Promise.all([
    import("./query.js").then(module => {
        getSpots = module.getSpots;
        getFilteredSpots = module.getFilteredSpots;
    }),
    import("./common.js").then(module => {
        USER_PROTO_POSITION = module.USER_PROTO_POSITION;
        distanceFromUserToSpot = module.distanceFromUserToSpot;
        formatDistance = module.formatDistance;
        orderByDistanceFromUser = module.orderByDistanceFromUser;
    }),
    import("./createComponent.js").then(module => {
        createSearchBarWithKeyboardAndFilters = module.createSearchBarWithKeyboardAndFilters;
        createBottomSheetWithStandardFilters = module.createBottomSheetWithStandardFilters;
        createNearbySpotCard = module.createNearbySpotCard;
    }),
    import("./pages/spotDetail.js").then(module => {
        initializeSpotClickHandlers = module.initializeSpotClickHandlers;
        openDetailHandler = module.openDetailHandler;
    }),
    import("./pages/newSpot.js").then(module => {
        openNewSpotPage = module.openNewSpotPage;
    }),
    import("./common/createCards.js").then(module => {
        createClassicSpotCard = module.createClassicSpotCard;
    }),
    import("./common/carousels.js").then(module => {
        initializeVerticalCarousel = module.initializeVerticalCarousel;
    }),
]).catch(err => console.error("Errore nel caricamento dei moduli in map.js:", err));

// Cache per i luoghi vicini
let spots;
// Categorie attive nei filtri
let activeCategories = new Set();
// Testo corrente di ricerca
let currentSearchText = "";
// Filtri avanzati per i luoghi
let advancedFilters = null;
// Mappa in "formato" Leaflet
let map;
// Layer corrente della mappa (stile selezionato)
let currentTileLayer;
// Lista dei marker attualmente attivi sulla mappa
let spotMarkers = [];

// Mappa categoria -> icona marker
const categoryToMarkerMap = {
    "culture": "MarkerCulture.svg",
    "food": "MarkerFood.svg",
    "nature": "MarkerNature.svg",
    "mystery": "MarkerMistery.svg"
};

// Stili della mappa
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
    initializeCategoryFilters();
    initializeNewSpotButton();

    await loadSearchBar();
    await loadMap();
    await loadSpotsDependentObjects();
}

async function loadSpotsDependentObjects() {
    await loadSpots();
    await loadMarkers();
    await loadNearbySpotsList();
    initializeSpotClickHandlers();
}

function initializeCategoryFilters() {
    activeCategories = new Set();
    const categoryContainer = document.getElementById("map-categories-container");

    if (!categoryContainer) {
        return;
    }

    // Gestisci i click sui filtri categoria
    categoryContainer.addEventListener("click", (e) => {
        const button = e.target.closest(".home-chip");
        if (!button) return;

        const category = button.dataset.category;
        const isActive = activeCategories.has(category);

        if (isActive) {
            activeCategories.delete(category);
            button.classList.remove("active");
            button.setAttribute("aria-pressed", "false");
        } else {
            activeCategories.add(category);
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");
        }

        loadSpotsDependentObjects();
    });
}

function initializeNewSpotButton() {
    const button = document.getElementById('new-spot-button');
    button.addEventListener('click', openNewSpotPage);
}

async function loadSearchBar() {
    currentSearchText = "";

    const { searchBarEl, keyboardEl, overlayEl, bottomSheetEl, bottomSheetOverlayEl } =
        await createSearchBarWithKeyboardAndFilters({
            placeholder: "Cerca Spot",
            onValueChanged: (inputText) => {
                currentSearchText = inputText;
                loadSpotsDependentObjects();
            },
            bottomSheetContentCreator: createBottomSheetWithStandardFilters,
            onFiltersApplied: (filtersToApply) => {
                advancedFilters = filtersToApply;
                loadSpotsDependentObjects();
            }});

    // Aggiunta dei componenti
    const mainSection = document.getElementById("map-main-section");
    if (!mainSection) return;
    
    mainSection.insertBefore(searchBarEl, mainSection.children[1]);
    mainSection.appendChild(overlayEl);
    mainSection.appendChild(keyboardEl);
    mainSection.appendChild(bottomSheetOverlayEl);
    mainSection.appendChild(bottomSheetEl);
}

async function loadSpots() {
    const categories = Array.from(activeCategories);
    const searchText = currentSearchText;

    spots = await getFilteredSpots(categories, searchText, advancedFilters);
    spots = orderByDistanceFromUser(spots);
}

async function loadMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) {
        console.error("Elemento #map non trovato!");
        return;
    }

    // Inizializza la mappa
    map = L.map(mapEl).setView(USER_PROTO_POSITION, 15);

    setTimeout(() => {
        map.invalidateSize();
    }, 0);

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
        }),
        zIndexOffset: 100
    })
    .addTo(map)
    .bindPopup(`<b>La tua posizione</b>`);

    // setTileServer(MAP_TILE_SERVERS.ESRI_LIGHT_GRAY);
}

async function loadMarkers() {
    // Rimozione di tutti i marker degli spot precedenti
    spotMarkers.forEach(marker => map.removeLayer(marker));
    spotMarkers = [];

    // Creazione dei marker Leaflet
    spots.forEach(luogo => {
        // Converto coord1 e coord2 in array [lat, lng]
        const markerPosition = [luogo.posizione.coord1, luogo.posizione.coord2];
        const iconName = categoryToMarkerMap[luogo.idCategoria] || "MarkerBase.svg";

        const popupHtml = `
            <div class="spot-popup" data-spot-id="${luogo.id}">
                <b>${luogo.nome}</b>
                <p>${luogo.descrizione}</p>
                <button type="button" class="filter-button-footer mt-2"
                        data-spot-id="${luogo.id}" style="margin: auto;" data-open-detail>
                    Visualizza dettagli
                </button>
            </div>
        `;
        
        const marker = L.marker(markerPosition, {
            icon: L.divIcon({
                html: `<img src="../assets/icons/map/${iconName}" class="marker-pop-up">`,
                className: 'custom-div-icon',
                iconSize: [64, 64],
                iconAnchor: [32, 64]
            })
        })
        .addTo(map)
        .bindPopup(popupHtml);

        // Pulsante per visualizzare i dettagli
        marker.on("popupopen", (e) => {
            L.DomEvent.disableClickPropagation(e.popup.getElement());
            const popupEl = e.popup.getElement();
            if (!popupEl) return;

            popupEl
                .querySelector("[data-open-detail]")
                ?.addEventListener("click", openDetailHandler);
        });

        spotMarkers.push(marker);
    });

    const interval = 500;

    // Comparsa dei marker uno ad uno
    spotMarkers.forEach((marker, index) => {
        const iconElem = marker.getElement().querySelector('img.marker-pop-up');
        if (iconElem) {
            setTimeout(() => {
                iconElem.classList.add('show');
            }, index * interval);
        }
    });
}

async function loadNearbySpotsList() {
    const carouselEl = document.getElementById("map-nearby-carousel");
    if (!carouselEl) return;

    const track = document.getElementById("map-nearby-spots-container");
    if (!track) return;

    track.innerHTML = "";
    carouselEl.querySelectorAll(':scope > [data-slot="spot"]').forEach(el => el.remove()); // sicurezza

    for (const spot of (spots || [])) {
        const distanceMeters = distanceFromUserToSpot(spot);
        const formattedDistance = formatDistance(distanceMeters);
        const card = await createClassicSpotCard(spot, formattedDistance);
        if (card) track.appendChild(card);
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