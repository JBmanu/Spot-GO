import { getCurrentUser, getFollowingUser } from "../database.js";
import { closeModal, openModal } from "../common/modalView.js";
import { showsItemsInContainer } from "./community/communityUtility.js";
import { makeSelectableCard } from "./community/cardsFactory.js";

export async function sharePolaroidModal(polaroidData, userId) {
    await openModal("../html/common-pages/share-polaroid-modal.html", ".phone-screen", (modalElement) => {
        initializeSharePolaroid(modalElement, polaroidData, userId);
    });
}

export async function initializeSharePolaroid(modalElement, polaroidData, userId) {    
    const friendsList = modalElement.querySelector("#sendto-list");
    const sendButton = modalElement.querySelector("#share-send-btn");
    const closeButton = modalElement.querySelector("#share-close-btn");

    closeButton.addEventListener('click', async () => {
        await closeModal(console.log("onclose modal"));
    });
    
    try {
        // Carica la lista degli amici
        const user = await getCurrentUser();
        const follows = await getFollowingUser(user.email);

         // Popola la lista dei seguiti
        showsItemsInContainer(follows, "follows", "sendto-list", data => makeSelectableCard(data));
        
        if (!follows || follows.length === 0) {
            sendButton.disabled = true;
            return;
        }

        // Gestisci il click del bottone di invio
        sendButton.addEventListener("click", async (e) => {
            e.preventDefault();
            const selectedFriends = Array.from(
                modalElement.querySelectorAll(".friend-checkbox:checked")
            ).map(checkbox => ({
                id: checkbox.dataset.friendId,
                email: checkbox.dataset.friendEmail
            }));

            if (selectedFriends.length === 0) {
                alert("Seleziona almeno un amico");
                return;
            }

            try {
                // TODO: Implementa la logica di invio del polaroid agli amici selezionati
                console.log("Polaroid condiviso con:", selectedFriends);
                alert("Polaroid condiviso con successo!");
                closeModal();
            } catch (error) {
                console.error("Errore durante la condivisione:", error);
                alert("Errore durante la condivisione");
            }
        });

    } catch (error) {
        console.error("Errore nel caricamento degli amici:", error);
        friendsList.innerHTML = '<p class="text-center text-red-500">Errore nel caricamento della lista amici</p>';
    }
}