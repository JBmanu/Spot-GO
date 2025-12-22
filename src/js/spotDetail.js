import {initializeBookmarks} from "./bookmark.js";
import { getSpots, getCategoryNameIt, getSavedSpots, getFirstUser } from "./query.js";

let spottedData = {};
let currentSpotId = null;

async function populateSpotCards() {
    try {
        const spots = await getSpots();
        const spotCards = document.querySelectorAll('#home-nearby-container [role="listitem"][data-spot-id=""]');

        for (let index = 0; index < spotCards.length; index++) {
            const card = spotCards[index];

            if (index < spots.length) {
                const spot = spots[index];
                card.setAttribute('data-spot-id', spot.id);

                const titleEl = card.querySelector('[data-field="title"]');
                if (titleEl) titleEl.textContent = spot.nome || "Spot";

                const imageEl = card.querySelector('[data-field="image"]');
                if (imageEl && spot.immagine) {
                    imageEl.src = spot.immagine;
                }

                const categoryEl = card.querySelector('[data-field="category"]');
                if (categoryEl && spot.idCategoria) {

                    const categoryNameIt = await getCategoryNameIt(spot.idCategoria);
                    categoryEl.textContent = categoryNameIt;
                }

                card.setAttribute('data-category', (spot.idCategoria || 'unknown').toLowerCase());
                card.style.display = '';
            } else {
                // La card non ha dati, nascondila
                card.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Errore nel popolare le card degli spot:", error);
    }
}

async function populateSavedSpots() {
    try {
        // Recupera l'utente attuale
        const currentUser = await getFirstUser();
        if (!currentUser) {
            console.error("Utente non trovato");
            return;
        }

        // Recupera gli spot salvati dell'utente
        const savedSpotRelations = await getSavedSpots(currentUser.id);

        const savedContainer = document.getElementById('home-saved-container');
        const emptyStateBanner = document.getElementById('saved-empty-state');

        if (!savedContainer) return;

        // Se non ci sono spot salvati, mostra il banner e nascondi il carosello
        if (!savedSpotRelations || savedSpotRelations.length === 0) {
            savedContainer.parentElement.style.display = 'none'; // Nascondi il carosello
            if (emptyStateBanner) {
                emptyStateBanner.style.display = 'block'; // Mostra il banner
            }
            return;
        }

        // Se ci sono spot salvati, mostra il carosello e nascondi il banner
        savedContainer.parentElement.style.display = 'block';
        if (emptyStateBanner) {
            emptyStateBanner.style.display = 'none';
        }

        // Recupera tutti gli spot
        const allSpots = await getSpots();


        // Ottieni le card placeholder
        const placeholderCards = savedContainer.querySelectorAll('[role="listitem"][data-spot-id=""]');

        let cardIndex = 0;
        for (const savedRelation of savedSpotRelations) {
            // Trova lo spot corrispondente
            const spot = allSpots.find(s => s.id === savedRelation.idLuogo);
            if (!spot) continue;

            // Se abbiamo ancora placeholder, riempili
            if (cardIndex < placeholderCards.length) {
                const card = placeholderCards[cardIndex];

                card.setAttribute('data-spot-id', spot.id);

                const titleEl = card.querySelector('[data-field="title"]');
                if (titleEl) titleEl.textContent = spot.nome || "Spot";

                const imageEl = card.querySelector('[data-field="image"]');
                if (imageEl && spot.immagine) {
                    imageEl.src = spot.immagine;
                }

                card.setAttribute('data-category', (spot.idCategoria || 'unknown').toLowerCase());
                card.style.display = ''; // Mostra la card

                cardIndex++;
            }
        }

        // Nascondi i placeholder non usati
        for (let i = cardIndex; i < placeholderCards.length; i++) {
            placeholderCards[i].style.display = 'none';
        }
    } catch (error) {
        console.error("Errore nel popolare gli spot salvati:", error);
    }
}

function initializeSpotClickHandlers() {
    const spotCards = document.querySelectorAll('[role="listitem"][data-spot-id]');

    spotCards.forEach(card => {
        card.addEventListener('click', async (e) => {

            if (e.target.closest('[data-bookmark-button]')) {
                return;
            }

            const spotId = card.getAttribute('data-spot-id');
            if (spotId && spotId !== '') {
                await loadSpotDetail(spotId);
            }
        });
    });
}

async function loadSpotDetail(spotId) {
    try {
        currentSpotId = spotId;

        const spotData = await getSpotById(spotId);
        if (!spotData) {
            console.error('Spot non trovato');
            return;
        }

        const response = await fetch("../html/spot-detail.html");
        if (!response.ok) return;

        const html = await response.text();
        const main = document.getElementById("main");
        const headerLeftLogo = document.querySelector(".header-left-logo");
        const headerLogoText = document.getElementById("header-logo-text");
        const headerTitle = document.getElementById("header-title");

        if (!main) return;

        main.innerHTML = html;

        requestAnimationFrame(() => {
            main.classList.add("spot-detail-enter");
        });

        if (headerLeftLogo) {
            headerLeftLogo.innerHTML = `<button type="button" id="header-back-button" aria-label="Torna indietro" class="flex items-center justify-center w-10 h-10">
                <img src="../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
            </button>`;
        }
        if (headerLogoText) headerLogoText.style.display = "none";
        if (headerTitle) {
            headerTitle.textContent = spotData.nome || "Dettaglio Spot";
            headerTitle.classList.remove("hidden");
        }

        populateSpotDetail(spotData);

        initializeSpotDetailHandlers();

        deactivateAllToolbarButtons();

    } catch (err) {
        console.error("Errore nel caricamento dettaglio spot:", err);
    }
}

async function getSpotById(spotId) {
    try {
        const spots = await getSpots();
        const spot = spots.find(s => s.id === spotId);
        return spot || null;
    } catch (error) {
        console.error("Errore nel recupero dello spot:", error);
        return null;
    }
}

function populateSpotDetail(spotData) {
    const mainImage = document.getElementById("spot-detail-main-image");
    if (mainImage && spotData.immagine) {
        mainImage.src = spotData.immagine;
        mainImage.alt = spotData.nome;
    }

    const titleEl = document.getElementById("spot-detail-title");
    if (titleEl) {
        titleEl.textContent = spotData.nome || "Spot";
    }

    const ratingEl = document.getElementById("spot-detail-rating-value");
    if (ratingEl) {
        ratingEl.textContent = "4.5";
    }

    const categoryEl = document.getElementById("spot-detail-category");
    if (categoryEl && spotData.idCategoria) {
        // Mostra il nome italiano della categoria in modo asincrono
        getCategoryNameIt(spotData.idCategoria).then(categoryNameIt => {
            categoryEl.textContent = categoryNameIt;
        });
    }

    const distanceEl = document.getElementById("spot-detail-distance");
    if (distanceEl) {
        distanceEl.textContent = "0 m";
    }

    const descriptionEl = document.getElementById("spot-detail-description");
    if (descriptionEl) {
        descriptionEl.textContent = spotData.descrizione || "Nessuna descrizione disponibile";
    }

    // Indirizzo
    const addressEl = document.getElementById("spot-detail-address");
    if (addressEl && spotData.indirizzo) {
        addressEl.textContent = spotData.indirizzo;
    }

    // Orari
    const hoursEl = document.getElementById("spot-detail-hours");
    if (hoursEl && spotData.orari && spotData.orari.length > 0) {
        const orariFormatted = spotData.orari
            .map(o => `${o.inizio} - ${o.fine}`)
            .join(" | ");
        hoursEl.textContent = orariFormatted;
    }

    // Costo
    const costEl = document.getElementById("spot-detail-cost");
    if (costEl && spotData.costo && spotData.costo.length > 0) {
        const costoFormatted = spotData.costo
            .map(c => c.prezzo === 0 ? "Gratuito" : `${c.tipo}: €${c.prezzo}`)
            .join(" | ");
        costEl.textContent = costoFormatted;
    }

    spottedData = spotData;

    updateHeaderBookmark();
}

function initializeSpotDetailHandlers() {
    initializeMissionsCount();

    initializeReviewsCarousel();

    const backButton = document.getElementById("header-back-button") || document.getElementById("spot-detail-back-button");
    if (backButton) {
        backButton.addEventListener("click", async () => {
            const main = document.getElementById("main");
            if (main) {
                main.classList.remove("spot-detail-enter");
                main.classList.add("spot-detail-exit");

                await new Promise(resolve => setTimeout(resolve, 300));

                main.classList.remove("spot-detail-exit");

                await goToHomepage();
            }
        });
    }

    const bookmarkButton = document.getElementById("spot-detail-bookmark-button");
    if (bookmarkButton) {
        bookmarkButton.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSpotBookmark(bookmarkButton);
            updateHeaderBookmark();
        });
    }

    const headerBookmarkButton = document.getElementById("header-bookmark-button");
    if (headerBookmarkButton) {
        headerBookmarkButton.style.display = "block";
        headerBookmarkButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const detailButton = document.getElementById("spot-detail-bookmark-button");
            if (detailButton) {
                detailButton.click();
            }
        });
    }

    const visitButton = document.getElementById("spot-detail-visit-button");
    if (visitButton) {
        visitButton.addEventListener("click", () => {
            markSpotAsVisited();
        });
    }

    const shareButton = document.getElementById("spot-detail-share-button");
    if (shareButton) {
        shareButton.addEventListener("click", () => {
            shareSpot();
        });
    }

    const missionsToggleButton = document.getElementById("spot-missions-toggle");
    if (missionsToggleButton) {
        missionsToggleButton.addEventListener("click", () => {
            toggleMissions(missionsToggleButton);
        });
    }

    initializeBookmarks();
}

function toggleSpotBookmark(button) {
    const isSaved = button.dataset.saved === 'true';
    const icon = button.querySelector('.bookmark-icon');

    if (isSaved) {
        button.dataset.saved = 'false';
        icon.src = "../assets/icons/homepage/BookmarkEmpty.svg";
        button.setAttribute('aria-label', 'Aggiungi ai salvati');
    } else {
        button.dataset.saved = 'true';
        icon.src = "../assets/icons/homepage/Bookmark.svg";
        button.setAttribute('aria-label', 'Rimuovi dai salvati');
    }
}

function updateHeaderBookmark() {
    const detailButton = document.getElementById("spot-detail-bookmark-button");
    const headerButton = document.getElementById("header-bookmark-button");

    if (detailButton && headerButton) {
        const isSaved = detailButton.dataset.saved === 'true';
        const headerIcon = headerButton.querySelector('.bookmark-icon');

        if (isSaved) {
            headerIcon.src = "../assets/icons/homepage/Bookmark.svg";
            headerButton.setAttribute('aria-label', 'Rimuovi dai salvati');
        } else {
            headerIcon.src = "../assets/icons/homepage/BookmarkEmpty.svg";
            headerButton.setAttribute('aria-label', 'Aggiungi ai salvati');
        }
    }
}

function toggleMissions(button) {
    const missionsDetails = document.getElementById("spot-missions-details");
    if (missionsDetails) {
        const isHidden = missionsDetails.style.display === 'none';

        if (isHidden) {
            missionsDetails.style.display = 'block';
            button.classList.add('expanded');
        } else {
            missionsDetails.style.display = 'none';
            button.classList.remove('expanded');
        }
    }
}

function markSpotAsVisited() {
    const visitButton = document.getElementById("spot-detail-visit-button");
    if (visitButton) {
        visitButton.classList.add("visited");
        visitButton.textContent = "✓ Visitato";
        // Qui andrebbe aggiunto un salvataggio nel database
    }
}


function shareSpot() {
    if (navigator.share && spottedData.nome) {
        navigator.share({
            title: spottedData.nome,
            text: `Dai un'occhiata a questo spot: ${spottedData.nome}`,
            url: window.location.href
        }).catch(err => console.log('Errore nella condivisione:', err));
    } else {
        alert('Condivisione non disponibile su questo dispositivo');
    }
}


function deactivateAllToolbarButtons() {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;

    toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
        btn.classList.remove("active");
        const text = btn.querySelector("span");
        const icon = btn.querySelector("[data-role='icon']");
        if (text) {
            text.classList.remove("font-bold");
            text.classList.add("font-normal");
        }
        if (icon) {
            icon.classList.remove("scale-125");
        }
    });
}


async function goToHomepage() {
    const main = document.getElementById("main");
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `<img src="../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
    }
    if (headerLogoText) headerLogoText.style.display = "";
    if (headerTitle) headerTitle.classList.add("hidden");

    try {
        const response = await fetch("../html/homepage.html");
        if (!response.ok) return;

        const html = await response.text();
        main.innerHTML = html;

        const {initializeHomepageFilters} = await import("./homepage.js");
        await initializeHomepageFilters();


        const toolbar = document.querySelector(".app-toolbar");
        if (toolbar) {
            toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
                const section = btn.dataset.section;
                const isActive = section === "homepage";
                btn.classList.toggle("active", isActive);
                const text = btn.querySelector("span");
                const icon = btn.querySelector("[data-role='icon']");
                if (text) {
                    text.classList.toggle("font-bold", isActive);
                    text.classList.toggle("font-normal", !isActive);
                }
                if (icon) {
                    icon.classList.toggle("scale-125", isActive);
                }
            });
        }
    } catch (err) {
        console.error("Errore nel caricamento homepage:", err);
    }
}

function initializeReviewsCarousel() {
    const carouselWrapper = document.querySelector(".spot-reviews-carousel-wrapper");
    if (!carouselWrapper) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    carouselWrapper.addEventListener("mousedown", (e) => {
        isDown = true;
        carouselWrapper.classList.add("is-dragging");
        startX = e.pageX - carouselWrapper.offsetLeft;
        scrollLeft = carouselWrapper.scrollLeft;
    });

    carouselWrapper.addEventListener("mouseleave", () => {
        isDown = false;
        carouselWrapper.classList.remove("is-dragging");
    });

    carouselWrapper.addEventListener("mouseup", () => {
        isDown = false;
        carouselWrapper.classList.remove("is-dragging");
    });

    carouselWrapper.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carouselWrapper.offsetLeft;
        const walk = x - startX;
        carouselWrapper.scrollLeft = scrollLeft - walk;
    });

    carouselWrapper.addEventListener("mouseenter", () => {
        carouselWrapper.style.cursor = "grab";
    });

    carouselWrapper.addEventListener("mouseleave", () => {
        carouselWrapper.style.cursor = "auto";
    });

    carouselWrapper.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX - carouselWrapper.offsetLeft;
        scrollLeft = carouselWrapper.scrollLeft;
    });

    carouselWrapper.addEventListener("touchmove", (e) => {
        const x = e.touches[0].clientX - carouselWrapper.offsetLeft;
        const walk = x - startX;
        carouselWrapper.scrollLeft = scrollLeft - walk;
    });
}

function completeMission(missionId) {
    const missionBanner = document.querySelector(`.mission-banner[data-mission-id="${missionId}"]`);
    if (!missionBanner) {
        console.warn(`Missione con ID ${missionId} non trovata`);
        return;
    }

    if (!missionBanner.classList.contains('completed')) {
        missionBanner.classList.add('completed');
        console.log(`Missione ${missionId} completata`);

        updateMissionsCount();
    }
}

function updateMissionsCount() {
    const missionsCompletedElement = document.getElementById('spot-missions-completed');
    const missionsTotalElement = document.getElementById('spot-missions-total');

    if (missionsCompletedElement && missionsTotalElement) {

        const completedCount = document.querySelectorAll('.mission-banner.completed').length;

        const totalCount = document.querySelectorAll('.mission-banner').length;

        missionsCompletedElement.textContent = completedCount;
        missionsTotalElement.textContent = totalCount;
    }
}

function initializeMissionsCount() {
    updateMissionsCount();
}

export {
    initializeSpotClickHandlers,
    populateSpotCards,
    populateSavedSpots,
    loadSpotDetail,
    getSpotById,
    completeMission,
    updateMissionsCount
};

