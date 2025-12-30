import { initializeCarousel } from "../ui/carousel.js";
import { initializeBookmarks, syncAllBookmarks } from "../ui/bookmark.js";
import { initializeSpotClickHandlers } from "../pages/spotDetail.js";
import { getFirstUser, getSavedSpots, getSpots, getCategoryNameIt } from "../query.js";

export async function loadViewAllSaved(fromPage = "homepage") {
    try {
        const response = await fetch("../html/homepage-pages/view-all/view-all-saved.html");
        if (!response.ok) return;
        const main = document.getElementById("main");
        const headerLeftLogo = document.querySelector(".header-left-logo");
        const headerLogoText = document.getElementById("header-logo-text");
        const headerTitle = document.getElementById("header-title");
        if (!main) return;
        main.innerHTML = await response.text();
        requestAnimationFrame(() => {
            main.classList.add("view-all-saved-enter");
        });
        if (headerLeftLogo) {
            headerLeftLogo.innerHTML = `
        <button type="button" id="header-back-button" aria-label="Torna indietro" class="flex items-center justify-center w-10 h-10">
          <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
        </button>
      `;
        }
        if (headerLogoText) headerLogoText.style.display = "none";
        if (headerTitle) {
            headerTitle.textContent = "I tuoi Spot Salvati";
            headerTitle.classList.remove("hidden");
        }
        deactivateAllToolbarButtons();
        initializeCarousel(".vertical-carousel-track");
        initializeBookmarks();
        await populateViewAllSavedSpots();
        initializeSpotClickHandlers();
        initializeBookmarks();
        await syncAllBookmarks();
        const backButton = document.getElementById("header-back-button");
        if (backButton) {
            backButton.addEventListener("click", async () => {
                main.classList.remove("view-all-saved-enter");
                main.classList.add("view-all-saved-exit");
                await new Promise((resolve) => setTimeout(resolve, 300));
                main.classList.remove("view-all-saved-exit");
                if (fromPage === "profile") {
                    await goToProfile();
                } else {
                    await goToHomepage();
                }
            });
        }
        initializeViewAllSavedSearch();
    } catch (err) {
        console.error("Errore nel caricamento view-all-saved:", err);
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

async function populateViewAllSavedSpots() {
    try {
        const currentUser = await getFirstUser();
        if (!currentUser) return;
        const savedSpotRelations = await getSavedSpots(currentUser.id);
        const savedContainer = document.getElementById("view-all-saved-container");
        if (!savedContainer) return;
        if (!savedSpotRelations || savedSpotRelations.length === 0) {
            savedContainer.innerHTML =
                '<p class="text-center text-text_color/60 py-8">Nessuno spot salvato</p>';
            return;
        }
        const allSpots = await getSpots();
        const neededIds = savedSpotRelations.map((r) => r.idLuogo);
        const allCards = Array.from(savedContainer.querySelectorAll('[role="listitem"]'));
        if (allCards.length === 0) return;
        const accounted = new Set();
        allCards.forEach((card) => {
            const spotId = card.getAttribute("data-spot-id") || "";
            if (spotId && neededIds.includes(spotId)) {
                accounted.add(spotId);
            } else if (spotId && !neededIds.includes(spotId)) {
                card.setAttribute("data-spot-id", "");
                const titleEl = card.querySelector('[data-field="title"]');
                if (titleEl) titleEl.textContent = "";
                const imageEl = card.querySelector('[data-field="image"]');
                if (imageEl) imageEl.src = "";
                const distanceEl = card.querySelector('[data-field="distance"]');
                if (distanceEl) distanceEl.textContent = "";
                const categoryEl = card.querySelector('[data-field="category"]');
                if (categoryEl) categoryEl.textContent = "";
                const ratingEl = card.querySelector('[data-field="rating"]');
                if (ratingEl) ratingEl.textContent = "";
            }
        });
        let placeholderCards = allCards.filter((c) => !c.getAttribute("data-spot-id"));
        for (const idLuogo of neededIds) {
            if (accounted.has(idLuogo)) continue;
            const spot = allSpots.find((s) => s.id === idLuogo);
            if (!spot) continue;
            let cardToFill = placeholderCards.shift();
            if (!cardToFill) {
                const templateCard = allCards[0];
                if (!templateCard) continue;
                cardToFill = templateCard.cloneNode(true);
                savedContainer.appendChild(cardToFill);
                allCards.push(cardToFill);
            }
            cardToFill.setAttribute("data-spot-id", spot.id);
            const titleEl = cardToFill.querySelector('[data-field="title"]');
            if (titleEl) titleEl.textContent = spot.nome || "Spot";
            const imageEl = cardToFill.querySelector('[data-field="image"]');
            if (imageEl) {
                imageEl.src = spot.immagine || "";
                imageEl.alt = spot.nome || "Foto spot";
            }
            const distanceEl = cardToFill.querySelector('[data-field="distance"]');
            if (distanceEl)
                distanceEl.textContent = spot.distanza ? `${spot.distanza} m` : "0 m";
            const categoryEl = cardToFill.querySelector('[data-field="category"]');
            if (categoryEl && spot.idCategoria) {
                categoryEl.textContent = await getCategoryNameIt(spot.idCategoria);
            }
            const ratingEl = cardToFill.querySelector('[data-field="rating"]');
            if (ratingEl) ratingEl.textContent = spot.rating || "0";
            cardToFill.setAttribute(
                "data-category",
                (spot.idCategoria || "unknown").toLowerCase()
            );
            cardToFill.style.display = "";
            accounted.add(spot.id);
        }
        placeholderCards.forEach((pc) => (pc.style.display = "none"));
    } catch (error) {
        console.error("Errore nel popolare gli spot salvati view-all:", error);
    }
}

function initializeViewAllSavedSearch() {
    const searchInput = document.getElementById("view-all-saved-search");
    const keyboard = document.getElementById("view-all-saved-keyboard");
    const overlay = document.getElementById("view-all-saved-keyboard-overlay");
    if (!searchInput || !keyboard || !overlay) return;
    const track = document.querySelector("#view-all-saved-container");
    searchInput.addEventListener("focus", () => {
        keyboard.classList.add("keyboard-visible");
        overlay.classList.add("overlay-visible");
        keyboard.style.transform = "translateY(0)";
        overlay.style.transform = "translateY(0)";
        if (track && window.innerWidth <= 1024) {
            track.style.transform = "translateY(-320px)";
            track.style.transition =
                "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        }
    });
    searchInput.addEventListener("blur", () => {
        keyboard.classList.remove("keyboard-visible");
        overlay.classList.remove("overlay-visible");
        keyboard.style.transform = "translateY(100%)";
        overlay.style.transform = "translateY(100%)";
        searchInput.value = "";
        const spotCards = document.querySelectorAll(".view-all-saved-card");
        spotCards.forEach((card) => {
            const spotId = card.getAttribute("data-spot-id");
            card.style.display = spotId && spotId.trim() !== "" ? "" : "none";
            card.style.zIndex = "998";
        });
        if (track) {
            track.style.transform = "translateY(0)";
            track.style.transition =
                "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        }
    });
    const keyButtons = keyboard.querySelectorAll(".kb-key, .kb-space, .kb-backspace");
    const closeBtn = keyboard.querySelector(".kb-close");
    keyButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const key = button.dataset.key;
            if (key === "backspace") searchInput.value = searchInput.value.slice(0, -1);
            else if (key === " ") searchInput.value += " ";
            else searchInput.value += key.toLowerCase();
            searchInput.focus();
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        });
    });
    if (closeBtn) closeBtn.addEventListener("click", (e) => (e.preventDefault(), searchInput.blur()));
    overlay.addEventListener("click", (e) => (e.preventDefault(), searchInput.blur()));
    keyboard.addEventListener("mousedown", (e) => e.preventDefault());
    searchInput.addEventListener("input", () => {
        const searchQuery = searchInput.value.toLowerCase().trim();
        const spotCards = document.querySelectorAll(".view-all-saved-card");
        spotCards.forEach((card) => {
            const spotId = card.getAttribute("data-spot-id");
            if (!spotId || spotId.trim() === "") {
                card.style.display = "none";
                card.style.zIndex = "998";
                return;
            }
            const title = card.querySelector(".view-all-saved-title");
            const titleText = title ? title.textContent.toLowerCase() : "";
            if (searchQuery === "") {
                card.style.display = "";
                card.style.zIndex = "998";
            } else {
                const matches = titleText.includes(searchQuery);
                card.style.display = matches ? "" : "none";
                card.style.zIndex = matches ? "1001" : "998";
            }
        });
    });
}

async function goToHomepage() {
    const main = document.getElementById("main");
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");
    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
    }
    if (headerLogoText) headerLogoText.style.display = "";
    if (headerTitle) headerTitle.classList.add("hidden");
    const response = await fetch("../html/homepage.html");
    if (!response.ok) return;
    main.innerHTML = await response.text();
    const { initializeHomepageFilters } = await import("./homepage.js");
    await initializeHomepageFilters();
}

async function goToProfile() {
    const main = document.getElementById("main");
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");
    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
    }
    if (headerLogoText) headerLogoText.style.display = "none";
    if (headerTitle) {
        headerTitle.classList.remove("hidden");
        headerTitle.textContent = "Il mio profilo";
    }
    const response = await fetch("../html/profile.html");
    if (!response.ok) return;
    main.innerHTML = await response.text();
    const { loadProfileOverview } = await import("./profile.js");
    await loadProfileOverview();
}
