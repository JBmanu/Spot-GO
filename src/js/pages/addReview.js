import { addReviewToDatabase, updateReview } from "../database.js";
import { closeModal, openModal } from "../common/modalView.js";


let currentSpotId = null;
let currentReviewId = null;
let isEditMode = false;
let onReviewComplete = null;
let selectedRating = 0;
let updateSubmitButtonFn = null;

export async function openAddReviewModal() {
    await openModal("../html/common-pages/add-review.html", ".phone-screen", initializeAddReview);
}

function closeAddReviewModal() {
    closeModal(modalElement => {
        const form = modalElement.querySelector("#add-review-form");
        if (form) {
            form.reset();
            const stars = modalElement.querySelectorAll(".star-btn");
            updateStars(stars, 0);
            selectedRating = 0;
            isEditMode = false;
            currentReviewId = null;
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

    const titleEl = wrapperEl.querySelector("h2");
    if (titleEl) {
        titleEl.textContent = isEditMode ? "Modifica Recensione" : "Scrivi una recensione";
    }

    if (isEditMode) {
        const initialText = tempInitialText || "";

        textarea.value = initialText;
        updateStars(stars, selectedRating);
        submitBtn.textContent = "Aggiorna Recensione";
    } else {
        submitBtn.textContent = "Invia Recensione";
    }
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

        if (text.length === 0 && selectedRating === 0) {
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = isEditMode ? "Aggiornamento..." : "Invio in corso...";

            if (isEditMode && currentReviewId) {
                await updateReview(currentReviewId, {
                    rating: selectedRating,
                    description: text
                });
            } else {
                await addReviewToDatabase(currentSpotId, {
                    rating: selectedRating,
                    description: text
                });
            }

            form.reset();
            selectedRating = 0;
            updateStars(stars, 0);
            updateSubmitButton();

            if (onReviewComplete) {
                onReviewComplete();
            }

            document.dispatchEvent(new CustomEvent("review:changed"));

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
    isEditMode = false;
    currentReviewId = null;
}

function setEditReviewData(reviewId, spotId, rating, text, callback) {
    currentReviewId = reviewId;
    currentSpotId = spotId;
    selectedRating = rating;
    onReviewComplete = callback;
    isEditMode = true;
}

export async function openEditReviewModal(reviewId, spotId, rating, text, callback) {
    setEditReviewData(reviewId, spotId, rating, text, callback);
    tempInitialText = text;

    await openModal("../html/common-pages/add-review.html", ".phone-screen", initializeAddReview);
}

let tempInitialText = "";


function updateStars(stars, rating) {
    stars.forEach(btn => {
        const value = parseInt(btn.dataset.value);
        btn.classList.toggle("active", value <= rating);
    });
}
