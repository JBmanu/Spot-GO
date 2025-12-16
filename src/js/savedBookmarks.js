import { showConfirmModal } from "./confirmModal.js";

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

    await showConfirmModal(
        "Rimuovi dai salvati?",
        `Sei sicuro di voler rimuovere "${spotTitle}" dai tuoi spot salvati?`,
        () => {
            removeCardFromView(card);
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

