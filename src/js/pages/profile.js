import { getSavedSpots, getReviews, getVisitedSpots, getCreatedSpots, getUserPolaroids, getSpotById, getCurrentUser } from "../database.js";
import { openAddPolaroidModal } from "./addPolaroid.js";
import { openPolaroidDetail } from "./polaroidDetail.js";

const AVATAR_MAP = {
    "Luana": "Luana.svg",
    "Julio Manuel": "Manuel.svg",
    "Alessandro": "Ale.svg",
    "Teo": "Teo.svg",
    "DEFAULT": "default.svg"
};

const TEMPLATE_PATH = "../html/common-pages/spot-templates.html";
const DEFAULT_POLAROID_IMG = "../assets/default-polaroid.jpg";

let loadViewAllSaved;
let cachedPolaroidTemplate = null;

const profileDepsReady = Promise.all([
    import("./viewAllSaved.js").then((m) => {
        loadViewAllSaved = m.loadViewAllSaved;
    }),
]).catch((err) => {
    console.error("Error loading profile dependencies:", err);
});

export async function loadProfileOverview(wrapper) {
    await profileDepsReady;

    if (!wrapper) return;

    await initializeProfileData(wrapper);
}

window.reloadProfile = async function () {
    const wrapper = document.querySelector('.profile-wrapper');
    await loadProfileOverview(wrapper);
};

export async function reloadProfileHeader() {
    const user = await getCurrentUser();
    if (!user) return;
    updateProfileHeader(user);
    const btn = document.getElementById("header-bookmark-button");
    if (btn) btn.style.display = "none";
}

window.reloadProfileHeader = reloadProfileHeader;

async function initializeProfileData(container) {
    await profileDepsReady;

    await profileDepsReady;

    const user = await getCurrentUser();
    if (!user) return;

    updateProfileHeader(user);

    await updateUserCounters(user.username);

    setupProfileEventListeners(container);

    await initializePolaroidCarousel();
}

function updateProfileHeader(user) {
    const profileData = {
        name: user.username || "",
        username: user.username ? "@" + user.username : "",
        email: user.email || "",
        avatarSrc: `../assets/icons/login-signup/${AVATAR_MAP[user.username] || AVATAR_MAP.DEFAULT}`,
    };

    const elements = {
        name: document.getElementById("profile-name"),
        username: document.getElementById("profile-username"),
        email: document.getElementById("profile-email"),
        avatar: document.getElementById("profile-avatar"),
        backButton: document.getElementById("header-back-button")
    };

    if (elements.name) elements.name.textContent = profileData.name;
    if (elements.username) elements.username.textContent = profileData.username;
    if (elements.email) elements.email.textContent = profileData.email;
    if (elements.avatar) elements.avatar.src = profileData.avatarSrc;

    const title = document.getElementById("header-title");
    if (title) {
        title.classList.add("hidden");
    }
    const logoText = document.getElementById("header-logo-text");
    if (logoText) logoText.style.display = "";
}

async function updateUserCounters(username) {
    try {
        const [saved, reviews, visited, created] = await Promise.all([
            getSavedSpots(username),
            getReviews(username),
            getVisitedSpots(username),
            getCreatedSpots(username)
        ]);

        const elements = {
            saved: document.getElementById("saved-spots"),
            reviews: document.getElementById("written-reviews"),
            visited: document.getElementById("visited-spots"),
            created: document.getElementById("created-spots")
        };

        if (elements.saved) elements.saved.textContent = saved.length;
        if (elements.reviews) elements.reviews.textContent = reviews.length;
        if (elements.visited) elements.visited.textContent = visited.length;
        if (elements.created) elements.created.textContent = created.length;

    } catch (error) {
        console.error("Error updating profile counters:", error);
    }
}

function setupProfileEventListeners(container) {
    const savedSpotsButton = container.querySelector("#profile-saved-spots-button");
    if (savedSpotsButton) {
        if (savedSpotsButton.dataset.bound !== "true") {
            savedSpotsButton.dataset.bound = "true";
            savedSpotsButton.addEventListener("click", handleSavedSpotsClick);
        }
    } else {
        console.error("Button #profile-saved-spots-button not found");
    }

    const addPolaroidButton = container.querySelector(".profile-diary-add-btn");
    if (addPolaroidButton) {
        if (addPolaroidButton.dataset.bound !== "true") {
            addPolaroidButton.dataset.bound = "true";
            addPolaroidButton.addEventListener("click", handleAddPolaroidClick);
        }
    }
}

async function handleSavedSpotsClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof loadViewAllSaved !== "function") {
        console.error("loadViewAllSaved is not available");
        return;
    }
    await loadViewAllSaved("profile");
}

async function handleAddPolaroidClick(e) {
    e.preventDefault();
    e.stopPropagation();
    await openAddPolaroidModal();
}

async function initializePolaroidCarousel() {
    const container = document.getElementById("polaroid-carousel-container");
    if (!container) return;

    try {
        const polaroidData = await fetchPolaroidData();

        if (!polaroidData || polaroidData.length === 0) {
            renderEmptyCarousel(container);
            return;
        }

        const template = await getPolaroidTemplate();
        if (!template) {
            console.error("Polaroid template missing");
            return;
        }

        renderCarouselItems(container, polaroidData, template);

    } catch (err) {
        console.error("Error initializing polaroid carousel:", err);
    }
}

async function fetchPolaroidData() {
    const user = await getCurrentUser();
    if (!user) return [];

    const polaroids = await getUserPolaroids(user.id);
    if (!polaroids || polaroids.length === 0) return [];

    return Promise.all(polaroids.map(async (p) => {
        let subtitle = p.date || "";
        if (p.idLuogo) {
            try {
                const spot = await getSpotById(p.idLuogo);
                if (spot?.nome) {
                    subtitle = `${spot.nome} - ${subtitle}`;
                }
            } catch (e) {
                console.error("Error fetching spot info for polaroid:", e);
            }
        }

        return {
            id: p.id,
            title: p.title || "Senza Titolo",
            subtitle: subtitle,
            image: (p.immagini && p.immagini.length > 0) ? p.immagini[0] : "",
            date: p.date,
            idLuogo: p.idLuogo,
            diary: p.diary || ""
        };
    }));
}

async function getPolaroidTemplate() {
    if (cachedPolaroidTemplate) return cachedPolaroidTemplate;

    try {
        const response = await fetch(TEMPLATE_PATH);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        cachedPolaroidTemplate = doc.querySelector('[data-template="polaroid-template"]');
        return cachedPolaroidTemplate;
    } catch (err) {
        console.error("Failed to fetch polaroid template:", err);
        return null;
    }
}

function renderEmptyCarousel(container) {
    container.innerHTML = `
        <div class="profile-polaroids-empty">
            <img src="../assets/icons/profile/Photo%20Gallery.svg" class="profile-polaroids-empty-icon" alt="" />
            <h3 class="profile-polaroids-empty-title">Nessuna polaroid ancora</h3>
            <p class="profile-polaroids-empty-text">Crea la tua prima polaroid per immortalare i tuoi ricordi!</p>
        </div>
    `;
    updateCarouselCounter(0, 0);
}

function renderCarouselItems(container, items, template) {
    container.innerHTML = "";
    const track = document.createElement("div");
    track.className = "carousel-horizontal_track";

    items.forEach(item => {
        const clone = template.content.cloneNode(true);
        fillPolaroidContent(clone, item);

        const polaroidEl = clone.querySelector('.profile-polaroid');
        if (polaroidEl) {
            polaroidEl.addEventListener('click', (e) => {
                if (e.target.closest('.profile-polaroid-menu')) return;
                e.preventDefault();
                openPolaroidDetail(item);
            });
        }

        track.appendChild(clone);
    });

    container.appendChild(track);

    setupCarouselControls(track, items.length);
}

function fillPolaroidContent(node, item) {
    const titleEl = node.querySelector('[data-slot="title"]');
    const subtitleEl = node.querySelector('[data-slot="subtitle"]');
    const imageContainer = node.querySelector('.profile-polaroid-image');

    if (titleEl) titleEl.textContent = item.title;
    if (subtitleEl) subtitleEl.textContent = item.subtitle;

    if (imageContainer) {
        const bgImage = item.image ? `url('${item.image}')` : `url('${DEFAULT_POLAROID_IMG}')`;
        const imgUrl = item.image || DEFAULT_POLAROID_IMG;

        if (imageContainer.tagName === 'IMG') {
            imageContainer.src = imgUrl;
        } else {
            imageContainer.style.backgroundImage = bgImage;
        }
    }
}

function setupCarouselControls(track, totalItems) {
    track.dataset.currentIndex = "0";
    updateCarouselCounter(totalItems, 1);

    const btnLeft = document.querySelector(".profile-carousel-hit--left");
    const btnRight = document.querySelector(".profile-carousel-hit--right");

    const scrollToIndex = (index) => {
        const children = track.children;
        if (!children.length) return;
        const safeIndex = Math.min(Math.max(index, 0), children.length - 1);
        const target = children[safeIndex];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    };

    if (btnLeft) {
        btnLeft.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const current = parseInt(track.dataset.currentIndex || "0", 10);
            scrollToIndex(current - 1);
        };
    }

    if (btnRight) {
        btnRight.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const current = parseInt(track.dataset.currentIndex || "0", 10);
            scrollToIndex(current + 1);
        };
    }

    const updateCounterOnScroll = () => {
        if (!track.isConnected) return;

        const children = Array.from(track.children);
        if (children.length === 0) return;

        const trackRect = track.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;

        let closestIndex = 0;
        let minDistance = Infinity;

        children.forEach((child, index) => {
            const childRect = child.getBoundingClientRect();
            const childCenter = childRect.left + childRect.width / 2;
            const dist = Math.abs(trackCenter - childCenter);
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = index;
            }
        });

        if (track.dataset.currentIndex !== String(closestIndex)) {
            track.dataset.currentIndex = String(closestIndex);
            updateCarouselCounter(totalItems, closestIndex + 1);
        }
    };

    track.addEventListener('scroll', () => window.requestAnimationFrame(updateCounterOnScroll), { passive: true });

    setTimeout(updateCounterOnScroll, 100);
}

function updateCarouselCounter(total, current) {
    const counter = document.getElementById("polaroid-carousel-counter");
    if (counter) {
        counter.textContent = total > 0 ? `${current}/${total}` : "0/0";
    }
}
