/**
 * Inizializza il comportamento di drag/scroll per i carousel selezionati.
 */
export function initializeCarousel(trackSelector = ".carousel-track") {
    const carousels = document.querySelectorAll(trackSelector);

    carousels.forEach((carousel) => {
        if (carousel.dataset.carouselInitialized === "true") {
            return;
        }

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleMouseDown = (e) => {
            isDown = true;
            carousel.classList.add("is-dragging");
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDown = false;
            carousel.classList.remove("is-dragging");
        };

        const handleMouseUp = () => {
            isDown = false;
            carousel.classList.remove("is-dragging");
        };

        const handleMouseMove = (e) => {
            if (!isDown) return;
            e.preventDefault();

            const x = e.pageX - carousel.offsetLeft;
            const walk = x - startX;
            carousel.scrollLeft = scrollLeft - walk;
        };

        const handleMouseEnter = () => {
            carousel.style.cursor = "grab";
        };

        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        };

        const handleTouchMove = (e) => {
            const x = e.touches[0].clientX - carousel.offsetLeft;
            const walk = x - startX;
            carousel.scrollLeft = scrollLeft - walk;
        };

        carousel.addEventListener("mousedown", handleMouseDown);
        carousel.addEventListener("mouseleave", handleMouseLeave);
        carousel.addEventListener("mouseup", handleMouseUp);
        carousel.addEventListener("mousemove", handleMouseMove);
        carousel.addEventListener("mouseenter", handleMouseEnter);
        carousel.addEventListener("touchstart", handleTouchStart);
        carousel.addEventListener("touchmove", handleTouchMove);

        carousel.carouselHandlers = {
            handleMouseDown,
            handleMouseLeave,
            handleMouseUp,
            handleMouseMove,
            handleMouseEnter,
            handleTouchStart,
            handleTouchMove,
        };

        carousel.dataset.carouselInitialized = "true";
    });
}

/**
 * Rimuove lo stato di inizializzazione dai carousel selezionati.
 */
export function resetCarouselState(trackSelector = ".carousel-track") {
    const carousels = document.querySelectorAll(trackSelector);

    carousels.forEach((carousel) => {
        if (carousel.carouselHandlers) {
            const h = carousel.carouselHandlers;
            carousel.removeEventListener("mousedown", h.handleMouseDown);
            carousel.removeEventListener("mouseleave", h.handleMouseLeave);
            carousel.removeEventListener("mouseup", h.handleMouseUp);
            carousel.removeEventListener("mousemove", h.handleMouseMove);
            carousel.removeEventListener("mouseenter", h.handleMouseEnter);
            carousel.removeEventListener("touchstart", h.handleTouchStart);
            carousel.removeEventListener("touchmove", h.handleTouchMove);
            delete carousel.carouselHandlers;
        }

        delete carousel.dataset.carouselInitialized;
        void carousel.offsetHeight;
    });
}

/**
 * Aggiunge un elemento al track del carousel.
 */
export function addCarouselItem(trackElement, itemElement) {
    itemElement.classList.add("carousel-item");
    trackElement.appendChild(itemElement);
}

/**
 * Crea e ritorna un elemento DOM per la card di uno spot.
 */
export function createSpotCardItem(spotData) {
    const article = document.createElement("article");
    article.className = "spot-card spot-card--saved carousel-item carousel-item--spot";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-spot-id", spotData.id || "");

    article.setAttribute("data-category", spotData.category?.toLowerCase() || "");

    article.innerHTML = `
        <div class="spot-card-media">
            <div class="spot-image-container">
                <img src="${spotData.image || ''}" alt="Foto spot" class="spot-card-image" data-field="image"/>
            </div>
            <button
                    type="button"
                    class="spot-card-bookmark"
                    aria-label="Rimuovi dai salvati"
            >
                <img src="../assets/icons/homepage/Bookmark.svg" alt="">
            </button>
        </div>

        <div class="spot-card-body">
            <h3 class="spot-card-title" data-field="title">${spotData.title || "Nome spot"}</h3>
        </div>
    `;

    return article;
}
