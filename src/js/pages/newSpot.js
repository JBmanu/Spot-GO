import { loadComponentAsDocument } from "../createComponent";
import { USER_PROTO_POSITION } from "../common";

let __newSpotPageHtml = null;
let map;

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
    let newSpotSection = document.querySelector('[data-section-view="new-spot"]');
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
            iconUrl: '../../assets/icons/map/Arrow.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    })
    .addTo(map);

    // setTileServer(MAP_TILE_SERVERS.ESRI_LIGHT_GRAY);
}
