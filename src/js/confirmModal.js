/**
 * Mostra un modal di conferma (Conferma / Annulla).
 * Restituisce una Promise che risolve true se l'utente conferma, false altrimenti.
 */
export function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.id = 'confirm-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.style.cssText = `
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            padding: 24px;
            max-width: 320px;
            width: 90vw;
            z-index: 1001;
            position: relative;
        `;

        modal.innerHTML = `
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 12px; margin-top: 0;">${title}</h2>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5;">${message}</p>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="modal-btn-cancel" style="flex: 1; padding: 10px 16px; border: none; border-radius: 8px; background-color: #e5e7eb; cursor: pointer; font-weight: 500; transition: all 0.2s;">Annulla</button>
                <button class="modal-btn-confirm" style="flex: 1; padding: 10px 16px; border: none; border-radius: 8px; background-color: #007AFF; color: white; cursor: pointer; font-weight: 500; transition: all 0.2s;">Conferma</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const confirmBtn = modal.querySelector('.modal-btn-confirm');
        const cancelBtn = modal.querySelector('.modal-btn-cancel');

        function closeModal() {
            backdrop.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                backdrop.remove();
            }, 300);
        }

        confirmBtn.addEventListener('click', () => {
            closeModal();
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            closeModal();
            resolve(false);
        });

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal();
                resolve(false);
            }
        });

        backdrop.style.animation = 'fadeIn 0.3s ease-out';

        if (!document.getElementById('modal-animations')) {
            const style = document.createElement('style');
            style.id = 'modal-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    });
}
