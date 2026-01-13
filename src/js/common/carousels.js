function shouldIgnoreElement(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.dataset?.template) return true;
    return el.hasAttribute("hidden");
}

function isAnyTrack(el) {
    return (
        el?.nodeType === 1 &&
        (el.classList.contains("carousel-horizontal_track") ||
            el.classList.contains("carousel-vertical-track"))
    );
}

function getCardSelectorFromDataset(carouselEl) {
    const sel = carouselEl.dataset.cardSelector;
    return sel && sel.trim().length ? sel.trim() : null;
}

function getCandidatesFromDirectChildren(carouselEl, track, cardSelector) {
    const directChildren = Array.from(carouselEl.children).filter((ch) => ch !== track);

    return directChildren.filter((el) => {
        if (shouldIgnoreElement(el)) return false;
        if (isAnyTrack(el)) return false;
        if (!cardSelector) return true;
        return el.matches(cardSelector);
    });
}

function moveOutOfTrack(carouselEl, track, node) {
    if (!carouselEl || !track || !node) return;
    if (node.parentElement !== track) return;

    carouselEl.insertBefore(node, track);
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

function organizeHorizontalCards(carouselEl) {
    const track = getOrCreateHorizontalTrack(carouselEl);
    const cardSelector = getCardSelectorFromDataset(carouselEl);

    const candidates = getCandidatesFromDirectChildren(carouselEl, track, cardSelector);

    for (const card of candidates) {
        if (card.parentElement !== track) track.appendChild(card);
        card.classList.add("carousel-horizontal_item");
    }

    Array.from(track.children).forEach((child) => {
        if (shouldIgnoreElement(child) || isAnyTrack(child)) {
            moveOutOfTrack(carouselEl, track, child);
            return;
        }

        if (cardSelector && !child.matches(cardSelector)) {
            moveOutOfTrack(carouselEl, track, child);
            return;
        }

        child.classList.add("carousel-horizontal_item");
    });

    return track;
}

function enableHorizontalDragScrolling(track) {
    if (track.dataset.dragInit === "1") return;
    track.dataset.dragInit = "1";

    track.style.overflowX = "auto";
    track.style.display = "flex";
    track.style.flexDirection = "row";

    track.style.touchAction = "pan-y";

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onDown = (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.target.closest("button, [data-bookmark-button]")) return;

        isDown = true;
        track.classList.add("is-dragging");
        startX = e.clientX;
        startScrollLeft = track.scrollLeft;
    };

    const onMove = (e) => {
        if (!isDown) return;

        const dx = e.clientX - startX;
        if (Math.abs(dx) > 5) {
            if (!track.hasPointerCapture(e.pointerId)) {
                try { track.setPointerCapture(e.pointerId); } catch { }
            }
            track.scrollLeft = startScrollLeft - dx;
            e.preventDefault?.();
        }
    };

    const endDrag = (e) => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove("is-dragging");
        try { track.releasePointerCapture(e.pointerId); } catch { }
    };

    track.addEventListener("pointerdown", onDown, { passive: false });
    track.addEventListener("pointermove", onMove, { passive: false });
    track.addEventListener("pointerup", endDrag, { passive: true });
    track.addEventListener("pointercancel", endDrag, { passive: true });
    track.addEventListener("pointerleave", endDrag, { passive: true });

    track.querySelectorAll("img").forEach((img) => (img.draggable = false));
}

function initializeHorizontalCarousel(carouselEl) {
    if (!carouselEl) return;

    const firstInit = carouselEl.dataset.carouselInit !== "1";
    if (firstInit) {
        carouselEl.dataset.carouselInit = "1";
        carouselEl.classList.add("carousel-horizontal");
    }

    const track = organizeHorizontalCards(carouselEl);

    const enableDrag = carouselEl.dataset.drag !== "0";
    if (enableDrag) enableHorizontalDragScrolling(track);
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

function organizeVerticalCards(carouselEl) {
    const track = getOrCreateVerticalTrack(carouselEl);
    const cardSelector = getCardSelectorFromDataset(carouselEl);

    const candidates = getCandidatesFromDirectChildren(carouselEl, track, cardSelector);

    for (const card of candidates) {
        if (card.parentElement !== track) track.appendChild(card);
        card.classList.add("carousel-vertical_item");
    }

    Array.from(track.children).forEach((child) => {
        if (shouldIgnoreElement(child) || isAnyTrack(child)) {
            moveOutOfTrack(carouselEl, track, child);
            return;
        }

        if (cardSelector && !child.matches(cardSelector)) {
            moveOutOfTrack(carouselEl, track, child);
            return;
        }

        child.classList.add("carousel-vertical_item");
    });

    return track;
}

function enableVerticalDragScrolling(track) {
    if (track.dataset.dragInit === "1") return;
    track.dataset.dragInit = "1";

    track.style.touchAction = "pan-x";

    let isDown = false;
    let startY = 0;
    let startScrollTop = 0;

    const onDown = (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.target.closest("button, [data-bookmark-button]")) return;

        isDown = true;
        track.classList.add("is-dragging");
        startY = e.clientY;
        startScrollTop = track.scrollTop;
    };

    const onMove = (e) => {
        if (!isDown) return;

        const dy = e.clientY - startY;
        if (Math.abs(dy) > 5) {
            if (!track.hasPointerCapture(e.pointerId)) {
                try { track.setPointerCapture(e.pointerId); } catch { }
            }
            track.scrollTop = startScrollTop - dy;
            e.preventDefault?.();
        }
    };

    const endDrag = (e) => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove("is-dragging");
        try { track.releasePointerCapture(e.pointerId); } catch { }
    };

    track.addEventListener("pointerdown", onDown, { passive: false });
    track.addEventListener("pointermove", onMove, { passive: false });
    track.addEventListener("pointerup", endDrag, { passive: true });
    track.addEventListener("pointercancel", endDrag, { passive: true });
    track.addEventListener("pointerleave", endDrag, { passive: true });

    track.querySelectorAll("img").forEach((img) => (img.draggable = false));
}

function applyVerticalSize(track, carouselEl) {
    const size = carouselEl.dataset.size;
    track.style.overflowY = "auto";

    if (size === "md") track.style.maxHeight = "400px";
    else if (size === "lg") track.style.maxHeight = "600px";
    else track.style.maxHeight = "";
}

function initializeVerticalCarousel(carouselEl) {
    if (!carouselEl) return;

    const firstInit = carouselEl.dataset.carouselInit !== "1";
    if (firstInit) {
        carouselEl.dataset.carouselInit = "1";
        carouselEl.classList.add("carousel-vertical");
    }

    const track = organizeVerticalCards(carouselEl);

    const enableDrag = carouselEl.dataset.drag !== "0";
    if (enableDrag) enableVerticalDragScrolling(track);

    applyVerticalSize(track, carouselEl);
}

function initCarouselIfNeeded(el) {
    if (!el || el.nodeType !== 1) return;

    const type = el.dataset.carouselType;

    if (type === "horizontal") {
        initializeHorizontalCarousel(el);
        return;
    }

    if (type === "vertical") {
        initializeVerticalCarousel(el);
        return;
    }
}

const reflowQueue = new Set();
let reflowRaf = 0;

function scheduleReflow(carouselEl) {
    if (!carouselEl) return;
    reflowQueue.add(carouselEl);

    if (reflowRaf) return;
    reflowRaf = requestAnimationFrame(() => {
        reflowRaf = 0;

        for (const c of reflowQueue) {
            if (!c.isConnected) continue;

            const type = c.dataset.carouselType;
            if (type === "horizontal") {
                initializeHorizontalCarousel(c);
            } else if (type === "vertical") {
                initializeVerticalCarousel(c);
            }
        }
        reflowQueue.clear();
    });
}

function findClosestCarousel(node) {
    if (!node || node.nodeType !== 1) return null;
    return node.closest("[data-carousel-type]");
}

export function autoInitializeCarousels(root = document) {
    root.querySelectorAll("[data-carousel-type]").forEach(initCarouselIfNeeded);
}

export { initializeHorizontalCarousel, initializeVerticalCarousel };

document.addEventListener("DOMContentLoaded", () => {
    autoInitializeCarousels(document);
});

const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType !== 1) continue;

            initCarouselIfNeeded(node);
            node
                .querySelectorAll?.("[data-carousel-type]")
                .forEach(initCarouselIfNeeded);

            const c = findClosestCarousel(node);
            if (c) scheduleReflow(c);
        }

        if (m.type === "childList" && m.target?.nodeType === 1) {
            const c = findClosestCarousel(m.target);
            if (c) scheduleReflow(c);
        }
    }
});

function startCarouselObserver() {
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.body) startCarouselObserver();
else document.addEventListener("DOMContentLoaded", startCarouselObserver);
