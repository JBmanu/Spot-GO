function isIgnorableNode(el) {
    if (!el || el.nodeType !== 1) return true;

    if (el.dataset && el.dataset.template) return true;

    return false;
}

function ensureTrack(carouselEl) {
    let track = carouselEl.querySelector(":scope > .carousel-horizontal_track");
    if (!track) {
        track = document.createElement("div");
        track.className = "carousel-horizontal_track";
        carouselEl.appendChild(track);
    }
    return track;
}

function wrapCardsIntoTrack(carouselEl, { cardSelector } = {}) {
    const track = ensureTrack(carouselEl);

    const directChildren = Array.from(carouselEl.children).filter(
        (ch) => ch !== track
    );

    const candidates = directChildren.filter((el) => {
        if (isIgnorableNode(el)) return false;
        if (!cardSelector) return true;
        return el.matches(cardSelector);
    });

    candidates.forEach((card) => {
        card.classList.add("carousel-horizontal_item");
        track.appendChild(card);
    });

    Array.from(track.children).forEach((child) => {
        if (isIgnorableNode(child)) return;
        if (cardSelector && !child.matches(cardSelector)) return;
        child.classList.add("carousel-horizontal_item");
    });

    return track;
}

function setupDragToScroll(track) {
    if (track.dataset.dragInit === "1") return;
    track.dataset.dragInit = "1";

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onDown = (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.target.closest("button, [data-bookmark-button]")) return;

        isDown = true;
        track.classList.add("is-dragging");
        track.setPointerCapture?.(e.pointerId);

        startX = e.clientX;
        startScrollLeft = track.scrollLeft;
    };

    const onMove = (e) => {
        if (!isDown) return;

        const dx = e.clientX - startX;
        track.scrollLeft = startScrollLeft - dx;

        e.preventDefault?.();
    };

    const endDrag = (e) => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove("is-dragging");
        try {
            track.releasePointerCapture?.(e.pointerId);
        } catch (_) {}
    };

    track.addEventListener("pointerdown", onDown, { passive: true });
    track.addEventListener("pointermove", onMove, { passive: false });
    track.addEventListener("pointerup", endDrag, { passive: true });
    track.addEventListener("pointercancel", endDrag, { passive: true });
    track.addEventListener("pointerleave", endDrag, { passive: true });

    track.querySelectorAll("img").forEach((img) => {
        img.draggable = false;
    });
}

export function initHorizontalCarousels(
    root = document,
    { cardSelector = ".spot-card-nearby", enableDrag = true } = {}
) {
    const carousels = root.querySelectorAll(".js-carousel-horizontal");

    carousels.forEach((carouselEl) => {
        carouselEl.classList.add("carousel-horizontal");

        const track = wrapCardsIntoTrack(carouselEl, { cardSelector });

        if (enableDrag) setupDragToScroll(track);
    });
}

export function refreshHorizontalCarousel(
    carouselEl,
    { cardSelector = ".spot-card-nearby", enableDrag = true } = {}
) {
    if (!carouselEl) return;
    carouselEl.classList.add("carousel-horizontal");
    const track = wrapCardsIntoTrack(carouselEl, { cardSelector });
    if (enableDrag) setupDragToScroll(track);
}

function ensureVerticalTrack(carouselEl) {
    let track = carouselEl.querySelector(":scope > .carousel-vertical-track");
    if (!track) {
        track = document.createElement("div");
        track.className = "carousel-vertical-track";
        carouselEl.appendChild(track);
    }
    return track;
}

function wrapVerticalCardsIntoTrack(carouselEl, { cardSelector } = {}) {
    const track = ensureVerticalTrack(carouselEl);

    const directChildren = Array.from(carouselEl.children).filter(
        (ch) => ch !== track
    );

    const candidates = directChildren.filter((el) => {
        if (isIgnorableNode(el)) return false;
        if (!cardSelector) return true;
        return el.matches(cardSelector);
    });

    candidates.forEach((card) => {
        card.classList.add("carousel-vertical_item");
        track.appendChild(card);
    });

    Array.from(track.children).forEach((child) => {
        if (isIgnorableNode(child)) return;
        if (cardSelector && !child.matches(cardSelector)) return;
        child.classList.add("carousel-vertical_item");
    });

    return track;
}

export function initVerticalCarousels(
    root = document,
    { cardSelector = ".spot-card-toprated" } = {}
) {
    const carousels = root.querySelectorAll(".js-carousel-vertical");

    carousels.forEach((carouselEl) => {
        carouselEl.classList.add("carousel-vertical");
        wrapVerticalCardsIntoTrack(carouselEl, { cardSelector });
    });
}

export function refreshVerticalCarousel(
    carouselEl,
    { cardSelector = ".spot-card-toprated" } = {}
) {
    if (!carouselEl) return;
    carouselEl.classList.add("carousel-vertical");
    wrapVerticalCardsIntoTrack(carouselEl, { cardSelector });
}
