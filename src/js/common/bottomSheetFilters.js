import { closeBottomSheet } from "../ui/bottomSheet";
import { initializeTimeRangeControl } from "./timeRange";
import { 
    resetStatusFilter,
    setupStatusFilter,
    getActiveStatusFilters,
    getStatusState,
    mapping
} from "./spotStatusFilter";

// --- STATO DEFAULT ---
const defaultFilters = {
    distanceKm: NaN,
    startTime: '00:00',
    endTime: '23:59',
    rating: 0,
    status: {
        visited: false,
        saved: false,
        mine: false
    }
};

// --- STATO ATTIVO ---
let activeFilters = defaultFilters;

export async function initializeBottomSheetFilters({
    filtersEl,
    bottomSheetEl,
    overlayEl,
    buttonEl,
    onFiltersApplied
}) {
    let statusContainer;
    let currentRating = null;
    const cancelBtn = filtersEl.querySelector('#filters-cancel');
    const applyBtn = filtersEl.querySelector('#filters-apply');

    function toggleApplyFiltersButton() {
        const currentFilters = readFilters();
        const disabled = countActiveFilters(currentFilters, activeFilters) == 0;

        applyBtn.disabled = disabled;
        applyBtn.classList.toggle("opacity-50", disabled);
        applyBtn.classList.toggle("cursor-not-allowed", disabled);
    }

    const readTime = (h, m) => {
        if (!h.value && !m.value) return null;
        const hh = h.value.padStart(2, '0');
        const mm = m.value.padStart(2, '0');
        return `${hh}:${mm}`;
    };

    filtersEl.onOpen = () => {
        toggleApplyFiltersButton();
    }

    // FASCIA ORARIA
    const timeRangeEl = filtersEl.querySelector('#filters-time-range');
    initializeTimeRangeControl(timeRangeEl, toggleApplyFiltersButton);

    const startH = timeRangeEl.querySelector('#start-h');
    const startM = timeRangeEl.querySelector('#start-m');
    const endH = timeRangeEl.querySelector('#end-h');
    const endM = timeRangeEl.querySelector('#end-m');

    startH.value = '00';
    endH.value = '00';
    startM.value = '23';
    endM.value = '59';

    // STATO
    statusContainer = filtersEl.querySelector("#filter-status-container");
    initializeStatusFilters(statusContainer);

    function initializeStatusFilters(statusContainer) {
        if (!statusContainer) return;

        // Reset visivo e dello stato interno all'avvio
        resetStatusFilter(statusContainer);

        // Configurazione dei listener
        setupStatusFilter(statusContainer, {
            onChange: toggleApplyFiltersButton
        });
    }

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

        toggleApplyFiltersButton();
    }

    distanceSlider.addEventListener('input', updateDistanceSlider);
    updateDistanceSlider(distanceSlider);

    // RATING
    const starButtons = filtersEl.querySelectorAll('.star-btn-filters');

    currentRating = defaultFilters.rating;

    function updateStars(rating) {
        currentRating = rating;
        starButtons.forEach(btn => {
            const value = Number(btn.dataset.value);
            btn.classList.toggle('active', value <= rating);
        });
        toggleApplyFiltersButton();
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

        // status
        resetStatusFilter(statusContainer)

        updateFiltersBadge(buttonEl, 0);
        toggleApplyFiltersButton();
    }

    function applyActiveFiltersToFiltersUI() {
        const filters = activeFilters;

        // DISTANZA
        if (filters.distanceKm === null || isNaN(filters.distanceKm)) {
            distanceSlider.value = 100;
        } else {
            const min = MIN_DIST;
            const max = MAX_DIST;
            const perc = Math.sqrt((filters.distanceKm - min) / (max - min)) * 100;
            distanceSlider.value = Math.max(0, Math.min(100, perc));
        }
        updateDistanceSlider(distanceSlider);

        // FASCIA ORARIA
        if (filters.startTime) {
            const [sh, sm] = filters.startTime.split(':');
            startH.value = sh;
            startM.value = sm;
        }
        if (filters.endTime) {
            const [eh, em] = filters.endTime.split(':');
            endH.value = eh;
            endM.value = em;
        }

        // RATING
        updateStars(filters.rating || 0);

        // STATUS (Visited, Saved, Mine)
        if (filters.status) {
            const state = getStatusState(statusContainer);
            
            state.visited = !!filters.status.visited;
            state.saved = !!filters.status.saved;
            state.mine = !!filters.status.mine;

            statusContainer.querySelectorAll(".home-chip").forEach((btn) => {
                const key = mapping[btn.dataset.category];
                const isActive = state[key];
                btn.classList.toggle("active", isActive);
                btn.setAttribute("aria-pressed", isActive ? "true" : "false");
            });
        }
        toggleApplyFiltersButton();
    }

    resetBtn.addEventListener('click', resetFiltersUI);

    // CANCEL / APPLY
    cancelBtn.addEventListener('click', () => {
        applyActiveFiltersToFiltersUI();
        closeBottomSheet(bottomSheetEl, overlayEl);
    });

    function readFilters() {
        if (!statusContainer || currentRating === null) return defaultFilters;

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

        return filters;
    }

    applyBtn.addEventListener('click', () => {
        const filters = readFilters();

        updateFiltersBadge(
            buttonEl,
            countActiveFilters(filters, defaultFilters)
        );

        closeBottomSheet(bottomSheetEl, overlayEl);
        activeFilters = filters;
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

    if (!Object.is(current.distanceKm, defaults.distanceKm)) count++; // [NaN !== NaN] è true?????
    if (current.rating !== defaults.rating) count++;
    if (current.startTime !== defaults.startTime) count++;
    if (current.endTime !== defaults.endTime) count++;
    if (current.status.visited !== defaults.status.visited) count++;
    if (current.status.saved !== defaults.status.saved) count++;
    if (current.status.mine !== defaults.status.mine) count++;

    return count;
}
