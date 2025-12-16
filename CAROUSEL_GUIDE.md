# 📋 Guida al Componente Carosello Riutilizzabile

## 📁 File del Componente

- **`/src/html/carousel-component.html`** - Template HTML del carosello
- **`/src/css/carousel.css`** - Stili del carosello
- **`/src/js/carousel.js`** - Logica JavaScript del carosello

## 🚀 Come Usare il Carosello

### 1. **Importa il modulo JavaScript**

```javascript
import { 
    initializeCarousel, 
    createSpotCardItem, 
    addCarouselItem, 
    clearCarousel 
} from "./carousel.js";
```

### 2. **Carica il carosello HTML**

```javascript
// Nel tuo file HTML, includi il carosello con un container univoco:
<div id="my-carousel">
    <!-- Carosello si carica qui -->
</div>

// Nel JavaScript:
const response = await fetch("./html/carousel-component.html");
const carouselHTML = await response.text();
document.getElementById("my-carousel").innerHTML = carouselHTML;

// Inizializza il carosello
initializeCarousel(".carousel-track");
```

### 3. **Aggiungi Card al Carosello**

#### Opzione A: Card Spot (come la Homepage)

```javascript
const track = document.querySelector(".carousel-track");

const spotData = {
    id: "spot-1",
    image: "./assets/images/spot.jpg",
    title: "Piazza della Città",
    distance: "150 m",
    category: "Cultura",
    rating: "4.8"
};

const cardItem = createSpotCardItem(spotData);
addCarouselItem(track, cardItem);
```

#### Opzione B: Card Generico

```javascript
const track = document.querySelector(".carousel-track");

const itemData = {
    id: "item-1",
    content: `
        <div class="bg-gray-200 rounded-lg p-4">
            <h3>Titolo Item</h3>
            <p>Contenuto custom</p>
        </div>
    `
};

const item = createCarouselItem(itemData, "horizontal");
addCarouselItem(track, item);
```

### 4. **Varianti di Dimensioni**

```javascript
// Spot quadrato (come homepage) - 70% width, max 220px
createCarouselItem(data, "spot")

// Rettangolare (16:9) - 80% width, max 300px
createCarouselItem(data, "horizontal")

// Piccolo quadrato - 60% width, max 160px
createCarouselItem(data, "small")
```

## 💻 Esempio Completo: Map Page

```html
<!-- map.html -->
<section class="map-section">
    <h2>Spot Vicino</h2>
    <div id="nearby-carousel"></div>
</section>
```

```javascript
// map.js
import { 
    initializeCarousel, 
    createSpotCardItem, 
    addCarouselItem 
} from "./carousel.js";

async function loadNearbyCarousel() {
    // 1. Carica il template carosello
    const response = await fetch("./html/carousel-component.html");
    const carouselHTML = await response.text();
    document.getElementById("nearby-carousel").innerHTML = carouselHTML;

    // 2. Ottieni i dati dal database (es. Firebase)
    const spots = await fetchNearbySpots();

    // 3. Popola il carosello
    const track = document.querySelector("#nearby-carousel .carousel-track");
    spots.forEach(spot => {
        const card = createSpotCardItem(spot);
        track.appendChild(card);
    });

    // 4. Inizializza la funzionalità drag/swipe
    initializeCarousel(".carousel-track");
}

document.addEventListener("DOMContentLoaded", loadNearbyCarousel);
```

## 🎨 Personalizzazione CSS

Modifica `/src/css/carousel.css` per cambiare:
- Larghezze e altezze dei card
- Distanze tra gli elementi
- Velocità di scroll
- Effetti al hover

```css
.carousel-item--spot {
    width: 70%;      /* Cambia larghezza */
    max-width: 220px; /* Cambia max-width */
    aspect-ratio: 1 / 1;
}
```

## 📱 Responsive Design

Il carosello è responsive:
- **Desktop**: Drag con mouse
- **Mobile**: Swipe con touch
- **Tablet**: Entrambi

## ✨ Funzionalità

✅ Drag/Swipe su desktop e mobile  
✅ Scroll snap (scatta sui card)  
✅ Smooth scrolling  
✅ Touch-friendly da iOS/Android  
✅ Accessibilità ARIA inclusa  
✅ Componente riutilizzabile  

## 🔧 API Disponibili

### `initializeCarousel(selector)`
Inizializza il drag/swipe per tutti i caroselli che matchano il selector

### `createSpotCardItem(spotData)`
Crea una card di spot completa (con immagine, title, rating, etc.)

### `createCarouselItem(itemData, variant)`
Crea una card generica con HTML personalizzato

### `addCarouselItem(trackElement, itemElement)`
Aggiunge un item al carosello

### `clearCarousel(trackElement)`
Svuota completamente il carosello

---

**Pronto a usare il carosello ovunque! 🎠**

