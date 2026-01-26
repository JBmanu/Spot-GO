import { openModal, closeModal } from "../common/modalView.js";

export function showConfirmModal(title = "", message = "", parentSelector = ".phone-screen") {
    return new Promise(async (resolve) => {
        await openModal("../html/common-components/confirmation-modal.html", parentSelector, (modal) => {
            modal.querySelector("#confirmation-modal-title").innerHTML = title;
            modal.querySelector("#modal-description").innerHTML = message;
            const closeButton = modal.querySelector("#close-remove-btn");
            const confirmButton = modal.querySelector("#confirm-remove-btn");
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
    });
}