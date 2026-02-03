import {
    deletePolaroid,
    getCreatedSpots,
    getCurrentUser,
    getReviews,
    getSavedSpots,
    getVisitedSpots
} from "../database.js";
import {openAddPolaroidModal} from "./addPolaroid.js";
import {openPolaroidDetail} from "./polaroidDetail.js";
import {fetchFormattedUserPolaroids, fillPolaroidContent, getPolaroidTemplate} from "../common/polaroidCommon.js";
import {sharePolaroidModal} from "./sharePolaroid.js";
import {showConfirmModal} from "../ui/confirmModal.js";
import {currentUserLevel} from "../goals/db/userGoalsConnector.js";

const AVATAR_MAP = {
    "Luana": "Luana.svg",
    "Julio Manuel": "Manuel.svg",
    "Alessandro": "Ale.svg",
    "Teo": "Teo.svg",
    "DEFAULT": "default.svg"
};

let loadViewAllSaved;
let loadViewAllPolaroids;
let loadViewAllReviews;
let loadViewAllBadges;
let loadViewAllAddedSpots;

const profileDepsReady = Promise.all([
    import("./viewAllSaved.js").then((m) => {
        loadViewAllSaved = m.loadViewAllSaved;
    }),
    import("./viewAllPolaroids.js").then((m) => {
        loadViewAllPolaroids = m.loadViewAllPolaroids;
    }),
    import("./viewAllReviews.js").then((m) => {
        loadViewAllReviews = m.loadViewAllReviews;
    }),
    import("./viewAllBadges.js").then((m) => {
        loadViewAllBadges = m.loadViewAllBadges;
    }),
    import("./viewAllAddedSpots.js").then((m) => {
        loadViewAllAddedSpots = m.loadViewAllAddedSpots;
    }),
]).catch((err) => {
    console.error("Error loading profile dependencies:", err);
});

export async function loadProfileOverview(wrapper) {
    await profileDepsReady;

    if (!wrapper) return;

    const user = await getCurrentUser();
    await initializeProfileData(wrapper, user, "profile");
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

async function initializeProfileData(container, userData) {
    await profileDepsReady;

    if (!userData) return;

    updateProfileHeader(userData, container);

    await updateUserCounters(userData.username, container);

    setupProfileEventListeners(container, userData);

    await initializePolaroidCarousel(container, userData);
}

function updateProfileHeader(user, container) {
    const profileData = {
        name: user.username || "",
        username: user.username ? "@" + user.username : "",
        email: user.email || "",
        avatarSrc: `../assets/icons/login-signup/${AVATAR_MAP[user.username] || AVATAR_MAP.DEFAULT}`,
    };

    // Usa container.querySelector se è un container specifico, altrimenti document
    const querySelector = (selector) => {
        return container && container.querySelector
            ? container.querySelector(selector)
            : document.querySelector(selector);
    };

    const elements = {
        name: querySelector("#profile-name"),
        username: querySelector("#profile-username"),
        email: querySelector("#profile-email"),
        avatar: querySelector("#profile-avatar")
    };

    if (elements.name) elements.name.textContent = profileData.name;
    if (elements.username) elements.username.textContent = profileData.username;
    if (elements.email) elements.email.textContent = profileData.email;
    if (elements.avatar) elements.avatar.src = profileData.avatarSrc;

    const title = querySelector("#header-title");
    if (title) {
        title.classList.add("hidden");
    }
    const logoText = querySelector("#header-logo-text");
    if (logoText) logoText.style.display = "";
}

async function updateUserCounters(username, container) {
    try {
        const [saved, reviews, visited, created, userLevel] = await Promise.all([
            getSavedSpots(username),
            getReviews(username),
            getVisitedSpots(username),
            getCreatedSpots(username),
            currentUserLevel()
        ]);

        // Usa container.querySelector se è un container specifico, altrimenti document
        const querySelector = (selector) => {
            return container && container.querySelector
                ? container.querySelector(selector)
                : document.querySelector(selector);
        };

        const elements = {
            saved: querySelector("#saved-spots"),
            reviews: querySelector("#written-reviews"),
            visited: querySelector("#visited-spots"),
            created: querySelector("#created-spots"),
            level: querySelector("#explorer-level")
        };

        const cap = 200;
        const computeLevel = Math.trunc(userLevel / cap);
        updateProgressBar(container, cap, computeLevel, userLevel)

        if (elements.saved) elements.saved.textContent = saved.length;
        if (elements.reviews) elements.reviews.textContent = reviews.length;
        if (elements.visited) elements.visited.textContent = visited.length;
        if (elements.created) elements.created.textContent = created.length;
        if (elements.level) elements.level.textContent = computeLevel;

    } catch (error) {
        console.error("Error updating profile counters:", error);
    }
}

function updateProgressBar(container, cap, level, progress) {
    const experienceCard = container.querySelector(".profile-reward-card-large");
    const progressBarEl = experienceCard.querySelector("#profile-progress-bar");
    const percentEl = experienceCard.querySelector("#progress-bar-label");

    const remainingExp = progress - (level * cap)
    const percent = Math.trunc(Math.min(100, (remainingExp / cap) * 100));
    percentEl.textContent = `${percent}% al prossimo livello!`;
    progressBarEl.style.width = `${percent}%`;
}


function setupProfileEventListeners(container, userData) {
    const savedSpotsButton = container.querySelector("#profile-saved-spots-button");
    if (savedSpotsButton) {
        if (savedSpotsButton.dataset.bound !== "true") {
            savedSpotsButton.dataset.bound = "true";
            savedSpotsButton.addEventListener("click", handleSavedSpotsClick);
        }
    }
    // Silenziosamente salta se non trovato (potrebbe essere un overlay read-only)

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
            openAlbumButton.addEventListener("click", e => handleOpenAlbumClick(e, userData));
        }
    }

    const reviewsButton = container.querySelector("#profile-reviews-button");
    if (reviewsButton) {
        if (reviewsButton.dataset.bound !== "true") {
            reviewsButton.dataset.bound = "true";
            reviewsButton.addEventListener("click", handleReviewsClick);
        }
    }

    const visitedSpotsButton = container.querySelector("#profile-visited-spots-button");
    if (visitedSpotsButton) {
        if (visitedSpotsButton.dataset.bound !== "true") {
            visitedSpotsButton.dataset.bound = "true";
            visitedSpotsButton.addEventListener("click", handleBadgesClick);
        }
    }

    const createdSpotsButton = container.querySelector("#profile-created-spots-button");
    if (createdSpotsButton) {
        if (createdSpotsButton.dataset.bound !== "true") {
            createdSpotsButton.dataset.bound = "true";
            createdSpotsButton.addEventListener("click", handleCreatedSpotsClick);
        }
    }

    if (container.dataset.liveUpdatesBound !== "true") {
        container.dataset.liveUpdatesBound = "true";

        document.addEventListener("polaroid:added", () => {
            initializePolaroidCarousel(document);
            getCurrentUser().then(user => {
                if (user) updateUserCounters(user.username);
            });
        });

        document.addEventListener("polaroid:deleted", () => {
            initializePolaroidCarousel(document);
            getCurrentUser().then(user => {
                if (user) updateUserCounters(user.username);
            });
        });

        document.addEventListener("bookmark:changed", () => {
            getCurrentUser().then(user => {
                if (user) updateUserCounters(user.username);
            });
        });

        document.addEventListener("review:changed", () => {
            getCurrentUser().then(user => {
                if (user) updateUserCounters(user.username);
            });
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

async function handleOpenAlbumClick(e, userData) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof loadViewAllPolaroids !== "function") {
        console.error("loadViewAllPolaroids is not available");
        return;
    }
    await loadViewAllPolaroids(userData);
}

async function handleReviewsClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof loadViewAllReviews !== "function") {
        console.error("loadViewAllReviews is not available");
        return;
    }
    await loadViewAllReviews("profile");
}

async function handleBadgesClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof loadViewAllBadges !== "function") {
        console.error("loadViewAllBadges is not available");
        return;
    }
    await loadViewAllBadges("profile");
}

async function handleCreatedSpotsClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof loadViewAllCreatedSpots !== "function" && typeof loadViewAllAddedSpots !== "function") {
        console.error("loadViewAllAddedSpots is not available");
        return;
    }
    await loadViewAllAddedSpots("profile");
}

async function initializePolaroidCarousel(container, userData) {
    // Se container è il document, usa getElementById globale
    const carouselContainer = container.nodeType === 9
        ? container.getElementById("polaroid-carousel-container")
        : container.querySelector("#polaroid-carousel-container");

    if (!carouselContainer) return;

    // Determina se siamo dentro un overlay (per il back button)
    const isOverlay = container && container.nodeType !== 9 && container.dataset?.overlayView;
    const returnViewKey = isOverlay ? container.dataset.overlayView : null;

    try {
        const polaroidData = await fetchFormattedUserPolaroids(userData);

        if (!polaroidData || polaroidData.length === 0) {
            renderEmptyCarousel(carouselContainer);
            return;
        }

        const template = await getPolaroidTemplate();
        if (!template) {
            console.error("Polaroid template missing");
            return;
        }

        renderCarouselItems(carouselContainer, polaroidData, template, returnViewKey);

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

    items.forEach(itemData => {
        const clone = template.content.cloneNode(true);
        fillPolaroidContent(clone, itemData);

        const polaroidEl = clone.querySelector('.profile-polaroid');
        if (polaroidEl) {
            polaroidEl.addEventListener('click', (e) => {
                if (e.target.closest('.polaroid-menu-wrapper') || e.target.closest('.polaroid-menu-dropdown') || e.target.closest('.profile-polaroid-menu')) return;
                e.preventDefault();
                openPolaroidDetail(itemData);
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

                        openPolaroidDetail(itemData, {startInEditMode: true});
                    });
                }

                const shareBtn = menuDropdown.querySelector('[data-action="share-polaroid"]');
                if (shareBtn) {
                    shareBtn.addEventListener('click', async (e) => {
                        console.log("Share action clicked");
                        e.preventDefault();
                        e.stopPropagation();

                        menuDropdown.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                        menuDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
                        if (polaroidEl) polaroidEl.style.zIndex = "";

                        await sharePolaroidModal(itemData);
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

                        showDeleteConfirmation(itemData);
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

async function showDeleteConfirmation(item) {
    const res = await showConfirmModal("Elimina Polaroid", "Sei sicuro di voler eliminare questa polaroid? L'azione è irreversibile.");
    if (res) {
        try {
            await deletePolaroid(item.id);
            closeModal();
            initializePolaroidCarousel(document);

            const user = await getCurrentUser();
            if (user) updateUserCounters(user.username);
        } catch (err) {
            console.error("Error deleting polaroid:", err);
            alert("Errore durante l'eliminazione.");
            closeModal();
        }
    }
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

    track.addEventListener('scroll', () => window.requestAnimationFrame(updateCounterOnScroll), {passive: true});

    setTimeout(updateCounterOnScroll, 100);
}

function updateCarouselCounter(total, current) {
    const counter = document.getElementById("polaroid-carousel-counter");
    if (counter) {
        counter.textContent = total > 0 ? `${current}/${total}` : "0/0";
    }
}

/**
 * Read only profile data init. Some element are disabled or removed.
 */
export async function initializeReadOnlyProfileData(modalElement, userData) {
    if (!modalElement) return;

    // Rimuovi elementi non necessari in read-only
    const classItemToRemove = [".profile-data-section", ".profile-diary-add-btn"];
    classItemToRemove.forEach(className => {
        const el = modalElement.querySelector(className);
        if (el) el.remove();
    });

    // Disabilita i bottoni di azione (anziché rimuoverli)
    const buttonsToDisable = [
        "#profile-saved-spots-button",
        "#profile-reviews-button",
        "#profile-visited-spots-button",
        "#profile-created-spots-button",
    ];

    buttonsToDisable.forEach(selector => {
        const btn = modalElement.querySelector(selector);
        if (btn) {
            btn.disabled = true;
            btn.setAttribute("aria-disabled", "true");
            btn.style.cursor = "not-allowed";
            btn.style.pointerEvents = "none";
        }
    });

    const profileBodySection = modalElement.querySelector(".profile-body-section");
    if (profileBodySection) {
        profileBodySection.style.display = "flex";
        profileBodySection.style.justifyContent = "center";
    }

    modalElement.classList.add("profile-overview-modal-content");
    await initializeProfileData(modalElement, userData);

    // Rimuovi menu buttons dalle polaroid (non cliccabili in read-only)
    const menuButtons = modalElement.querySelectorAll(".polaroid-menu-wrapper");
    menuButtons.forEach(btn => btn.remove());
}
