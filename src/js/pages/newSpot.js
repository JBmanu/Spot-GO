import { loadComponentAsDocument } from "../createComponent";
import { USER_PROTO_POSITION } from "../common";
import { createStarRating } from "../createComponent";
import { insertNewSpot, getCurrentUser } from "../database";
import { initializeTimeRangeControl } from "../common/timeRange";

let __newSpotPageHtml = null;
let newSpotSection;
let map;
let spotPositionMarker;
let selectedSpotPosition = [0,0];
let otherPriceDisplayMode;
let foodPriceDisplayMode;

async function getNewSpotPageHtml() {
    if (__newSpotPageHtml) return __newSpotPageHtml;

    const res = await fetch("../html/map-pages/new-spot.html");
    if (!res.ok) return null;

    __newSpotPageHtml = await res.text();
    return __newSpotPageHtml;
}

function renderHeaderForNewSpotPage() {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `
      <button
        type="button"
        id="header-back-button"
        data-back
        aria-label="Torna indietro"
        class="flex items-center justify-center w-10 h-10"
      >
        <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
      </button>
    `;
    }

    if (headerLogoText) headerLogoText.style.display = "none";
    if (headerTitle) {
        headerTitle.textContent = "Nuovo Spot";
        headerTitle.classList.remove("hidden");
    }
}

function hideSection(viewName) {
    const el = document.querySelector(`[data-section-view="${viewName}"]`);
    if (el) el.style.display = "none";
}

function showSection(viewName) {
    const el = document.querySelector(`[data-section-view="${viewName}"]`);
    if (el) el.style.display = "";
}

async function ensureNewSpotPageInDom() {
    newSpotSection = document.querySelector('[data-section-view="new-spot"]');
    if (newSpotSection) return newSpotSection;

    const html = await getNewSpotPageHtml();
    if (!html) return null;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();

    newSpotSection = wrapper.querySelector('[data-section-view="new-spot"]');
    if (!newSpotSection) return null;

    const main = document.getElementById('main');
    main.appendChild(wrapper);
    return newSpotSection;
}

export async function openNewSpotPage() {
    const newSpotSection = await ensureNewSpotPageInDom();
    if (!newSpotSection) return;

    // Nasconde mappa
    hideSection("map");

    // Mostra new-spot
    showSection("new-spot");

    // Header custom
    renderHeaderForNewSpotPage();
    
    loadMap();
    initializePriceTab();
    initializeCategorySelector();
    initializeTimeRange();
    initializeAddSpotButton();

    // Bottone indietro
    const backBtn = document.querySelector("[data-back]");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            // closeNewSpotPage();
        });
    }
}

function closeNewSpotPage() {
    // Nasconde new-spot
    hideSection("new-spot");

    // Mostra mappa
    showSection("map");

    // Placeholder: riapertura standard mappa
    console.log("Ritorno alla mappa (placeholder)");
}

function initializeAddSpotButton() {
    const form = document.getElementById('new-spot-form');
    form.addEventListener('submit', addNewSpotAndClose);
}

async function loadMap() {
    const mapEl = document.getElementById('new-spot-map');
    if (!mapEl) {
        console.error("Elemento #new-spot-map non trovato!");
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
            iconUrl: '../../assets/icons/map/Navigation.svg',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        }),
        interactive: false
    })
    .addTo(map);

    // setTileServer(MAP_TILE_SERVERS.ESRI_LIGHT_GRAY);

    map.on('mousedown', function (e) {
      if (spotPositionMarker) {
        map.removeLayer(spotPositionMarker)
      }

      const { lat, lng } = e.latlng;
      selectedSpotPosition = [lat, lng];

      const icon = L.divIcon({
          html: '<img src="../../assets/icons/map/MarkerBase.svg" class="marker-pop-up show">',
          className: 'custom-div-icon',
          iconSize: [64, 64],
          iconAnchor: [32, 64],
      });

      spotPositionMarker = L.marker(selectedSpotPosition, { icon, interactive: false })
        .addTo(map);

      newSpotSection.querySelector('#spot-position').textContent = `${lat.toFixed(4)} : ${lng.toFixed(4)}`;
    });

}

function initializeCategorySelector() {
    const categorySelector = document.getElementById('new-spot-category');

    categorySelector.addEventListener("change", (e) => {
        updateCategoryUI(e.target.value);
    });

    updateCategoryUI(categorySelector.value);
}

function updateCategoryUI(value) {
    const foodFields = document.getElementById('price-section-food');
    const otherFields = document.getElementById('price-section-other');

    if (value === "food") {
        foodFields.style.display = foodPriceDisplayMode;
        otherFields.style.display = "none";
    } else {
        foodFields.style.display = "none";
        otherFields.style.display = otherPriceDisplayMode;
    }
}

function initializePriceTab() {
    const switchButtons = document.querySelectorAll('.new-spot-switch-btn');

    switchButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.authTab;
            switchToTab(tab);
        });
    });

    foodPriceDisplayMode = document.getElementById('price-section-food').style.display;
    otherPriceDisplayMode = document.getElementById('price-section-other').style.display;

    document.getElementById('new-spot-price-food').addEventListener('input', validatePriceInputField);
    document.getElementById('new-spot-price-intero').addEventListener('input', validatePriceInputField);
    document.getElementById('new-spot-price-ridotto').addEventListener('input', validatePriceInputField);
}

function switchToTab(tab) {
    const switchButtons = document.querySelectorAll('.new-spot-switch-btn');
    const slider = document.querySelector('.new-spot-slider');

    switchButtons.forEach(btn => {
        const isActive = btn.dataset.authTab === tab;
        btn.classList.toggle('is-active', isActive);
        btn.classList.toggle('text-black', isActive);
        btn.style.fontWeight = isActive ? 'bold' : 'normal';
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (slider) slider.style.left = tab === 'free' ? '1%' : '51%';
}

function validatePriceInputField(e) {
    let value = e.target.value;

    // Rimuove tutto tranne numeri, punto e virgola
    value = value.replace(/[^0-9.,]/g, "");

    // Se ci sono più separatori, tiene solo il primo
    const firstSeparatorIndex = value.search(/[.,]/);
    if (firstSeparatorIndex !== -1) {
        const before = value.slice(0, firstSeparatorIndex + 1);
        const after = value
            .slice(firstSeparatorIndex + 1)
            .replace(/[.,]/g, "");

        // Limita a massimo 2 cifre decimali
        value = before + after.slice(0, 2);
    }

    // Converte eventuale virgola in punto (standard DB)
    value = value.replace(",", ".");

    e.target.value = value;
}

async function readNewSpotDataFromFields() {
    const form = document.getElementById("new-spot-form");
    if (!form) {
        throw new Error("Form new-spot-form non trovata");
    }

    const currentUser = await getCurrentUser();
    const idCreatore = currentUser.email;

    const nome = form.elements["name"]?.value.trim();
    const descrizione = form.elements["description"]?.value.trim();
    const idCategoria = form.elements["category"]?.value;

    // posizione
    const posizione = selectedSpotPosition
        ? { coord1: selectedSpotPosition[0], coord2: selectedSpotPosition[1] }
        : null;

    const indirizzo = "";

    const openTime = form.elements["open_time"]?.value;
    const closeTime = form.elements["close_time"]?.value;

    const orari =
        openTime && closeTime
            ? [{ inizio: openTime, fine: closeTime }]
            : [];

    const costo = [];

    // stato tab prezzo
    const freeTabActive = document
        .querySelector('[data-auth-tab="free"]')
        ?.classList.contains("is-active");

    if (freeTabActive) {
        costo.push({ tipo: "Gratuito", prezzo: 0 });
    } else {
        const prezzoInteroRaw = form.elements["price_intero"]?.value;
        const prezzoRidottoRaw = form.elements["price_ridotto"]?.value;
        const prezzoFoodRaw = form.elements["price_food"]?.value;

        const parsePrice = (v) =>
            v ? Number(v.replace(",", ".")) : null;

        const prezzoFood = parsePrice(prezzoFoodRaw);
        const prezzoIntero = parsePrice(prezzoInteroRaw);
        const prezzoRidotto = parsePrice(prezzoRidottoRaw);

        if (idCategoria === "food" && prezzoFood !== null) {
            costo.push({ tipo: "Spesa media", prezzo: prezzoFood });
        }

        if (prezzoIntero !== null) {
            costo.push({ tipo: "Intero", prezzo: prezzoIntero });
        }

        if (prezzoRidotto !== null) {
            costo.push({ tipo: "Ridotto", prezzo: prezzoRidotto });
        }
    }

    const immagine = "/db/img/placeholder.jpg";

    const ratingStars = form.querySelectorAll(".rating-container .star.active");
    const valutazione = ratingStars.length || null;

    const recensione = form.elements["review"]?.value.trim() || null;

    if (!nome || !descrizione || !idCategoria || !posizione) {
        throw new Error("Compila tutti i campi obbligatori");
    }

    return {
        nome,
        descrizione,
        idCategoria,
        posizione,
        indirizzo,
        orari,
        costo,
        valutazione,
        recensione,
        immagine,
        idCreatore
    };
}

function initializeTimeRange() {
    const timeRangeEl = document.getElementById('new-spot-time-range');
    initializeTimeRangeControl(timeRangeEl);
}

async function addNewSpotAndClose() {
    const spot = await readNewSpotDataFromFields();
    const spotId = await insertNewSpot(spot);
    console.log("Inserito nuovo spot");
}
