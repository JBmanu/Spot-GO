import { getAllUsers, shareCardboard } from "../database.js";
import { closeModal, openModal } from "../common/modalView.js";
import { showsItemsInContainer, searchUsersByName } from "./community/communityUtility.js";
import { makeSelectableCard } from "./community/cardsFactory.js";
import {createSearchBarWithKeyboard} from '../createComponent.js';

export async function sharePolaroidModal(polaroidData) {
    await openModal("../html/common-pages/share-polaroid-modal.html", ".phone-screen", (modalElement) => {
        initModalCloseAlternative();
        insertSearchBar(modalElement);
        initializeSharePolaroid(modalElement, polaroidData);
    });
}

async function initModalCloseAlternative() {
    const backdrop = document.querySelector(".background-modal-overlay");
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            closeModal();
        }
    });
}

async function insertSearchBar(modalNode) {
   
    const {searchBarEl, keyboardEl, overlayEl} = await createSearchBarWithKeyboard("Cerca utente", searchUsers);
    const toolBar = document.querySelector(".app-toolbar");
    toolBar.appendChild(keyboardEl);
    const listView = modalNode.querySelector(".vertical-list-wrapper");
    searchBarEl.querySelector("#view-all-saved-filter-btn")?.remove();
    listView.before(searchBarEl);
}

async function searchUsers (searchTerm) {
    const users = await getAllUsers();
    const results = searchUsersByName(users, searchTerm);
    showsItemsInContainer(results, "follows", "sendto-list", data => makeSelectableCard(data));
}

async function initializeSharePolaroid(modalElement, polaroidData) {    
    const friendsList = modalElement.querySelector("#sendto-list");
    const sendButton = modalElement.querySelector("#share-send-btn");
    const closeButton = modalElement.querySelector("#share-close-btn");

    closeButton.addEventListener('click', async () => {
        await closeModal(console.log("onclose modal"));
    });

    sendButton.disabled = true;

    try {
        await searchUsers();
        const checkboxes = modalElement.querySelectorAll(".receiver-checkbox");
        const selected = () => Array.from(modalElement.querySelectorAll(".receiver-checkbox:checked"));
        checkboxes.forEach(checkbox => 
            checkbox.addEventListener('change', () => {
                sendButton.disabled = selected().length === 0;
            })
        );
        // Gestisci il click del bottone di invio
        sendButton.addEventListener("click", async (e) => {
            e.preventDefault();
            sendButton.disabled = true;
            const selectedEmails = selected().map(checkbox => checkbox.dataset.friendIdMail);
            try {
                //Show loading circle
                const res = await shareCardboard(polaroidData.id, selectedEmails);
                if (res.success) {
                    //show ok and then close modal
                    sendButton.innerHTML = "Inviata!";
                    setTimeout(() => {
                        closeModal();
                    }, 2000);
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