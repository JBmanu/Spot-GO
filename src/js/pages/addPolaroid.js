import { getSpots, addPolaroidToDatabase } from "../database.js";
import { closeModal, openModal } from "../common/modalView.js";

let selectedImage = null;
let updateSubmitButtonFn = null;

export async function openAddPolaroidModal() {
    const modalElement = await openModal("../html/common-pages/add-polaroid.html", ".phone-screen", initializeAddPolaroid);
    await loadSpotsIntoDropdown(modalElement);
}

async function loadSpotsIntoDropdown(modalElement) {
    const locationSelect = modalElement.querySelector("#polaroid-location");
    if (!locationSelect) return;

    try {
        const spots = await getSpots();

        locationSelect.innerHTML = '<option value="">Seleziona uno spot...</option>';

        spots.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        spots.forEach(spot => {
            const option = document.createElement("option");
            option.value = spot.id;
            option.textContent = spot.nome || spot.id;
            locationSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Errore caricamento spot:", error);
    }
}

export function closeAddPolaroidModal() {
    closeModal(modalElement => {
        const form = modalElement.querySelector("#add-polaroid-form");
        if (form) {
            form.reset();
            selectedImage = null;

            const preview = modalElement.querySelector("#polaroid-image-preview");
            if (preview) {
                preview.classList.remove("active");
                preview.style.backgroundImage = "";
            }

            if (updateSubmitButtonFn) {
                updateSubmitButtonFn();
            }
        }
    });
}

function initializeAddPolaroid(wrapperEl) {
    const form = wrapperEl.querySelector("#add-polaroid-form");
    const closeBtn = wrapperEl.querySelector(".add-polaroid-close-btn");
    const overlay = wrapperEl;
    const imageInput = wrapperEl.querySelector("#polaroid-image-input");
    const imagePreview = wrapperEl.querySelector("#polaroid-image-preview");
    const titleInput = wrapperEl.querySelector("#polaroid-title");
    const locationInput = wrapperEl.querySelector("#polaroid-location");
    const dateInput = wrapperEl.querySelector("#polaroid-date");
    const diaryInput = wrapperEl.querySelector("#polaroid-diary");
    const submitBtn = form.querySelector('button[type="submit"]');
    const helpText = wrapperEl.querySelector("#polaroid-help-text");

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    const updateSubmitButton = () => {
        const hasImage = selectedImage !== null;
        const hasTitle = titleInput.value.trim().length > 0;
        const hasLocation = locationInput.value.trim().length > 0;
        const hasDate = dateInput.value.trim().length > 0;

        submitBtn.disabled = !(hasImage && hasTitle && hasLocation && hasDate);

        if (!hasImage) {
            helpText.textContent = "Carica una foto e completa tutti i campi";
        } else if (!hasTitle || !hasLocation || !hasDate) {
            helpText.textContent = "Completa tutti i campi";
        } else {
            helpText.textContent = "\u00A0";
        }
    };

    updateSubmitButtonFn = updateSubmitButton;

    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            selectedImage = file;

            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.style.backgroundImage = `url(${event.target.result})`;
                imagePreview.classList.add("active");
                updateSubmitButton();
            };
            reader.readAsDataURL(file);
        }
    });

    titleInput.addEventListener("input", updateSubmitButton);
    locationInput.addEventListener("input", updateSubmitButton);
    dateInput.addEventListener("change", updateSubmitButton);

    updateSubmitButton();

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAddPolaroidModal();
        });
    }

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeAddPolaroidModal();
        }
    });

    const escapeHandler = (e) => {
        if (e.key === "Escape" && isModalOpen) {
            closeAddPolaroidModal();
        }
    };
    document.addEventListener("keydown", escapeHandler);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const location = locationInput.value.trim();
        const date = dateInput.value;
        const diary = diaryInput ? diaryInput.value.trim() : "";

        if (!selectedImage) {
            alert("Seleziona un'immagine.");
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = "Salvataggio...";

            const reader = new FileReader();
            const imageDataUrl = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(selectedImage);
            });

            await addPolaroidToDatabase({
                title,
                idLuogo: location,
                date,
                imageUrl: imageDataUrl,
                diary
            });

            form.reset();
            selectedImage = null;
            imagePreview.classList.remove("active");
            imagePreview.style.backgroundImage = "";
            updateSubmitButton();

            closeAddPolaroidModal();

            document.dispatchEvent(new CustomEvent("polaroid:added"));

        } catch (err) {
            alert("Errore durante il salvataggio. Riprova.");
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.textContent = "Aggiungi Polaroid";
        }
    });
}
