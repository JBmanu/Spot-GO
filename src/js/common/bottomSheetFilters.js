import { closeBottomSheet } from "../ui/bottomSheet";

export function initializeBottomSheetFilters({ filtersEl, bottomSheetEl, overlayEl, onFiltersApplied }) {
    // --- ELEMENTI DEL DOM ---
    const openNowCheckbox = filtersEl.querySelector('input[name="open_now"]');
    const dateInput = filtersEl.querySelector('.input-date');
    const timeInput = filtersEl.querySelector('.input-time');
    const distanceRange = filtersEl.querySelector('.distance-range');
    const distanceValueSpan = filtersEl.querySelector('.distance-value');
    const starElements = filtersEl.querySelectorAll('.star-rating .star');
    const statusButtons = filtersEl.querySelectorAll('.filter-button-status');
    const resetBtn = filtersEl.querySelector('.filters-reset-btn');
    const cancelBtn = filtersEl.querySelector('.filter-button-footer:nth-child(1)');
    const applyBtn = filtersEl.querySelector('.filter-button-footer:nth-child(2)');

    // --- STATO DEFAULT ---
    const defaultFilters = {
        openNow: false,
        openDateTime: null,
        distance: 5000, // in meters
        rating: 3,
        status: []
    };

    // --- UTILITY ---
    const getSelectedRating = () => {
        let rating = 0;
        starElements.forEach(star => {
            if (star.classList.contains('active')) rating++;
        });
        return rating;
    };

    const getSelectedStatus = () => {
        const selected = [];
        statusButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                selected.push(btn.dataset.value);
            }
        });
        return selected;
    };

    const resetFiltersUI = () => {
        // "Aperto ora"
        openNowCheckbox.checked = defaultFilters.openNow;
        // Data e ora
        dateInput.value = '';
        timeInput.value = '';
        // Distanza
        distanceRange.value = defaultFilters.distance / 1000;
        distanceValueSpan.textContent = `${defaultFilters.distance / 1000} km`;
        // Rating
        starElements.forEach((star, i) => {
            star.classList.toggle('active', i < defaultFilters.rating);
        });
        // Stato
        statusButtons.forEach(btn => btn.classList.remove('active'));
    };

    const readFilters = () => {
        // "Aperto ora"
        const openNow = openNowCheckbox.checked;

        // "Aperto il" + "alle"
        let openDateTime = null;
        if (dateInput.value) {
            const dateStr = dateInput.value;
            const timeStr = timeInput.value || "00:00";
            openDateTime = new Date(`${dateStr}T${timeStr}`);
        }

        // Distanza (in metri)
        const distanceKm = parseFloat(distanceRange.value);
        const distance = distanceKm * 1000;

        // Rating
        const rating = getSelectedRating();

        // Stato
        const status = getSelectedStatus();

        // Mappa da inviare al DB
        const filtersMap = {
            openNow,
            openDateTime,
            distance,
            rating,
            status
        };

        return filtersMap;
    };

    // --- EVENT LISTENERS ---
    // Toggle distanza display
    distanceRange.addEventListener('input', () => {
        distanceValueSpan.textContent = `${distanceRange.value} km`;
    });

    // Toggle rating
    starElements.forEach((star, index) => {
        star.addEventListener('click', () => {
            starElements.forEach((s, i) => s.classList.toggle('active', i <= index));
        });
    });

    // Toggle status buttons
    statusButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // Reset filtri
    resetBtn.addEventListener('click', () => {
        resetFiltersUI();
    });

    // Annulla
    cancelBtn.addEventListener('click', () => {
        closeBottomSheet(bottomSheetEl, overlayEl);
    });

    // Applica filtri
    applyBtn.addEventListener('click', () => {
        const filtersToApply = readFilters();
        closeBottomSheet(bottomSheetEl, overlayEl);        
        onFiltersApplied(filtersToApply);
    });

    // Inizializza UI con valori di default
    resetFiltersUI();
};
