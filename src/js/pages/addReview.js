import { addReviewToDatabase } from "../database.js";

let currentSpotId = null;
let onReviewComplete = null;

/**
 * Inizializza la pagina di aggiunta recensione
 */
export function initializeAddReview(wrapperEl) {
    const form = wrapperEl.querySelector("#add-review-form");
    const stars = wrapperEl.querySelectorAll(".star-btn");
    let selectedRating = 0;

    stars.forEach(btn => {
        btn.addEventListener("click", () => {
            selectedRating = parseInt(btn.dataset.value);
            updateStars(stars, selectedRating);
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = wrapperEl.querySelector("#review-text").value.trim();

        if (selectedRating === 0) {
            alert("Per favore, seleziona una valutazione (stelle).");
            return;
        }

        if (!currentSpotId) {
            alert("Errore: spot non specificato.");
            return;
        }

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Invio in corso...";

            await addReviewToDatabase(currentSpotId, {
                rating: selectedRating,
                description: text
            });

            form.reset();
            selectedRating = 0;
            updateStars(stars, 0);

            if (onReviewComplete) {
                onReviewComplete();
            }

            window.history.back();

        } catch (err) {
            alert("Errore durante l'invio della recensione. Riprova.");
            console.error(err);
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = "Invia Recensione";
        }
    });
}

/**
 * Imposta lo spot ID per la recensione
 */
export function setReviewSpotId(spotId, callback) {
    currentSpotId = spotId;
    onReviewComplete = callback;
}

function updateStars(stars, rating) {
    stars.forEach(btn => {
        const value = parseInt(btn.dataset.value);
        btn.classList.toggle("active", value <= rating);
    });
}
