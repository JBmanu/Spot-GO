import { getSavedSpots, getReviews, getVisitedSpots, getCreatedSpots, getUserPolaroids, getSpotById, getCurrentUser } from "../database.js";
import { openAddPolaroidModal } from "./addPolaroid.js";

let loadViewAllSaved;

const __profileDepsReady = Promise.all([
    import("./viewAllSaved.js").then((m) => {
        loadViewAllSaved = m.loadViewAllSaved;
    }),
]).catch((err) => {
    console.error("Errore nel caricamento dei moduli in profile.js:", err);
});

async function loadProfileOverview(wrapper) {
    await __profileDepsReady;

    const overviewContainer = wrapper;
    if (!overviewContainer) return;

    await initializeProfileData(overviewContainer);
}

async function initializeProfileData(overviewContainer) {
    await __profileDepsReady;

    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return;

    const user = JSON.parse(currentUserStr);

    const avatarMap = {
        "Luana": "Luana.svg",
        "Julio Manuel": "Manuel.svg",
        "Alessandro": "Ale.svg",
        "Teo": "Teo.svg"
    };

    const profileData = {
        name: user.username || "",
        username: user.username ? "@" + user.username : "",
        email: user.email || "",
        avatarSrc: `../assets/icons/login-signup/${avatarMap[user.username] || 'default.svg'}`,
    };

    updateProfileUI(profileData);

    await updateUserCounters(user.username);

    const savedSpotsButton = overviewContainer.querySelector("#profile-saved-spots-button");
    if (savedSpotsButton) {
        if (savedSpotsButton.dataset.bound !== "true") {
            savedSpotsButton.dataset.bound = "true";

            savedSpotsButton.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (typeof loadViewAllSaved !== "function") {
                    console.error("loadViewAllSaved is not a function");
                    return;
                }

                await loadViewAllSaved("profile");
            });
        }
    } else {
        console.error("savedSpotsButton not found");
    }

    const addPolaroidButton = overviewContainer.querySelector(".profile-diary-add-btn");
    if (addPolaroidButton) {
        if (addPolaroidButton.dataset.bound !== "true") {
            addPolaroidButton.dataset.bound = "true";

            addPolaroidButton.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await openAddPolaroidModal();
            });
        }
    }

    await initializePolaroidCarousel();
}

async function initializePolaroidCarousel() {
    const container = document.getElementById("polaroid-carousel-container");

    if (!container) return;

    container.innerHTML = "";

    try {
        const [user, templateResponse] = await Promise.all([
            getCurrentUser(),
            fetch("../html/common-pages/spot-templates.html")
        ]);

        if (!user) {
            updateCarouselCounter(0);
            return;
        }

        const templateHtml = await templateResponse.text();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = templateHtml;
        const template = tempDiv.querySelector('[data-template="polaroid-template"]');

        if (!template) {
            return;
        }

        const polaroids = await getUserPolaroids(user.id);

        if (!polaroids || polaroids.length === 0) {
            updateCarouselCounter(0);
            return;
        }

        const populatedPolaroids = await Promise.all(polaroids.map(async (p) => {
            let subtitle = p.date || "";
            if (p.idLuogo) {
                try {
                    const spot = await getSpotById(p.idLuogo);
                    if (spot && spot.nome) {
                        subtitle = `${spot.nome} - ${subtitle}`;
                    }
                } catch (e) {
                    console.error("error fetching spot name", e);
                }
            }

            const image = (p.immagini && p.immagini.length > 0) ? p.immagini[0] : "";

            return {
                title: p.title || "Senza Titolo",
                subtitle: subtitle,
                image: image,
                date: p.date,
                id: p.id
            };
        }));

        if (populatedPolaroids.length === 0) {
            updateCarouselCounter(0);
            return;
        }

        populatedPolaroids.forEach(polaroid => {
            const clone = template.content.cloneNode(true);
            const titleEl = clone.querySelector('[data-slot="title"]');
            const subtitleEl = clone.querySelector('[data-slot="subtitle"]');

            if (titleEl) titleEl.textContent = polaroid.title;
            if (subtitleEl) subtitleEl.textContent = polaroid.subtitle;

            const imageContainer = clone.querySelector('.profile-polaroid-image');
            if (imageContainer) {
                if (imageContainer.tagName === 'IMG') {
                    imageContainer.src = polaroid.image || "../assets/default-polaroid.jpg";
                } else {
                    imageContainer.style.backgroundImage = `url('${polaroid.image || "../assets/default-polaroid.jpg"}')`;
                }
            }

            container.appendChild(clone);
        });

        updateCarouselCounter(populatedPolaroids.length);

        const btnLeft = document.querySelector(".profile-carousel-hit--left");
        const btnRight = document.querySelector(".profile-carousel-hit--right");

        if (btnLeft && btnRight) {
            const track = container.querySelector(".carousel-horizontal_track");

            const getMetrics = () => {
                if (!track || !track.children.length) return null;
                const card = track.children[0];
                const style = window.getComputedStyle(card);
                const trackStyle = window.getComputedStyle(track);
                const gap = parseFloat(trackStyle.gap) || 0;

                const marginLeft = parseFloat(style.marginLeft) || 0;
                const marginRight = parseFloat(style.marginRight) || 0;
                const cardWidth = card.offsetWidth;

                const stride = cardWidth + marginLeft + marginRight + gap;

                return { stride, cardWidth, marginLeft, visibleWidth: track.clientWidth };
            };

            const updateCounterOnScroll = () => {
                if (!track) return;
                const metrics = getMetrics();
                if (!metrics) return;
                const { stride } = metrics;
                if (stride <= 0) return;

                const scrollLeft = track.scrollLeft;

                const currentIndex = Math.round(scrollLeft / stride);

                const total = populatedPolaroids.length;
                const safeIndex = Math.min(Math.max(currentIndex, 0), total - 1);

                updateCarouselCounter(total, safeIndex + 1);
            };

            if (track) {
                track.addEventListener("scroll", () => {
                    window.requestAnimationFrame(updateCounterOnScroll);
                }, { passive: true });

                updateCounterOnScroll();
            }

            const scrollToCard = (targetIndex) => {
                if (!track) return;
                const metrics = getMetrics();
                if (!metrics) return;
                const { stride, cardWidth, marginLeft, visibleWidth } = metrics;

                const total = track.children.length;
                const safeIndex = Math.min(Math.max(targetIndex, 0), total - 1);

                const cardStart = (safeIndex * stride) + marginLeft;
                const cardCenter = cardStart + (cardWidth / 2);
                const targetScroll = cardCenter - (visibleWidth / 2);

                track.scrollTo({
                    left: targetScroll,
                    behavior: "smooth"
                });
            };

            btnLeft.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const metrics = getMetrics();
                if (!track || !metrics) return;

                const centerPoint = track.scrollLeft + (metrics.visibleWidth / 2);
                const currentIndex = Math.round((centerPoint - (metrics.cardWidth / 2)) / metrics.stride);

                scrollToCard(currentIndex - 1);
            };

            btnRight.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const metrics = getMetrics();
                if (!track || !metrics) return;

                const centerPoint = track.scrollLeft + (metrics.visibleWidth / 2);
                const currentIndex = Math.round((centerPoint - (metrics.cardWidth / 2)) / metrics.stride);

                scrollToCard(currentIndex + 1);
            };

            setTimeout(() => scrollToCard(0), 100);
        }

    } catch (err) {
        console.error("Errore caricamento template polaroid:", err);
    }
}

function updateCarouselCounter(total, current = 1) {
    const counter = document.getElementById("polaroid-carousel-counter");
    if (counter) {
        counter.textContent = total > 0 ? `${current}/${total}` : "0/0";
    }
}

function updateProfileUI(data) {
    const nameEl = document.getElementById("profile-name");
    const usernameEl = document.getElementById("profile-username");
    const emailEl = document.getElementById("profile-email");
    const avatarEl = document.getElementById("profile-avatar");

    if (nameEl) nameEl.textContent = data.name;
    if (usernameEl) usernameEl.textContent = data.username;
    if (emailEl) emailEl.textContent = data.email;
    if (avatarEl) avatarEl.src = data.avatarSrc;
}

async function updateUserCounters(username) {
    try {
        const [saved, reviews, visited, created] = await Promise.all([
            getSavedSpots(username),
            getReviews(username),
            getVisitedSpots(username),
            getCreatedSpots(username)
        ]);

        const savedCount = saved.length;
        const reviewsCount = reviews.length;
        const visitedCount = visited.length;
        const createdCount = created.length;

        const savedEl = document.getElementById("saved-spots");
        const reviewsEl = document.getElementById("written-reviews");
        const visitedEl = document.getElementById("visited-spots");
        const createdEl = document.getElementById("created-spots");

        if (savedEl) savedEl.textContent = savedCount;
        if (reviewsEl) reviewsEl.textContent = reviewsCount;
        if (visitedEl) visitedEl.textContent = visitedCount;
        if (createdEl) createdEl.textContent = createdCount;
    } catch (error) {
        console.error("Errore nell'aggiornamento dei contatori:", error);
    }
}

window.reloadProfile = async function () {
    await loadProfileOverview();
};

export { loadProfileOverview };
