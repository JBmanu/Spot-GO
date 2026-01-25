// map.js
// Import dinamici
let getSpots,
    USER_PROTO_POSITION, distanceFromUserToSpot,
    formatDistance, orderByDistanceFromUser, getFilteredSpots,
    createSearchBarWithKeyboardAndFilters, createBottomSheetWithStandardFilters,
    initializeSpotClickHandlers, initializeVerticalCarousel,
    openSpotDetailById, openNewSpotPage, generateSpotCardList,
    syncBookmarksUI, updateBookmarkVisual, createBottomSheetWithOverlay,
    setupCategoryFilter, resetCategoryFilter, getActiveCategories;


import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setupCenterToUserPositionButton } from './common/mapExtension.js';

Promise.all([
    import("./database.js").then(module => {
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
        createBottomSheetWithOverlay = module.createBottomSheetWithOverlay;
    }),
    import("./pages/spotDetail.js").then((module) => {
        initializeSpotClickHandlers = module.initializeSpotClickHandlers;
        openSpotDetailById = module.openSpotDetailById;
    }),
    import("./pages/newSpot.js").then(module => {
        openNewSpotPage = module.openNewSpotPage;
    }),
    import("./pages/homepage/generate-spot-card-list.js").then(module => {
        generateSpotCardList = module.generateSpotCardList;
    }),
    import("./common/carousels.js").then(module => {
        initializeVerticalCarousel = module.initializeVerticalCarousel;
    }),
    import("./common/bookmark.js").then(module => {
        syncBookmarksUI = module.syncBookmarksUI;
        updateBookmarkVisual = module.updateBookmarkVisual;
    }),
    import("./common/categoryFilter.js").then(module => {
        setupCategoryFilter = module.setupCategoryFilter;
        resetCategoryFilter = module.resetCategoryFilter;
        getActiveCategories = module.getActiveCategories;
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
let searchBarLoaded = false;
let nearbySpotsBottomSheetLoaded = false;
let spotMarkersMap = new Map(); // spotId -> marker

let needsFadeInZoom = false;

export function fadeInZoom() {
    if (!map) {
        needsFadeInZoom = true;
        return;
    }
    map.setView(USER_PROTO_POSITION, 5);
    map.flyTo(USER_PROTO_POSITION, 15);
}

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
    if (map) {
        const mapSection = document.querySelector('[data-section-view="map"]');
        if (mapSection && syncBookmarksUI) {
            await syncBookmarksUI(mapSection).catch(() => { });
        }
        return;
    }

    initializeCategoryFilters();
    initializeNewSpotButton();

    loadSearchBar(); // await
    await loadMap();
    await loadNearbySpotsBottomSheet();
    await loadSpotsDependentObjects();

    attachBookmarkChangeListener();
}

export async function loadSpotsDependentObjects() {
    await loadSpots();
    await loadMarkers();
    await loadNearbySpotsList();
    const mapWrapper = document.querySelector('[data-section-view="map"]');
    initializeSpotClickHandlers(mapWrapper || document.getElementById("main"));
}

function initializeCategoryFilters() {
    const categoryContainer = document.getElementById("map-categories-container");
    if (!categoryContainer) return;

    resetCategoryFilter(categoryContainer);

    setupCategoryFilter(categoryContainer, {
        onChange: () => {
            loadSpotsDependentObjects();
        }
    });
}

function initializeNewSpotButton() {
    const button = document.getElementById('new-spot-button');
    if (!button || button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener('click', openNewSpotPage);
}

async function loadSearchBar() {
    if (searchBarLoaded) {
        currentSearchText = "";
        return;
    }
    searchBarLoaded = true;

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
            }
        });

    // Aggiunta dei componenti
    const mainSection = document.getElementById("map-main-section");
    if (!mainSection) return;

    mainSection.insertBefore(searchBarEl, mainSection.children[0]);
    // mainSection.appendChild(overlayEl);
    mainSection.appendChild(keyboardEl);
    mainSection.appendChild(bottomSheetOverlayEl);
    mainSection.appendChild(bottomSheetEl);
}

async function loadNearbySpotsBottomSheet() {
    if (nearbySpotsBottomSheetLoaded) return;
    nearbySpotsBottomSheetLoaded = true;

    const openNearbySpotsButton = document.getElementById('open-nearby-spots-btn');
    const { bottomSheetEl, bottomSheetOverlayEl } =
        await createBottomSheetWithOverlay(openNearbySpotsButton);

    const nearbySpotsCarousel = document.getElementById('map-nearby-carousel');
    bottomSheetEl.querySelector('.filter-content').appendChild(nearbySpotsCarousel);

    const mainSection = document.getElementById("map-main-section");
    if (!mainSection) return;

    mainSection.appendChild(bottomSheetOverlayEl);
    mainSection.appendChild(bottomSheetEl);
}

async function loadSpots() {
    const categoryContainer = document.getElementById("map-categories-container");
    const categories = categoryContainer ? getActiveCategories(categoryContainer) : [];
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

    // Inizializza la mappa se non esiste
    if (map) {
        setTimeout(() => map.invalidateSize(), 0);
        return;
    }

    map = L.map(mapEl).setView(USER_PROTO_POSITION, 15);

    setTimeout(() => {
        map.invalidateSize();
    }, 0);

    // Aggiunta layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 20,
    }).addTo(map);

    // Aggiunta posizione corrente dell'utente (simulata)
    L.marker(USER_PROTO_POSITION, {
        icon: L.icon({
            iconUrl: '../assets/icons/map/Navigation.svg',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        }),
        zIndexOffset: 100
    })
    .addTo(map)
    .bindPopup(`<b>La tua posizione</b>`);

    const centerButton = document.getElementById('map-recenter-btn');
    setupCenterToUserPositionButton(map, centerButton);

    if (needsFadeInZoom) {
        needsFadeInZoom = false;
        fadeInZoom();
    }

    // setTileServer(MAP_TILE_SERVERS.ESRI_LIGHT_GRAY);
}

async function loadMarkers() {
    // Set degli ID attuali
    const currentSpotIds = new Set(spots.map(s => s.id));

    //Rimozione dei marker non più presenti
    for (const [spotId, marker] of spotMarkersMap.entries()) {
        if (!currentSpotIds.has(spotId)) {
            map.removeLayer(marker);
            spotMarkersMap.delete(spotId);
        }
    }

    let newSpotMarkers = [];

    // Creazione dei marker Leaflet
    spots.forEach(luogo => {
        // Se esiste già, non facciamo nulla
        if (spotMarkersMap.has(luogo.id)) return;

        // Converto coord1 e coord2 in array [lat, lng]
        const markerPosition = [luogo.posizione.coord1, luogo.posizione.coord2];
        const iconName = categoryToMarkerMap[luogo.idCategoria] || "MarkerBase.svg";

        const popupHtml = `
            <div class="spot-popup" data-spot-id="${luogo.id}">
                <b class="spot-popup-title">${luogo.nome}</b>
                <p class="spot-popup-description">${luogo.descrizione}</p>
                <button type="button" class="submit-polaroid-btn glass-btn-primary"
                        data-spot-id="${luogo.id}" data-open-detail>
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
            const popupEl = e.popup.getElement();
            if (!popupEl) return;

            L.DomEvent.disableClickPropagation(popupEl);

            popupEl.querySelector("[data-open-detail]")?.addEventListener(
                "click",
                (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();

                    const id = ev.currentTarget.getAttribute("data-spot-id");
                    if (!id) return;

                    openSpotDetailById?.(id);
                },
                { once: true }
            );
        });

        spotMarkersMap.set(luogo.id, marker);
        newSpotMarkers.push(marker);
    });

    const interval = 250;

    // Comparsa dei marker uno ad uno
    newSpotMarkers.forEach((marker, index) => {
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

    await generateSpotCardList({
        containerId: "map-nearby-carousel",
        getSpotsFunction: () => spots || [],
        limit: 20,
        useWrapper: false,
        setCategoryText: true
    });

    if (syncBookmarksUI) {
        await syncBookmarksUI(carouselEl).catch(() => { });
    }

    if (initializeVerticalCarousel) {
        initializeVerticalCarousel(carouselEl);
    }

    const emptyMsg = document.getElementById("map-nearby-empty");
    if (emptyMsg) {
        emptyMsg.classList.toggle("hidden", spots && spots.length > 0);
    }
    else if (!spots || spots.length === 0) {
        const emptyMsgString = `
            <p id="map-nearby-empty" class="text-md text-text_color/70 px-1 py-2" style="text-align: center;">
                Nessuno spot trovato con questi filtri.
            </p>`;

        carouselEl.insertAdjacentHTML("afterbegin", emptyMsgString);
    }
}

function setTileServer(server) {
    currentTileLayer = L.tileLayer(server.url, {
        attribution: server.attribution
    }).addTo(map);
}

function attachBookmarkChangeListener() {
    document.addEventListener("bookmark:changed", (e) => {
        const { spotId, isSaved } = e.detail || {};
        if (!spotId) return;

        const mapSection = document.querySelector('[data-section-view="map"]');
        if (mapSection && updateBookmarkVisual) {
            mapSection.querySelectorAll(`[data-spot-id="${CSS.escape(spotId)}"] [data-bookmark-button]`).forEach((btn) => {
                btn.dataset.saved = isSaved ? "true" : "false";
                updateBookmarkVisual(btn, isSaved);
            });
        }
    });
}

window.reloadProfile = async function () {
    await initializeMap();
};

export { initializeMap }
