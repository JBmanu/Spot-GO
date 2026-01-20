import { closeBottomSheet } from "../ui/bottomSheet";
import { initializeTimeRangeControl } from "./timeRange";
import { resetStatusFilter, setupStatusFilter, getActiveStatusFilters } from "./spotStatusFilter";

// --- STATO DEFAULT ---
const defaultFilters = {
    distanceKm: null,
    startTime: null,
    endTime: null,
    rating: 0,
    status: {
        visited: false,
        saved: false,
        mine: false
    }
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

    const MIN_DIST = 0.5; // km
    const MAX_DIST = 50;  // km

    function calculateLogDistance(percent) {
        if (parseInt(percent) === 100) return "unlimited";
        // Usiamo una funzione quadratica per dare più spazio ai valori bassi
        // Formula: min + (percentuale^2 * (max - min))
        const normalized = percent / 100;
        const value = MIN_DIST + (Math.pow(normalized, 2) * (MAX_DIST - MIN_DIST));
        
        return value < 5 ? value.toFixed(1) : Math.round(value);
    }

    function updateDistanceSlider(e) {
        const el = e.target || e;
        const percent = (el.value - el.min) / (el.max - el.min) * 100;
        
        const realDistance = calculateLogDistance(el.value);
        
        el.style.background = `
            linear-gradient(
                to right,
                rgb(3, 123, 252) 0%,
                rgb(3, 123, 252) ${percent}%,
                #e5e7eb ${percent}%,
                #e5e7eb 100%
            )
        `;
        
        if (distanceValueSpan) {
            distanceValueSpan.textContent = realDistance === 'unlimited'
                ? 'Illimitata'
                : `${realDistance} km`;
        }
        
        el.dataset.realValue = realDistance === "unlimited"
            ? null
            : parseFloat(realDistance);
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
        distanceSlider.value = 100;
        distanceSlider.dataset.realValue = defaultFilters.distanceKm;
        updateDistanceSlider(distanceSlider);

        // fascia oraria
        startH.value = '00';
        startM.value = '00';
        endH.value = '23';
        endM.value = '59';

        // rating
        updateStars(defaultFilters.rating);

        updateFiltersBadge(buttonEl, 0);
    }

    resetBtn.addEventListener('click', resetFiltersUI);

    // STATO
    const statusContainer = filtersEl.querySelector("#filter-status-container");
    initializeStatusFilters(statusContainer);

    // CANCEL / APPLY
    const cancelBtn = filtersEl.querySelector('#filters-cancel');
    const applyBtn = filtersEl.querySelector('#filters-apply');

    cancelBtn.addEventListener('click', () => {
        closeBottomSheet(bottomSheetEl, overlayEl);
    });

    applyBtn.addEventListener('click', () => {
        const statusFilters = statusContainer 
            ? getActiveStatusFilters(statusContainer) 
            : { visited: false, saved: false, mine: false };

        const filters = {
            distanceKm: Number(distanceSlider.dataset.realValue),
            startTime: readTime(startH, startM),
            endTime: readTime(endH, endM),
            rating: currentRating,
            status: statusFilters
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

function initializeStatusFilters(statusContainer) {
    if (!statusContainer) return;

    // Reset visivo e dello stato interno all'avvio
    resetStatusFilter(statusContainer);

    // Configurazione dei listener
    setupStatusFilter(statusContainer, {
        onChange: () => {}
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

    if (current.distanceKm !== defaults.distanceKm) count++;
    if (current.rating !== defaults.rating) count++;
    if (current.startTime !== defaults.startTime) count++;
    if (current.endTime !== defaults.endTime) count++;

    return count;
}
