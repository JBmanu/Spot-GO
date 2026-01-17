import { addReviewToDatabase } from "../database.js";
import { closeModal, openModal } from "../common/modalView.js";

let currentSpotId = null;
let onReviewComplete = null;
let selectedRating = 0;
let updateSubmitButtonFn = null;

export async function openAddReviewModal() {
    await openModal("../html/common-pages/add-review.html", ".phone-screen", initializeAddReview);
}

export function closeAddReviewModal() {
    closeModal(modalElement => {
        const form = modalElement.querySelector("#add-review-form");
        if (form) {
            form.reset();
            const stars = modalElement.querySelectorAll(".star-btn");
            updateStars(stars, 0);
            selectedRating = 0;
            if (updateSubmitButtonFn) {
                updateSubmitButtonFn();
            }
        }
    });
}

export function initializeAddReview(wrapperEl) {
    const form = wrapperEl.querySelector("#add-review-form");
    const stars = wrapperEl.querySelectorAll(".star-btn");
    const closeBtn = wrapperEl.querySelector(".add-review-close-btn");
    const overlay = wrapperEl;
    const textarea = wrapperEl.querySelector("#review-text");
    const submitBtn = form.querySelector('button[type="submit"]');
    const helpText = wrapperEl.querySelector("#review-help-text");

    const updateSubmitButton = () => {
        const hasRating = selectedRating > 0;
        const hasComment = textarea.value.trim().length > 0;
        submitBtn.disabled = !(hasRating && hasComment);

        if (!hasRating && !hasComment) {
            helpText.textContent = "Seleziona una valutazione e scrivi un commento";
        } else if (!hasRating) {
            helpText.textContent = "Seleziona una valutazione";
        } else if (!hasComment) {
            helpText.textContent = "Scrivi un commento";
        } else {
            helpText.textContent = "\u00A0";
        }
    };

    updateSubmitButtonFn = updateSubmitButton;

    stars.forEach(btn => {
        btn.addEventListener("click", () => {
            selectedRating = parseInt(btn.dataset.value);
            updateStars(stars, selectedRating);
            updateSubmitButton();
        });
    });

    textarea.addEventListener("input", updateSubmitButton);
    updateSubmitButton();

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAddReviewModal();
        });
    }

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeAddReviewModal();
        }
    });

    const escapeHandler = (e) => {
        if (e.key === "Escape" && isModalOpen) {
            closeAddReviewModal();
        }
    };
    document.addEventListener("keydown", escapeHandler);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = wrapperEl.querySelector("#review-text").value.trim();

        if (!currentSpotId) {
            alert("Errore: spot non specificato.");
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = "Invio in corso...";

            await addReviewToDatabase(currentSpotId, {
                rating: selectedRating,
                description: text
            });

            form.reset();
            selectedRating = 0;
            updateStars(stars, 0);
            updateSubmitButton();

            if (onReviewComplete) {
                onReviewComplete();
            }

            closeAddReviewModal();

        } catch (err) {
            alert("Errore durante l'invio della recensione. Riprova.");
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.textContent = "Invia Recensione";
        }
    });
}

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
