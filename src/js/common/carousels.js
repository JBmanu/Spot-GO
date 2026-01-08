function shouldIgnoreElement(el) {
    if (!el || el.nodeType !== 1) return true;

    if (el.dataset && el.dataset.template) return true;

    return el.hasAttribute("hidden");
}

function getOrCreateHorizontalTrack(carouselEl) {
    let track = carouselEl.querySelector(":scope > .carousel-horizontal_track");
    if (!track) {
        track = document.createElement("div");
        track.className = "carousel-horizontal_track";
        carouselEl.appendChild(track);
    }
    return track;
}

function organizeHorizontalCards(carouselEl, {cardSelector} = {}) {
    const track = getOrCreateHorizontalTrack(carouselEl);

    const directChildren = Array.from(carouselEl.children).filter((ch) => ch !== track);

    const candidates = directChildren.filter((el) => {
        if (shouldIgnoreElement(el)) return false;
        if (!cardSelector) return true;
        return el.matches(cardSelector);
    });

    candidates.forEach((card) => {
        if (card.parentElement !== track) track.appendChild(card);
        card.classList.add("carousel-horizontal_item");
    });

    Array.from(track.children).forEach((child) => {
        if (shouldIgnoreElement(child)) {
            child.remove();
            return;
        }

        if (cardSelector && !child.matches(cardSelector)) {
            carouselEl.insertBefore(child, track);
            return;
        }

        child.classList.add("carousel-horizontal_item");
    });

    return track;
}

function enableDragScrolling(track) {
    if (track.dataset.dragInit === "1") return;
    track.dataset.dragInit = "1";

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;

    const onDown = (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;

        if (e.target.closest("button, [data-bookmark-button]")) return;

        isDown = true;
        hasDragged = false;
        track.classList.add("is-dragging");

        startX = e.clientX;
        startScrollLeft = track.scrollLeft;
    };

    const onMove = (e) => {
        if (!isDown) return;

        const dx = e.clientX - startX;
        if (Math.abs(dx) > 5) {
            hasDragged = true;
            track.scrollLeft = startScrollLeft - dx;
            e.preventDefault?.();
        }
    };

    const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove("is-dragging");
    };

    track.addEventListener("pointerdown", onDown, {passive: false});
    track.addEventListener("pointermove", onMove, {passive: false});
    track.addEventListener("pointerup", endDrag, {passive: true});
    track.addEventListener("pointercancel", endDrag, {passive: true});
    track.addEventListener("pointerleave", endDrag, {passive: true});

    track.querySelectorAll("img").forEach((img) => {
        img.draggable = false;
    });
}

export function initializeHorizontalCarousel(
    carouselEl,
    {cardSelector = ".spot-card-nearby", enableDrag = true} = {}
) {
    if (!carouselEl) return;
    carouselEl.classList.add("carousel-horizontal");
    const track = organizeHorizontalCards(carouselEl, {cardSelector});
    if (enableDrag) enableDragScrolling(track);
}

function getOrCreateVerticalTrack(carouselEl) {
    let track = carouselEl.querySelector(":scope > .carousel-vertical-track");
    if (!track) {
        track = document.createElement("div");
        track.className = "carousel-vertical-track";
        carouselEl.appendChild(track);
    }
    return track;
}

function organizeVerticalCards(carouselEl, {cardSelector} = {}) {
    const track = getOrCreateVerticalTrack(carouselEl);

    const directChildren = Array.from(carouselEl.children).filter((ch) => ch !== track);

    const candidates = directChildren.filter((el) => {
        if (shouldIgnoreElement(el)) return false;
        if (!cardSelector) return true;
        return el.matches(cardSelector);
    });

    candidates.forEach((card) => {
        if (card.parentElement !== track) track.appendChild(card);
        card.classList.add("carousel-vertical_item");
    });

    Array.from(track.children).forEach((child) => {
        if (shouldIgnoreElement(child)) {
            child.remove();
            return;
        }
        if (cardSelector && !child.matches(cardSelector)) {
            carouselEl.insertBefore(child, track);
            return;
        }
        child.classList.add("carousel-vertical_item");
    });

    return track;
}

export function initializeVerticalCarousel(
    carouselEl,
    {cardSelector = ".spot-card-toprated"} = {}
) {
    if (!carouselEl) return;
    carouselEl.classList.add("carousel-vertical");
    organizeVerticalCards(carouselEl, {cardSelector});
}
