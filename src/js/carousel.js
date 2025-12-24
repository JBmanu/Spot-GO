/**
 * Inizializza il comportamento di drag/scroll per i carousel.
 */
export function initializeCarousel(trackSelector = ".carousel-track") {
    const carousels = document.querySelectorAll(trackSelector);

    carousels.forEach((carousel) => {
        if (carousel.dataset.carouselInitialized === "true") {
            return;
        }

        const isVertical = carousel.classList.contains('vertical-carousel-track') || carousel.dataset.orientation === 'vertical';

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let startY = 0;
        let scrollTop = 0;

        const handleMouseDown = (e) => {
            if (e.target.closest('[role="listitem"]')) return;

            isDown = true;
            carousel.classList.add("is-dragging");
            if (isVertical) {
                startY = e.pageY - carousel.offsetTop;
                scrollTop = carousel.scrollTop;
            } else {
                startX = e.pageX - carousel.offsetLeft;
                scrollLeft = carousel.scrollLeft;
            }
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

            if (isVertical) {
                const y = e.pageY - carousel.offsetTop;
                const walk = y - startY;
                carousel.scrollTop = scrollTop - walk;
            } else {
                const x = e.pageX - carousel.offsetLeft;
                const walk = x - startX;
                carousel.scrollLeft = scrollLeft - walk;
            }
        };

        const handleMouseEnter = () => {
            carousel.style.cursor = "grab";
        };

        const handleTouchStart = (e) => {
            if (isVertical) {
                startY = e.touches[0].clientY - carousel.offsetTop;
                scrollTop = carousel.scrollTop;
            } else {
                startX = e.touches[0].clientX - carousel.offsetLeft;
                scrollLeft = carousel.scrollLeft;
            }
        };

        const handleTouchMove = (e) => {
            if (isVertical) {
                const y = e.touches[0].clientY - carousel.offsetTop;
                const walk = y - startY;
                carousel.scrollTop = scrollTop - walk;
            } else {
                const x = e.touches[0].clientX - carousel.offsetLeft;
                const walk = x - startX;
                carousel.scrollLeft = scrollLeft - walk;
            }
        };

        // Detect touch-capable devices to avoid intercepting native touch scroll
        const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

        const handlePointerDown = (e) => {
            if (!isVertical) return;
            if (e.target.closest('[role="listitem"]')) return;

            isDown = true;
            carousel.classList.add('is-dragging');
            startY = e.clientY - carousel.getBoundingClientRect().top;
            scrollTop = carousel.scrollTop;
            try {
                carousel.setPointerCapture(e.pointerId);
            } catch (err) {
            }
        };

        const handlePointerMove = (e) => {
            if (!isDown || !isVertical) return;
            const y = e.clientY - carousel.getBoundingClientRect().top;
            const walk = y - startY;
            carousel.scrollTop = scrollTop - walk;
        };

        const handlePointerUp = (e) => {
            if (!isVertical) return;
            isDown = false;
            carousel.classList.remove('is-dragging');
            try {
                carousel.releasePointerCapture(e.pointerId);
            } catch (err) {
            }
        };

        carousel.addEventListener("mousedown", handleMouseDown);
        carousel.addEventListener("mouseleave", handleMouseLeave);
        carousel.addEventListener("mouseup", handleMouseUp);
        carousel.addEventListener("mousemove", handleMouseMove);
        carousel.addEventListener("mouseenter", handleMouseEnter);
        if (!isVertical) {
            carousel.addEventListener("touchstart", handleTouchStart, {passive: true});
            carousel.addEventListener("touchmove", handleTouchMove, {passive: true});
        }
        if (isVertical && !isTouchDevice) {
            carousel.addEventListener('pointerdown', handlePointerDown);
            carousel.addEventListener('pointermove', handlePointerMove);
            carousel.addEventListener('pointerup', handlePointerUp);
            carousel.addEventListener('pointercancel', handlePointerUp);
        }

        carousel.carouselHandlers = {
            handleMouseDown,
            handleMouseLeave,
            handleMouseUp,
            handleMouseMove,
            handleMouseEnter,
            handleTouchStart,
            handleTouchMove,
            handlePointerDown,
            handlePointerMove,
            handlePointerUp,
        };

        carousel.dataset.carouselInitialized = "true";
    });
}

/**
 * Rimuove lo stato di inizializzazione dai carousel.
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
            carousel.removeEventListener('pointerdown', h.handlePointerDown);
            carousel.removeEventListener('pointermove', h.handlePointerMove);
            carousel.removeEventListener('pointerup', h.handlePointerUp);
            carousel.removeEventListener('pointercancel', h.handlePointerUp);
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
