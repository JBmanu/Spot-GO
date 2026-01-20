import { closeBottomSheet } from "../ui/bottomSheet";
import { initializeStarRating, getSelectedStarRating, resetStarRating } from "./starRating";
import { createStarRating } from "../createComponent";
import { initializeTimeRangeControl } from "./timeRange";

// --- STATO DEFAULT ---
const defaultFilters = {
    distanceKm: 15,
    startTime: null,
    endTime: null,
    rating: 3
};

export async function initializeBottomSheetFilters({
    filtersEl,
    bottomSheetEl,
    overlayEl,
    buttonEl,
    onFiltersApplied
}) {
    // DISTANZA
    const distanceSlider = filtersEl.querySelector('.distance-range');
    const distanceValueSpan = filtersEl.querySelector('.distance-value');

    function updateDistanceSlider(e) {
        const target = e.target || e;
        const value =
            ((target.value - target.min) / (target.max - target.min)) * 100;

        target.style.background = `
            linear-gradient(
                to right,
                rgb(3, 123, 252) 0%,
                rgb(3, 123, 252) ${value}%,
                #e5e7eb ${value}%,
                #e5e7eb 100%
            )
        `;

        distanceValueSpan.textContent = `${target.value} km`;
    }

    distanceSlider.addEventListener('input', updateDistanceSlider);
    updateDistanceSlider(distanceSlider);

    // FASCIA ORARIA
    const timeRangeEl = filtersEl.querySelector('#filters-time-range');
    initializeTimeRangeControl(timeRangeEl);

    const startH = timeRangeEl.querySelector('#start-h');
    const startM = timeRangeEl.querySelector('#start-m');
    const endH = timeRangeEl.querySelector('#end-h');
    const endM = timeRangeEl.querySelector('#end-m');

    startH.value = '00';
    endH.value = '00';
    startM.value = '23';
    endM.value = '59';

    const readTime = (h, m) => {
        if (!h.value && !m.value) return null;
        const hh = h.value.padStart(2, '0');
        const mm = m.value.padStart(2, '0');
        return `${hh}:${mm}`;
    };

    // RATING
    const starButtons = filtersEl.querySelectorAll('.star-btn-filters');

    let currentRating = defaultFilters.rating;

    function updateStars(rating) {
        currentRating = rating;
        starButtons.forEach(btn => {
            const value = Number(btn.dataset.value);
            btn.classList.toggle('active', value <= rating);
        });
    }

    starButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            updateStars(Number(btn.dataset.value));
        });
    });

    updateStars(defaultFilters.rating);

    // RESET
    const resetBtn = filtersEl.querySelector('.filters-reset-btn');

    function resetFiltersUI() {
        // distanza
        distanceSlider.value = defaultFilters.distanceKm;
        updateDistanceSlider(distanceSlider);

        // fascia oraria
        startH.value = '';
        startM.value = '';
        endH.value = '';
        endM.value = '';

        // rating
        updateStars(defaultFilters.rating);

        updateFiltersBadge(buttonEl, 0);
    }

    resetBtn.addEventListener('click', resetFiltersUI);

    // CANCEL / APPLY
    const cancelBtn = filtersEl.querySelector('#filters-cancel');
    const applyBtn = filtersEl.querySelector('#filters-apply');

    cancelBtn.addEventListener('click', () => {
        closeBottomSheet(bottomSheetEl, overlayEl);
    });

    applyBtn.addEventListener('click', () => {
        const filters = {
            distanceKm: Number(distanceSlider.value),
            startTime: readTime(startH, startM),
            endTime: readTime(endH, endM),
            rating: currentRating
        };

        updateFiltersBadge(
            buttonEl,
            countActiveFilters(filters, defaultFilters)
        );

        closeBottomSheet(bottomSheetEl, overlayEl);
        onFiltersApplied(filters);
    });

    resetFiltersUI();
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

    if (current.distanceKm !== defaults.distanceKm) count++;
    if (current.rating !== defaults.rating) count++;
    if (current.startTime !== defaults.startTime) count++;
    if (current.endTime !== defaults.endTime) count++;

    return count;
}
