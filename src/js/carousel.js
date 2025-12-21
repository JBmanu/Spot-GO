export function initializeCarousel(trackSelector = ".carousel-track") {
    const carousels = document.querySelectorAll(trackSelector);

    carousels.forEach((carousel) => {
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;


        carousel.addEventListener("mousedown", (e) => {
            isDown = true;
            carousel.classList.add("is-dragging");
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener("mouseleave", () => {
            isDown = false;
            carousel.classList.remove("is-dragging");
        });

        carousel.addEventListener("mouseup", () => {
            isDown = false;
            carousel.classList.remove("is-dragging");
        });

        carousel.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();

            const x = e.pageX - carousel.offsetLeft;
            const walk = x - startX;
            carousel.scrollLeft = scrollLeft - walk;
        });

        carousel.addEventListener("mouseenter", () => {
            carousel.style.cursor = "grab";
        });


        carousel.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener("touchmove", (e) => {
            const x = e.touches[0].clientX - carousel.offsetLeft;
            const walk = x - startX;
            carousel.scrollLeft = scrollLeft - walk;
        });
    });
}

export function addCarouselItem(trackElement, itemElement) {
    itemElement.classList.add("carousel-item");
    trackElement.appendChild(itemElement);
}

export function clearCarousel(trackElement) {
    trackElement.innerHTML = "";
}

export function createSpotCardItem(spotData) {
    const article = document.createElement("article");
    article.className = "spot-card spot-card--saved carousel-item carousel-item--spot";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-spot-id", spotData.id || "");

    // Debug: log della categoria
    console.log("spotData:", spotData);
    console.log("spotData.category:", spotData.category);

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

export function createCarouselItem(itemData, variant = "spot") {
    const div = document.createElement("div");
    div.className = `carousel-item carousel-item--${variant}`;
    div.setAttribute("data-item-id", itemData.id || "");

    div.innerHTML = itemData.content || "<div class='placeholder'>Item</div>";

    return div;
}

