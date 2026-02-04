import {getAllUsers, getCurrentUser, getSpotById, getUserPolaroids, shareCardboard} from "../database.js";
import { closeModal, openModal } from "../common/modalView.js";
import { showsItemsInContainer, searchUsersByName } from "./community/communityUtility.js";
import { makeSelectableCard } from "./community/cardsFactory.js";
import { createSearchBarWithKeyboard } from '../createComponent.js';
import { triggerSharePolaroid } from "../goals/missionsTrigger.js";
import { getPolaroidTemplate, fillPolaroidContent} from "../common/polaroidCommon.js";

export async function sharePolaroidModal(polaroidData) {
    await openModal("../html/common-pages/share-polaroid-modal.html", ".phone-screen", (modalElement) => {
        initModalCloseAlternative();
        insertSearchBar(modalElement, "Cerca utente", searchUsers);
        initializeSharePolaroid(modalElement, polaroidData);
    });
}

export async function sharePolaroidChatModal(toUserMail, onSuccess) {
    await openModal("../html/common-pages/share-polaroid-modal.html", ".phone-screen", (modalElement) => {
        initModalCloseAlternative();
        // insertSearchBar(modalElement, "Cerca polaroid", (v) => console.log(v));
        initializeSharePolaroidChat(modalElement, toUserMail, onSuccess);
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

async function insertSearchBar(modalNode, placeholder, onValueChange) {
   
    const {searchBarEl, keyboardEl, overlayEl} = await createSearchBarWithKeyboard(placeholder, onValueChange);
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
                // Trigger share polaroid mission
                const spotData = await getSpotById(polaroidData.idLuogo);
                spotData.category = spotData.idCategoria;
                await triggerSharePolaroid(spotData);
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

async function initializeSharePolaroidChat(modalElement, toUserMail, onSuccess) {    
    const sendButton = modalElement.querySelector("#share-send-btn");
    const closeButton = modalElement.querySelector("#share-close-btn");
    const scrollList = modalElement.querySelector("#sendto-list");
    if (scrollList) {
        scrollList.style.display = 'flex';
        scrollList.style.justifyContent = 'center';
        scrollList.style.alignItems = 'center';
        scrollList.style.flexDirection = 'column';
    }

    closeButton.addEventListener('click', async () => {
        await closeModal(console.log("onclose modal"));
    });

    sendButton.disabled = true;

    try {
        // await searchUsers();
        var selectedData = null;
        var selectedPolaroid = null;
        const user = await getCurrentUser();
        const polaroidsData = await getUserPolaroids(user.email);

        const polaroidCards = await Promise.all(polaroidsData.map(async pd => {
            const template = await getPolaroidTemplate();
            if (!template) return;
            const clone = template.content.cloneNode(true);
            fillPolaroidContent(clone, pd);
            const card = clone.querySelector('.profile-polaroid');
            if (card) {
                card.classList.remove('carousel-horizontal_item');
                card.style.width = "60%";
                card.style.margin = "15px";
                card.querySelector(".polaroid-menu-wrapper").remove();
                card.addEventListener('click', () => {
                    selectedData = pd;
                    if (selectedPolaroid !== null) selectedPolaroid.style.background = "";
                    selectedPolaroid = card;
                    card.style.background = "#1c7c549c";
                    sendButton.disabled = false;
                })
            }
            return card;
        }));

        showsItemsInContainer(polaroidCards, "polaroids", "sendto-list", cards => cards);

        // Gestisci il click del bottone di invio
        sendButton.addEventListener("click", async (e) => {
            e.preventDefault();
            sendButton.disabled = true;
            try {
                // Trigger share polaroid mission
                const spotData = await getSpotById(selectedData.idLuogo);
                spotData.category = spotData.idCategoria;
                await triggerSharePolaroid(spotData);
                //Show loading circle
                const res = await shareCardboard(selectedData.id, [toUserMail]);
                if (res.success) {
                    //show ok and then close modal
                    sendButton.innerHTML = "Inviata!";
                    setTimeout(() => {
                        closeModal();
                        onSuccess();
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