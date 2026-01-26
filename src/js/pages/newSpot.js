import { createTimeRange, loadComponentAsDocument } from "../createComponent";
import { USER_PROTO_POSITION } from "../common";
import { insertNewSpot, getCurrentUser } from "../database";
import { readTimeRangeValues, validateTimeRangesWithCrossIntersections } from "../common/timeRange";
import { goBack } from "../common/back";
import { loadSpotsDependentObjects } from "../map";
import { setupCenterToUserPositionButton } from "../common/mapExtension";

let newSpotSection;
let map;
let spotPositionMarker;
let selectedSpotPosition = null;
let otherPriceDisplayMode;
let foodPriceDisplayMode;
let imageController;

async function getNewSpotPageHtml() {
    const res = await fetch("../html/map-pages/new-spot.html");
    if (!res.ok) return null;

    const __newSpotPageHtml = await res.text();
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
        id="back-button"
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
    const oldSection = document.querySelector('[data-section-view="new-spot"]');
    if (oldSection) oldSection.remove();

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

    map = null;
    spotPositionMarker = null;
    selectedSpotPosition = null;
    otherPriceDisplayMode = null;
    foodPriceDisplayMode = null;
    imageController = null;

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
    imageController = initializeImageInput();
    initializeAddSpotButton();
    setupNewSpotFormValidation();

    selectedSpotPosition = null;

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

      const firstTimePositionSet = selectedSpotPosition == null;

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

      // newSpotSection.querySelector('#spot-position').textContent = `${lat.toFixed(4)} : ${lng.toFixed(4)}`;

      if (firstTimePositionSet) {
        const badge = document.getElementById('position-badge');
        const icon = badge.querySelector('img');

        badge.childNodes[badge.childNodes.length - 1].textContent = "Posizione impostata";

        badge.classList.remove('warning');
        badge.classList.add('success');

        icon.src = "../assets/icons/map/Done.svg";
      }
      validateUserData();
    });

    const centerButton = document.getElementById('new-spot-map-recenter-btn');
    setupCenterToUserPositionButton(map, centerButton);

    L.DomEvent.disableClickPropagation(centerButton);
    L.DomEvent.disableScrollPropagation(centerButton);
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

    setupPriceLogic();
    switchToTab("free");
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

    const interoInput = document.getElementById('new-spot-price-intero');
    const ridottoInput = document.getElementById('new-spot-price-ridotto');

    if (tab === 'free') {
        switchButtons[0].style.pointerEvents = 'none';
        switchButtons[1].style.pointerEvents = 'auto';
        if (interoInput) {
            interoInput.style.pointerEvents = 'none';
            interoInput.disabled = true; 
            interoInput.parentElement.style.opacity = '0.5';
        }
        if (ridottoInput) {
            ridottoInput.style.pointerEvents = 'none';
            ridottoInput.disabled = true;
            ridottoInput.parentElement.style.opacity = '0.5';
        }
    } else {
        switchButtons[0].style.pointerEvents = 'auto';
        switchButtons[1].style.pointerEvents = 'none';
        if (interoInput) {
            interoInput.style.pointerEvents = 'auto';
            interoInput.disabled = false;
            interoInput.parentElement.style.opacity = '1';
        }
        if (ridottoInput) {
            ridottoInput.style.pointerEvents = 'auto';
            ridottoInput.disabled = false;
            ridottoInput.parentElement.style.opacity = '1';
        }
    }
}

function initializeImageInput() {
    const wrapperEl = document.getElementById('new-spot-image-wrapper');
    const imageInput = wrapperEl.querySelector("#new-spot-image-input");
    const imagePreview = wrapperEl.querySelector("#new-spot-image-preview");

    let selectedImage = null;

    if (!imageInput || !imagePreview) {
        console.warn("Image input o preview non trovati");
        return;
    }

    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) return;

        selectedImage = file;

        // Aggiorna l'anteprima con il file selezionato
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.style.backgroundImage = `url(${event.target.result})`;
            imagePreview.classList.add("active");
        };
        reader.readAsDataURL(file);
    });

    return {
        getImage: () => selectedImage,
        // restituisce direttamente il path relativo per Firestore
        getImagePath: () => selectedImage ? `/db/img/${selectedImage.name}` : null,
        resetImage: () => {
            selectedImage = null;
            imageInput.value = "";
            imagePreview.classList.remove("active");
            imagePreview.style.backgroundImage = "";
        }
    };
}

async function imageToUrlPath(image) {
    const reader = new FileReader();
    const imageDataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(image);
    });
    return imageDataUrl;
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

function setupNewSpotFormValidation() {
    const form = document.getElementById("new-spot-form");
    const submitBtn = document.getElementById("add-spot-button");

    if (!form || !submitBtn) return;

    const update = () => {
        submitBtn.disabled = !validateUserData();
        submitBtn.classList.toggle("opacity-50", submitBtn.disabled);
        submitBtn.classList.toggle("cursor-not-allowed", submitBtn.disabled);
    };

    // input + change coprono quasi tutto
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    update(); // stato iniziale
}

const parsePrice = (v) => {
    if (!v) return null;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
};

function syncPriceFieldsState(form) {
    const freeTabActive = form
        .querySelector('[data-auth-tab="free"]')
        ?.classList.contains("is-active");

    const interoInput = form.querySelector("#new-spot-price-intero");
    const ridottoInput = form.querySelector("#new-spot-price-ridotto");

    if (!interoInput || !ridottoInput) return;

    // ===== GRATUITO ATTIVO =====
    if (freeTabActive) {
        interoInput.value = "";
        ridottoInput.value = "";

        interoInput.disabled = true;
        ridottoInput.disabled = true;
        return;
    }

    // ===== NON GRATUITO =====
    interoInput.disabled = false;

    const interoValue = parsePrice(interoInput.value);

    if (interoValue > 0) {
        ridottoInput.disabled = false;
    } else {
        ridottoInput.value = "";
        ridottoInput.disabled = true;
    }
}

function setupPriceLogic() {
    const form = document.getElementById("new-spot-form");
    if (!form) return;

    const interoInput = form.querySelector("#new-spot-price-intero");
    const ridottoInput = form.querySelector("#new-spot-price-ridotto");
    const priceTabs = form.querySelectorAll("[data-auth-tab]");

    interoInput?.addEventListener("input", () => {
        syncPriceFieldsState(form);
    });

    ridottoInput?.addEventListener("input", () => {
        // nulla di speciale, validato altrove
    });

    priceTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // lo switch del tab avviene già altrove
            // qui reagiamo solo al nuovo stato
            setTimeout(() => syncPriceFieldsState(form), 0);
        });
    });

    // stato iniziale
    syncPriceFieldsState(form);
}

function validateUserData() {
    if (validateNewSpotForm()) return true;

    const msg = document.getElementById('new-spot-help-text');
    msg.innerText = getValidationErrorMessage();

    return false;
}

function validateNewSpotForm() {
    const form = document.getElementById("new-spot-form");
    if (!form) return false;

    // ===== CAMPI BASE =====
    const nome = form.querySelector("#new-spot-name")?.value.trim();
    const descrizione = form.querySelector("#new-spot-desc")?.value.trim();
    const categoria = form.querySelector("#new-spot-category")?.value;
    const indirizzo = form.querySelector("#new-spot-address")?.value.trim();

    const posizioneValida =
        Array.isArray(selectedSpotPosition) &&
        selectedSpotPosition.length === 2;

    if (!nome || !descrizione || !categoria || !posizioneValida || !indirizzo) {
        return false;
    }

    // ===== IMMAGINE =====
    const imageInput = form.querySelector("#new-spot-image-input");
    const imageValida =
        imageInput &&
        imageInput.files &&
        imageInput.files.length > 0;

    if (!imageValida) {
        return false;
    }

    // ===== PREZZO =====
    if (categoria !== "food") {
        const freeTabActive = form
            .querySelector('[data-auth-tab="free"]')
            ?.classList.contains("is-active");

        if (!freeTabActive) {
            const prezzoIntero = parsePrice(
                form.querySelector("#new-spot-price-intero")?.value.trim()
            );

            const prezzoRidotto = parsePrice(
                form.querySelector("#new-spot-price-ridotto")?.value.trim()
            );

            // almeno uno dei due deve esserci
            if (prezzoIntero <= 0 && prezzoRidotto <= 0) {
                return false;
            }

            // ridotto ammesso solo se intero > 0
            if (prezzoRidotto > 0 && prezzoIntero <= 0) {
                return false;
            }
        }
    }

    // ===== ORARI =====
    const timeRangeElList = form.querySelectorAll(".time-range");
    if (!validateTimeRangesWithCrossIntersections(timeRangeElList)) {
        return false;
    }
    return true;
}

function getValidationErrorMessage() {
    const form = document.getElementById("new-spot-form");
    if (!form) return "";

    // POSIZIONE
    const posizioneValida = Array.isArray(selectedSpotPosition) && selectedSpotPosition.length === 2;
    if (!posizioneValida) return "Seleziona una posizione sulla mappa";

    // INDIRIZZO
    const indirizzo = form.querySelector("#new-spot-address")?.value.trim();
    if (!indirizzo) return "Inserisci un indirizzo";

    // NOME
    const nome = form.querySelector("#new-spot-name")?.value.trim();
    if (!nome) return "Inserisci il nome dello spot";

    // DESCRIZIONE
    const descrizione = form.querySelector("#new-spot-desc")?.value.trim();
    if (!descrizione) return "Inserisci una breve descrizione dello spot";

    // CATEGORIA
    const categoria = form.querySelector("#new-spot-category")?.value;
    if (!categoria) return "Seleziona una categoria";

    // COSTI
    if (categoria === "food") {
        const spesaMedia = form.querySelector("#new-spot-price-food")?.value.trim();
        if (!spesaMedia || parsePrice(spesaMedia) <= 0) return "Inserisci la spesa media";
    } else {
        const freeTabActive = form.querySelector('[data-auth-tab="free"]')?.classList.contains("is-active");
        if (!freeTabActive) {
            const prezzoIntero = parsePrice(form.querySelector("#new-spot-price-intero")?.value.trim());
            if (prezzoIntero <= 0) return "Inserisci il prezzo intero";
        }
    }

    // IMMAGINE
    const imageInput = form.querySelector("#new-spot-image-input");
    const imageValida =
        imageInput &&
        imageInput.files &&
        imageInput.files.length > 0;
    if (!imageValida) return "Carica una foto dello spot";

    return "";
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

    const indirizzo = form.querySelector("#new-spot-address")?.value.trim() || "";

    const timeRangeElList = form.querySelectorAll(".time-range");
    const orari = readTimeRangeValues(timeRangeElList);

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

    const immagine = imageController.getImagePath();

    const valutazione = 4.5;

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
        immagine,
        idCreatore
    };
}

function initializeTimeRange() {
    instantiateTimeRange();

    const newTimeRangeBtn = document.getElementById('new-time-range-btn');
    newTimeRangeBtn.removeEventListener('click', instantiateTimeRange);
    newTimeRangeBtn.addEventListener('click', instantiateTimeRange);
}

async function instantiateTimeRange() {
    const timeRangeEl = await createTimeRange();
    document.getElementById('new-time-range-btn').before(timeRangeEl);
}

async function addNewSpotAndClose(e) {
    e.preventDefault();
    try {
        const spot = await readNewSpotDataFromFields();
        const spotId = await insertNewSpot(spot);
        goBack({});
        loadSpotsDependentObjects();
    } catch (err) {
        console.error("Errore inserimento Luogo:", err);
        throw err;
    }
    console.log("Inserito nuovo spot");
}
