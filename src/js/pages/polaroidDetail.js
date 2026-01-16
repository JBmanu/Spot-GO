import { getSpotById, updatePolaroid, deletePolaroid } from "../database.js";
import { closeOverlayAndReveal } from "../common/back.js";
import { openSpotDetailById } from "./spotDetail.js";

const state = {
    templateCache: null,
    currentPolaroid: null,
    isEditing: false
};

function toggleEditMode(overlay, data) {
    state.isEditing = !state.isEditing;
    const diaryInput = overlay.querySelector('[data-field="diary"]');
    const diaryDisplay = overlay.querySelector('[data-field="diary-display"]');
    const diarySection = overlay.querySelector('[data-section="diary"]');
    const diaryEmptySection = overlay.querySelector('[data-section="diary-empty"]');
    const editActions = overlay.querySelector('[data-section="edit-actions"]');

    if (state.isEditing) {
        if (diaryInput) {
            if (diarySection) diarySection.style.display = "block";
            if (diaryEmptySection) diaryEmptySection.style.display = "none";
            if (editActions) editActions.style.display = "flex";

            if (diaryDisplay) diaryDisplay.style.display = "none";
            diaryInput.style.display = "block";
            diaryInput.removeAttribute("readonly");
            diaryInput.focus();
        }
    } else {
        if (diaryInput) {
            diaryInput.style.display = "none";
            if (diaryDisplay) {
                diaryDisplay.style.display = "flex";
                diaryDisplay.textContent = diaryInput.value;
            }

            if (editActions) editActions.style.display = "none";

            const currentVal = diaryInput.value;
            if (!currentVal || currentVal.trim() === "") {
                if (diarySection) diarySection.style.display = "none";
                if (diaryEmptySection) diaryEmptySection.style.display = "flex";
            }
        }
    }
}

function getMain() {
    return document.getElementById("main");
}

function getActiveSectionKey(main) {
    if (!main) return "homepage";
    const visible = main.querySelector('[data-section-view]:not([hidden])');
    if (visible) return (visible?.dataset.sectionView || "homepage").trim();

    const overlay = main.querySelector('[data-overlay-view]');
    if (overlay) return overlay.dataset.overlayView;

    return "homepage";
}

function getDetailOverlay(main) {
    return main?.querySelector('[data-overlay-view="polaroid-detail"]') || null;
}

async function exitDetailFlow(main) {
    if (!main) return;
    main.classList.add("spot-detail-exit");
    await new Promise(r => setTimeout(r, 250));
    closeDetailOverlay(main);
}

function closeDetailOverlay(main) {
    if (!main) return null;
    const overlay = getDetailOverlay(main);
    if (!overlay) return null;

    const backButton = document.getElementById("header-back-button");
    if (backButton) {
        const newBtn = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBtn, backButton);
    }

    return closeOverlayAndReveal({ overlay });
}

export async function openPolaroidDetail(polaroidData) {
    try {
        state.currentPolaroid = polaroidData;
        const main = getMain();
        if (!main) return;

        const returnSection = getActiveSectionKey(main);
        const existing = getDetailOverlay(main);
        if (existing) existing.remove();

        if (!state.templateCache) {
            const res = await fetch("../html/common-pages/polaroid-detail.html");
            if (res.ok) state.templateCache = await res.text();
        }
        if (!state.templateCache) return;

        const overlay = document.createElement("div");
        overlay.dataset.overlayView = "polaroid-detail";
        overlay.dataset.returnView = returnSection;
        overlay.innerHTML = state.templateCache;

        main.querySelectorAll("[data-section-view], [data-overlay-view]").forEach((el) => (el.hidden = true));
        main.appendChild(overlay);

        main.classList.add("spot-detail-enter");
        main.classList.remove("spot-detail-exit");

        updateDetailHeader(polaroidData);
        await populatePolaroidDetail(polaroidData, overlay);
        initializeDetailHandlers(overlay, polaroidData);

    } catch (err) {
        console.error("openPolaroidDetail error:", err);
    }
}

function updateDetailHeader(data) {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `
            <button type="button" id="header-back-button" aria-label="Torna indietro"
                class="flex items-center justify-center w-10 h-10">
                <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
            </button>
        `;
    }

    if (headerLogoText) headerLogoText.style.display = "none";
    if (headerTitle) {
        headerTitle.textContent = "Dettaglio Polaroid";
        headerTitle.classList.remove("hidden");
    }

    const btn = document.getElementById("header-bookmark-button");
    if (btn) btn.style.display = "none";
}

async function populatePolaroidDetail(data, overlay) {
    const titleEl = overlay.querySelector('[data-field="title"]');

    const dateEl = overlay.querySelector('[data-field="date"]');
    const imageEl = overlay.querySelector('[data-field="image"]');
    const spotInfoSection = overlay.querySelector('[data-section="spot-info"]');
    const spotNameEl = overlay.querySelector('[data-field="spot-name"]');
    const spotAddressEl = overlay.querySelector('[data-field="spot-address"]');
    const diarySection = overlay.querySelector('[data-section="diary"]');
    const diaryEl = overlay.querySelector('[data-field="diary"]');

    if (titleEl) titleEl.textContent = data.title || "Senza Titolo";
    if (dateEl) dateEl.textContent = data.date || "";



    if (imageEl) {
        const imgUrl = (data.image && data.image !== "") ? data.image : "../assets/default-polaroid.jpg";
        imageEl.src = imgUrl;
    }

    const diaryEmptySection = overlay.querySelector('[data-section="diary-empty"]');
    const diaryDisplay = overlay.querySelector('[data-field="diary-display"]');

    if (diarySection && diaryEl) {
        if (data.diary && data.diary.trim() !== "") {
            diaryEl.value = data.diary;
            if (diaryDisplay) diaryDisplay.textContent = data.diary;

            diarySection.style.display = "block";
            if (diaryEmptySection) diaryEmptySection.style.display = "none";
        } else {
            diarySection.style.display = "none";
            if (diaryEmptySection) diaryEmptySection.style.display = "flex";
        }
    }

    const spotNameHeaderEl = overlay.querySelector('[data-field="spot-name-header"]');

    if (spotNameHeaderEl) {
        spotNameHeaderEl.textContent = "";
        spotNameHeaderEl.style.display = "none";
    }

    if (data.idLuogo) {
        try {
            const spot = await getSpotById(data.idLuogo);
            if (spot) {
                if (spotNameHeaderEl) {
                    spotNameHeaderEl.textContent = spot.nome || "Spot";
                    spotNameHeaderEl.style.display = "inline-block";

                    const newBtn = spotNameHeaderEl.cloneNode(true);
                    spotNameHeaderEl.parentNode.replaceChild(newBtn, spotNameHeaderEl);

                    newBtn.addEventListener("click", async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await openSpotDetailById(data.idLuogo);
                    });
                }
            }
        } catch (e) {
            console.error("Error fetching spot for polaroid detail:", e);
        }
    }
}



function initializeDetailHandlers(overlay, data) {
    const backButton = document.getElementById("header-back-button");
    if (backButton) {
        const newBtn = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBtn, backButton);

        newBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const main = getMain();

            await exitDetailFlow(main);

            const returnViewId = overlay.dataset.returnView;
            if (returnViewId === "profile" || document.querySelector('[data-section-view="profile"]:not([hidden])')) {
                if (window.reloadProfileHeader) window.reloadProfileHeader();
            }
        });
    }

    const editBtn = overlay.querySelector('[data-action="edit-polaroid"]');
    if (editBtn) {
        editBtn.addEventListener("click", (e) => {
            e.preventDefault();
        });
    }

    const menuBtn = overlay.querySelector('[data-action="open-menu"]');
    const menuDropdown = overlay.querySelector('[data-element="menu-dropdown"]');

    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = menuDropdown.classList.contains("opacity-100");

            if (isVisible) {
                menuDropdown.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
                menuDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
            } else {
                menuDropdown.classList.remove("opacity-0", "scale-95", "pointer-events-none");
                menuDropdown.classList.add("opacity-100", "scale-100", "pointer-events-auto");
            }
        });

        const closeMenu = () => {
            menuDropdown.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
            menuDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
        };

        overlay.addEventListener("click", (e) => {
            if (menuDropdown.classList.contains("opacity-100") &&
                !menuDropdown.contains(e.target) &&
                !menuBtn.contains(e.target)) {
                closeMenu();
            }
        });

        const editBtn = menuDropdown.querySelector('[data-action="edit-polaroid"]');
        if (editBtn) {
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeMenu();
                toggleEditMode(overlay, data);
            });
        }

        const shareBtn = menuDropdown.querySelector('[data-action="share-polaroid"]');
        if (shareBtn) {
            shareBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeMenu();

                if (navigator.share) {
                    navigator.share({
                        title: data.title || 'Polaroid',
                        text: data.diary || 'Guarda questa polaroid su Spot GO!',
                        url: window.location.href
                    }).catch(console.error);
                } else {
                    alert("Condivisione non supportata su questo browser");
                }
            });
        }

        const deleteBtn = menuDropdown.querySelector('[data-action="delete-polaroid"]');
        const deleteModal = overlay.querySelector("#polaroid-delete-modal");

        if (deleteBtn && deleteModal) {
            const confirmBtn = deleteModal.querySelector("#delete-modal-confirm");
            const cancelBtn = deleteModal.querySelector("#delete-modal-cancel");

            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeMenu();

                deleteModal.style.display = "flex";
                requestAnimationFrame(() => {
                    deleteModal.classList.add("active");
                });
            });

            const closeModal = () => {
                deleteModal.classList.remove("active");
                setTimeout(() => {
                    deleteModal.style.display = "none";
                }, 300);
            };

            cancelBtn.addEventListener("click", (e) => {
                e.preventDefault();
                closeModal();
            });

            confirmBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    await deletePolaroid(data.id);
                    closeModal();

                    const main = getMain();
                    await exitDetailFlow(main);

                    const returnViewId = overlay.dataset.returnView;
                    if (returnViewId === "profile" || document.querySelector('[data-section-view="profile"]:not([hidden])')) {
                        if (window.reloadProfileHeader) window.reloadProfileHeader();

                        document.dispatchEvent(new CustomEvent("polaroid:deleted", { detail: { id: data.id } }));
                    }

                } catch (err) {
                    console.error("Error deleting polaroid:", err);
                    alert("Errore durante l'eliminazione.");
                    closeModal();
                }
            });

            deleteModal.addEventListener("click", (e) => {
                if (e.target === deleteModal) closeModal();
            });
        }
    }

    const cancelEditBtn = overlay.querySelector('[data-action="cancel-edit"]');
    const saveEditBtn = overlay.querySelector('[data-action="save-edit"]');
    const diaryInput = overlay.querySelector('[data-field="diary"]');

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (diaryInput) {
                diaryInput.value = data.diary || "";
                const diaryDisplay = overlay.querySelector('[data-field="diary-display"]');
                if (diaryDisplay) diaryDisplay.textContent = data.diary || "";
            }
            toggleEditMode(overlay, data);
        });
    }

    if (saveEditBtn) {
        saveEditBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            if (diaryInput) {
                const newDiary = diaryInput.value;
                if (data.diary !== newDiary) {
                    data.diary = newDiary;
                    try {
                        await updatePolaroid(data.id, { diary: newDiary });

                        const diaryDisplay = overlay.querySelector('[data-field="diary-display"]');
                        if (diaryDisplay) diaryDisplay.textContent = newDiary;
                    } catch (err) {
                        console.error("Failed to update diary:", err);
                        alert("Errore durante il salvataggio.");
                    }
                }
            }
            toggleEditMode(overlay, data);
        });
    }
}
