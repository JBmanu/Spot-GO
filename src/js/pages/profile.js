import { getSavedSpots, getReviews, getVisitedSpots, getCreatedSpots, getUserPolaroids, getSpotById, getCurrentUser, deletePolaroid } from "../database.js";
import { openAddPolaroidModal } from "./addPolaroid.js";
import { openPolaroidDetail } from "./polaroidDetail.js";
import { formatDate } from "../common/datetime.js";
import { fetchFormattedUserPolaroids, getPolaroidTemplate, fillPolaroidContent } from "../common/polaroidCommon.js";

const AVATAR_MAP = {
    "Luana": "Luana.svg",
    "Julio Manuel": "Manuel.svg",
    "Alessandro": "Ale.svg",
    "Teo": "Teo.svg",
    "DEFAULT": "default.svg"
};

let loadViewAllSaved;
let loadViewAllPolaroids;

const profileDepsReady = Promise.all([
    import("./viewAllSaved.js").then((m) => {
        loadViewAllSaved = m.loadViewAllSaved;
    }),
    import("./viewAllPolaroids.js").then((m) => {
        loadViewAllPolaroids = m.loadViewAllPolaroids;
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

export async function initializeProfileData(container) {
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

    const openAlbumButton = container.querySelector(".profile-album-btn");
    if (openAlbumButton) {
        if (openAlbumButton.dataset.bound !== "true") {
            openAlbumButton.dataset.bound = "true";
            openAlbumButton.addEventListener("click", handleOpenAlbumClick);
        }
    }

    if (container.dataset.liveUpdatesBound !== "true") {
        container.dataset.liveUpdatesBound = "true";

        document.addEventListener("polaroid:added", () => {
            initializePolaroidCarousel();
            getCurrentUser().then(user => { if (user) updateUserCounters(user.username); });
        });

        document.addEventListener("polaroid:deleted", () => {
            initializePolaroidCarousel();
            getCurrentUser().then(user => { if (user) updateUserCounters(user.username); });
        });
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

async function handleOpenAlbumClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof loadViewAllPolaroids !== "function") {
        console.error("loadViewAllPolaroids is not available");
        return;
    }
    await loadViewAllPolaroids("profile");
}

async function initializePolaroidCarousel() {
    const container = document.getElementById("polaroid-carousel-container");
    if (!container) return;

    try {
        const polaroidData = await fetchFormattedUserPolaroids();

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
                if (e.target.closest('.polaroid-menu-wrapper') || e.target.closest('.polaroid-menu-dropdown') || e.target.closest('.profile-polaroid-menu')) return;
                e.preventDefault();
                openPolaroidDetail(item);
            });

            const menuBtn = clone.querySelector('.profile-polaroid-menu');
            const menuDropdown = clone.querySelector('.polaroid-menu-dropdown');

            if (menuBtn && menuDropdown) {
                menuBtn.addEventListener('click', (e) => {
                    console.log("Menu button clicked");
                    e.preventDefault();
                    e.stopPropagation();
                    const isVisible = menuDropdown.classList.contains("opacity-100");

                    document.querySelectorAll('.polaroid-menu-dropdown.opacity-100').forEach(el => {
                        if (el !== menuDropdown) {
                            el.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                            el.classList.add("opacity-0", "scale-95", "pointer-events-none");

                            const parentCard = el.closest('.profile-polaroid');
                            if (parentCard) parentCard.style.zIndex = "";
                        }
                    });

                    if (isVisible) {
                        menuDropdown.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                        menuDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
                        if (polaroidEl) polaroidEl.style.zIndex = "";
                    } else {
                        menuDropdown.classList.remove("opacity-0", "scale-95", "pointer-events-none");
                        menuDropdown.classList.add("opacity-100", "scale-100", "pointer-events-auto");

                        if (polaroidEl) polaroidEl.style.zIndex = "100";
                    }
                });

                const editBtn = menuDropdown.querySelector('[data-action="edit-polaroid"]');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        console.log("Edit action clicked");
                        e.preventDefault();
                        e.stopPropagation();

                        menuDropdown.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                        menuDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
                        if (polaroidEl) polaroidEl.style.zIndex = "";

                        openPolaroidDetail(item, { startInEditMode: true });
                    });
                }

                const shareBtn = menuDropdown.querySelector('[data-action="share-polaroid"]');
                if (shareBtn) {
                    shareBtn.addEventListener('click', (e) => {
                        console.log("Share action clicked");
                        e.preventDefault();
                        e.stopPropagation();

                        menuDropdown.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                        menuDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
                        if (polaroidEl) polaroidEl.style.zIndex = "";

                        if (navigator.share) {
                            navigator.share({
                                title: item.title || 'Polaroid',
                                text: item.diary || 'Guarda questa polaroid su Spot GO!',
                                url: window.location.href
                            }).catch(console.error);
                        } else {
                            alert("Condivisione non supportata su questo browser");
                        }
                    });
                }

                const deleteBtn = menuDropdown.querySelector('[data-action="delete-polaroid"]');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        console.log("Delete action clicked");
                        e.preventDefault();
                        e.stopPropagation();

                        menuDropdown.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                        menuDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
                        if (polaroidEl) polaroidEl.style.zIndex = "";

                        showDeleteConfirmation(item);
                    });
                }
            }
        }

        track.appendChild(clone);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.polaroid-menu-wrapper')) {
            document.querySelectorAll('.polaroid-menu-dropdown.opacity-100').forEach(el => {
                el.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                el.classList.add("opacity-0", "scale-95", "pointer-events-none");

                const parentCard = el.closest('.profile-polaroid');
                if (parentCard) parentCard.style.zIndex = "";
            });
        }
    });

    container.appendChild(track);

    setupCarouselControls(track, items.length);
}

function showDeleteConfirmation(item) {
    const modal = document.getElementById("polaroid-delete-modal");
    if (!modal) return;

    const confirmBtn = modal.querySelector("#delete-modal-confirm");
    const cancelBtn = modal.querySelector("#delete-modal-cancel");

    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    const closeModal = () => {
        modal.classList.remove("active");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
    };

    newCancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
    });

    newConfirmBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await deletePolaroid(item.id);
            closeModal();
            initializePolaroidCarousel();

            const user = await getCurrentUser();
            if (user) updateUserCounters(user.username);
        } catch (err) {
            console.error("Error deleting polaroid:", err);
            alert("Errore durante l'eliminazione.");
            closeModal();
        }
    });

    modal.style.display = "flex";
    requestAnimationFrame(() => {
        modal.classList.add("active");
    });

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function setupCarouselControls(track, totalItems) {
    track.dataset.currentIndex = "0";
    updateCarouselCounter(totalItems, 1);

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

