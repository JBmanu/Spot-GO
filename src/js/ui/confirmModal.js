import { openModal, closeModal } from "../common/modalView.js";

export function showConfirmModal(title = "", message = "") {
    return new Promise(async (resolve) => {
        const modalElement = await openModal("../html/common-components/confirmation-modal.html", ".phone-screen", () => {});
        
        modalElement.querySelector("#confirmation-modal-title").innerHTML = title;
        modalElement.querySelector("#modal-description").innerHTML = message;
        const closeButton = modalElement.querySelector("#close-remove-btn");
        const confirmButton = modalElement.querySelector("#confirm-remove-btn");
        const backdrop = document.querySelector(".background-modal-overlay");
        
        closeButton.addEventListener('click', () => {
            closeModal();
            resolve(false);
        });

        confirmButton.addEventListener('click', async () => {
            closeModal();
            resolve(true);
        });

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal();
                resolve(false);
            }
        });
    });
}