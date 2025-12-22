import { showConfirmModal } from "./confirmModal.js";
import { removeBookmark, getFirstUser } from "./query.js";

// Importare populateSavedSpots per aggiornare la sezione in tempo reale
let populateSavedSpots;
import("./spotDetail.js").then(module => {
    populateSavedSpots = module.populateSavedSpots;
}).catch(err => console.error("Errore nel caricamento di spotDetail.js:", err));

export function initializeSavedBookmarks() {
    const savedBookmarks = document.querySelectorAll('[data-bookmark-button][data-bookmark-type="saved"]');

    savedBookmarks.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleRemoveFromSaved(button);
        });
    });
}

export async function handleRemoveFromSaved(button, card = null) {
    if (!card) {
        card = button.closest('[role="listitem"]');
    }
    const spotTitle = card.querySelector('[data-field="title"]')?.textContent || "questo spot";
    const spotId = card.getAttribute('data-spot-id');

    await showConfirmModal(
        "Rimuovi dai salvati?",
        `Sei sicuro di voler rimuovere "${spotTitle}" dai tuoi spot salvati?`,
        async () => {
            // Recupera l'utente attuale
            const currentUser = await getFirstUser();
            if (currentUser) {
                // Rimuovi dal database
                await removeBookmark(currentUser.id, spotId);
            }
            removeCardFromView(card);

            // Aggiorna la sezione salvati in tempo reale
            if (populateSavedSpots) {
                await populateSavedSpots();
            }
        },
        () => {
        }
    );
}

function removeCardFromView(card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.3s ease-out';

    setTimeout(() => {
        card.remove();
    }, 300);
}

