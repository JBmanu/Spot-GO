const INTERACTIVE_SELECTOR =
    "a, button, input, textarea, select, label, [role='button'], [contenteditable='true']";

export function initializeCarousel(trackSelector = ".carousel-track") {
    const carousels = document.querySelectorAll(trackSelector);

    carousels.forEach((carousel) => {
        if (carousel.dataset.carouselInitialized === "true") return;

        const isVertical =
            carousel.classList.contains("carousel-vertical-track") ||
            carousel.dataset.orientation === "vertical";

        carousel.style.touchAction = isVertical ? "pan-x" : "pan-y";

        let isDown = false;
        let startCoord = 0;
        let startScroll = 0;

        const getLocalCoord = (e) => {
            const rect = carousel.getBoundingClientRect();
            return isVertical ? e.clientY - rect.top : e.clientX - rect.left;
        };

        const getScroll = () => (isVertical ? carousel.scrollTop : carousel.scrollLeft);

        const setScroll = (v) => {
            if (isVertical) carousel.scrollTop = v;
            else carousel.scrollLeft = v;
        };

        const isInteractiveTarget = (target) => !!target.closest(INTERACTIVE_SELECTOR);

        const handlePointerDown = (e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;

            if (isInteractiveTarget(e.target)) return;

            isDown = true;
            carousel.classList.add("is-dragging");

            startCoord = getLocalCoord(e);
            startScroll = getScroll();

            try {
                carousel.setPointerCapture(e.pointerId);
            } catch {
            }
        };

        const handlePointerMove = (e) => {
            if (!isDown) return;

            e.preventDefault();

            const now = getLocalCoord(e);
            const walk = now - startCoord;
            setScroll(startScroll - walk);
        };

        const stopDrag = (e) => {
            if (!isDown) return;

            isDown = false;
            carousel.classList.remove("is-dragging");

            try {
                carousel.releasePointerCapture(e.pointerId);
            } catch {
            }
        };

        const handlePointerEnter = () => {
            carousel.style.cursor = "grab";
        };

        carousel.addEventListener("pointerdown", handlePointerDown);
        carousel.addEventListener("pointermove", handlePointerMove, {passive: false});
        carousel.addEventListener("pointerup", stopDrag);
        carousel.addEventListener("pointercancel", stopDrag);
        carousel.addEventListener("pointerleave", stopDrag);
        carousel.addEventListener("pointerenter", handlePointerEnter);

        carousel.carouselHandlers = {
            handlePointerDown,
            handlePointerMove,
            stopDrag,
            handlePointerEnter,
        };

        carousel.dataset.carouselInitialized = "true";
    });
}

export function resetCarouselState(trackSelector = ".carousel-track") {
    const carousels = document.querySelectorAll(trackSelector);

    carousels.forEach((carousel) => {
        const h = carousel.carouselHandlers;

        if (h) {
            carousel.removeEventListener("pointerdown", h.handlePointerDown);
            carousel.removeEventListener("pointermove", h.handlePointerMove);
            carousel.removeEventListener("pointerup", h.stopDrag);
            carousel.removeEventListener("pointercancel", h.stopDrag);
            carousel.removeEventListener("pointerleave", h.stopDrag);
            carousel.removeEventListener("pointerenter", h.handlePointerEnter);
            delete carousel.carouselHandlers;
        }

        carousel.removeAttribute("data-carousel-initialized");

        void carousel.offsetHeight;
    });
}

export function addCarouselItem(trackElement, itemElement) {
    itemElement.classList.add("carousel-item");
    trackElement.appendChild(itemElement);
}

export function createSpotCardItem(spotData) {
    const shell = document.createElement("div");
    shell.className = "saved-spot-shell";
    shell.setAttribute("data-category", (spotData.category || "").toLowerCase());

    const pedestal = document.createElement("div");
    pedestal.className = "saved-spot-pedestal";
    shell.appendChild(pedestal);

    const article = document.createElement("article");
    article.className = "spot-card spot-card--saved carousel-item carousel-item--spot";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-spot-id", spotData.id || "");

    const media = document.createElement("div");
    media.className = "spot-card-media";

    const imgWrap = document.createElement("div");
    imgWrap.className = "spot-image-container";

    const img = document.createElement("img");
    img.className = "spot-card-image";
    img.setAttribute("data-field", "image");
    img.alt = "Foto spot";
    img.src = spotData.image || "";
    imgWrap.appendChild(img);

    const bookmarkBtn = document.createElement("button");
    bookmarkBtn.type = "button";
    bookmarkBtn.className = "spot-card-bookmark";
    bookmarkBtn.setAttribute("aria-label", "Rimuovi dai salvati");

    const bookmarkIcon = document.createElement("img");
    bookmarkIcon.src = "../assets/icons/homepage/Bookmark.svg";
    bookmarkIcon.alt = "";
    bookmarkBtn.appendChild(bookmarkIcon);

    media.appendChild(imgWrap);
    media.appendChild(bookmarkBtn);

    const body = document.createElement("div");
    body.className = "spot-card-body";

    const title = document.createElement("h3");
    title.className = "spot-card-title";
    title.setAttribute("data-field", "title");
    title.textContent = spotData.title || "Nome spot";

    body.appendChild(title);

    article.appendChild(media);
    article.appendChild(body);
    shell.appendChild(article);

    return shell;
}
