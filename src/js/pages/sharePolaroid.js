import { getCurrentUser,getAllUsers, shareCardboard } from "../database.js";
import { closeModal, openModal } from "../common/modalView.js";
import { showsItemsInContainer } from "./community/communityUtility.js";
import { makeSelectableCard } from "./community/cardsFactory.js";
import { formatDate } from "../common/datetime.js";

export async function sharePolaroidModal(polaroidData) {
    await openModal("../html/common-pages/share-polaroid-modal.html", ".phone-screen", (modalElement) => {
        initializeSharePolaroid(modalElement, polaroidData);
    });
}

export async function initializeSharePolaroid(modalElement, polaroidData) {    
    const friendsList = modalElement.querySelector("#sendto-list");
    const sendButton = modalElement.querySelector("#share-send-btn");
    const closeButton = modalElement.querySelector("#share-close-btn");

    closeButton.addEventListener('click', async () => {
        await closeModal(console.log("onclose modal"));
    });

    const image = modalElement.querySelector(".cardboard-image");
    const title = modalElement.querySelector(".profile-polaroid-title.share-view");
    const date = modalElement.querySelector(".profile-polaroid-subtitle.share-view");

    image.src = polaroidData.immagini?.[0] || '';
    title.textContent = polaroidData.title || '';
    date.textContent = polaroidData.timestamp ? formatDate(polaroidData.timestamp) : 'Nessuna data';

    try {
        // Carica la lista degli amici
        const user = await getCurrentUser();
        const follows = await getAllUsers();//getFollowingUser(user.email);

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
                modalElement.querySelectorAll(".receiver-checkbox:checked")
            ).map(checkbox => checkbox.dataset.friendIdMail);

            if (selectedFriends.length === 0) {
                alert("Seleziona almeno un amico");
                return;
            }

            try {
                const res = await shareCardboard(polaroidData.id, selectedFriends);
                if (res.success) {
                    closeModal();
                } else {
                    console.log("Errore:", res.descr);
                    alert(res.descr);
                }
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