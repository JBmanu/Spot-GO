import { closeBottomSheet } from "../ui/bottomSheet";
import { initializeStarRating, getSelectedStarRating, resetStarRating } from "./starRating";
import { createStarRating } from "../createComponent";

// --- STATO DEFAULT ---
const defaultFilters = {
    openNow: false,
    openDateTime: null,
    distance: 15000,
    rating: 3,
    status: []
};

export async function initializeBottomSheetFilters({ filtersEl, bottomSheetEl, overlayEl, buttonEl, onFiltersApplied }) {
    const distanceSlider = filtersEl.querySelector('.distance-range');
    const distanceValueSpan = filtersEl.querySelector('.distance-value');

    function updateDistanceSlider(el) {
        const target = el.target || el; 
        const value = (target.value - target.min) / (target.max - target.min) * 100;
        
        target.style.background = 
            `linear-gradient(to right, rgb(3, 123, 252) 0%, rgb(3, 123, 252) ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`;
        
        if (distanceValueSpan) {
            distanceValueSpan.textContent = `${target.value} km`;
        }
    }

    distanceSlider.removeEventListener('input', updateDistanceSlider);
    distanceSlider.addEventListener('input', updateDistanceSlider);

    updateDistanceSlider(distanceSlider);

    // --- ELEMENTI DEL DOM ---
    // const openNowCheckbox = filtersEl.querySelector('input[name="open_now"]');
    // const dateInput = filtersEl.querySelector('.input-date');
    // const timeInput = filtersEl.querySelector('.input-time');
    // const distanceRange = filtersEl.querySelector('.distance-range');
    // const distanceValueSpan = filtersEl.querySelector('.distance-value');
    // const starRatingContainer = filtersEl.querySelector('.rating-container');
    // const statusButtons = filtersEl.querySelectorAll('.filter-button-status');
    // const resetBtn = filtersEl.querySelector('.filters-reset-btn');
    // const cancelBtn = filtersEl.querySelector('.filter-button-footer:nth-child(1)');
    // const applyBtn = filtersEl.querySelector('.filter-button-footer:nth-child(2)');

    // // --- UTILITY ---
    // const getSelectedStatus = () => {
    //     const selected = [];
    //     statusButtons.forEach(btn => {
    //         if (btn.classList.contains('active')) {
    //             selected.push(btn.dataset.value);
    //         }
    //     });
    //     return selected;
    // };

    // // Star Rating
    // const starRatingEl = await createStarRating();
    // starRatingContainer.appendChild(starRatingEl);

    // const resetFiltersUI = () => {
    //     // "Aperto ora"
    //     openNowCheckbox.checked = defaultFilters.openNow;
    //     // Data e ora
    //     dateInput.value = '';
    //     timeInput.value = '';
    //     // Distanza
    //     distanceRange.value = defaultFilters.distance / 1000;
    //     distanceValueSpan.textContent = `${defaultFilters.distance / 1000} km`;
    //     // Rating
    //     resetStarRating(starRatingEl, defaultFilters);
    //     // Stato
    //     statusButtons.forEach(btn => btn.classList.remove('active'));

    //     // Reset contatore filtri attivi
    //     updateFiltersBadge(buttonEl, 0);
    // };

    // const readFilters = () => {
    //     // "Aperto ora"
    //     const openNow = openNowCheckbox.checked;

    //     // "Aperto il" + "alle"
    //     let openDateTime = null;
    //     if (dateInput.value) {
    //         const dateStr = dateInput.value;
    //         const timeStr = timeInput.value || "00:00";
    //         openDateTime = new Date(`${dateStr}T${timeStr}`);
    //     }

    //     // Distanza (in metri)
    //     const distanceKm = parseFloat(distanceRange.value);
    //     const distance = distanceKm * 1000;

    //     // Rating
    //     const rating = getSelectedStarRating(starRatingEl);

    //     // Stato
    //     const status = getSelectedStatus();

    //     // Mappa da inviare al DB
    //     const filtersMap = {
    //         openNow,
    //         openDateTime,
    //         distance,
    //         rating,
    //         status
    //     };

    //     return filtersMap;
    // };

    // // --- EVENT LISTENERS ---
    // // Toggle distanza display
    // distanceRange.addEventListener('input', () => {
    //     distanceValueSpan.textContent = `${distanceRange.value} km`;
    // });

    // // Toggle status buttons
    // statusButtons.forEach(btn => {
    //     btn.addEventListener('click', () => {
    //         btn.classList.toggle('active');
    //     });
    // });

    // // Reset filtri
    // resetBtn.addEventListener('click', () => {
    //     resetFiltersUI();
    // });

    // // Annulla
    // cancelBtn.addEventListener('click', () => {
    //     closeBottomSheet(bottomSheetEl, overlayEl);
    // });

    // // Applica filtri
    // applyBtn.addEventListener('click', () => {
    //     const filtersToApply = readFilters();
    //     closeBottomSheet(bottomSheetEl, overlayEl);
    //     updateFiltersBadge(buttonEl, countActiveFilters(filtersToApply, defaultFilters));
    //     onFiltersApplied(filtersToApply);
    // });

    // // Inizializza UI con valori di default
    // resetFiltersUI();
};

function updateStars(stars, rating) {
    stars.forEach(btn => {
        const value = parseInt(btn.dataset.value);
        btn.classList.toggle("active", value <= rating);
    });
}

function updateFiltersBadge(buttonEl, activeCount) {
    const badge = buttonEl.querySelector("#active-filters-badge");

    if (!badge) return;

    if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}

function countActiveFilters(current, defaults) {
    let count = 0;

    // Aperto ora
    if (current.openNow !== defaults.openNow) {
        count++;
    }

    // Data / ora
    if (current.openDateTime !== defaults.openDateTime) {
        count++;
    }

    // Distanza
    if (current.distance !== defaults.distance) {
        count++;
    }

    // Rating
    if (current.rating !== defaults.rating) {
        count++;
    }

    // Stato (multi-select)
    if (Array.isArray(current.status) && current.status.length !== defaults.status.length) {
        count++;
    }

    return count;
}

