# Guida ai Caroselli (Quick Start)

Il sistema dei caroselli è automatico. Basta usare gli attributi `data-*` corretti e il CSS/JS si occuperà di tutto il resto (scorrimento, drag e layout).

---

## Ricette Veloci (Copia e Incolla)

### 1. Carosello Orizzontale (Preferiti, Nearby)

```html
<section data-carousel-type="horizontal">
  <!-- Lo script creerà automaticamente il track interno se non c'è -->
  <article class="card">Item 1</article>
  <article class="card">Item 2</article>
  <article class="card">Item 3</article>
</section>
```

### 2. Carosello Verticale (Top Rated, Liste)

```html
<section data-carousel-type="vertical" data-size="md">
  <article class="card">Item 1</article>
  <article class="card">Item 2</article>
</section>
```

---

## Configurazione (Data Attributes)

Aggiungi questi attributi al **contenitore padre**:

| Attributo | Valore | Descrizione |
| :--- | :--- | :--- |
| `data-carousel-type` | `horizontal` o `vertical` | **Obbligatorio**. Tipo di scorrimento. |
| `data-size` | `sm`, `md`, `lg`, `xl` | **Solo Verticale**. Altezza max (sm ≈ 50px, md ≈ 280px, lg ≈ 350px). |
| `data-drag` | `0` o `1` | Abilita il trascinamento col mouse (default: `1`). |
| `data-card-selector` | `.selettore` | Se vuoi che solo certi elementi diventino "card". |

---

## Utilizzo in Javascript

Se aggiungi card dinamicamente (dopo un fetch), devi dire al carosello di ricalcolare gli spazi.

### Import
```javascript
import { autoInitializeCarousels } from "../../common/carousels.js";
```

### Inizializzazione manuale
Se hai appena popolato un contenitore:
```javascript
const root = document.getElementById("mio-container");
// ... inserisci HTML ...
autoInitializeCarousels(root);
```

---

## Suggerimenti Extra

1.  **Immagini**: Tutte le immagini dentro i caroselli vengono automaticamente impostate come `draggable="false"` per non rompere lo scorrimento.
2.  **Track Manuale**: Se vuoi più controllo, puoi creare tu il div del track:
    ```html
    <div data-carousel-type="horizontal">
      <div class="carousel-horizontal_track">
         <!-- Card qui -->
      </div>
    </div>
    ```
3.  **Snap**: Il carosello orizzontale ha lo `scroll-snap` attivo per impostazione predefinita nel CSS per un'esperienza più fluida.
