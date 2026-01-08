export function initializeStarRating(containerEl) {
    const starElements = getStarElements(containerEl);
    
    starElements.forEach((star, index) => {
        star.addEventListener('click', () => {
            starElements.forEach((s, i) => s.classList.toggle('active', i <= index));
        });
    });
}

export function getSelectedStarRating(containerEl) {
    const starElements = getStarElements(containerEl);
    
    let rating = 0;
    starElements.forEach(star => {
        if (star.classList.contains('active')) rating++;
    });
    return rating;
};

export function resetStarRating(containerEl, defaultFilters) {
    const starElements = getStarElements(containerEl);

    starElements.forEach((star, i) => {
        star.classList.toggle('active', i < defaultFilters.rating);
    });
}

function getStarElements(containerEl) {
    return containerEl.querySelectorAll('.star');
}