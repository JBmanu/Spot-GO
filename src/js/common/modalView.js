
let modalElement = [];
let modalOpenCount = 0;

export async function openModal(htmlPath, parentSelector, initPageContent) {
    // reset();

    const response = await fetch(htmlPath);
    if (!response.ok) return;

    const html = await response.text();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    modalOpenCount += 1;
    // Prendi il primo elemento renderizzato, ignorando script, link e altri tag non visibili
    modalElement[modalOpenCount] = Array.from(tempDiv.children).find(el =>
        !['SCRIPT', 'LINK', 'STYLE', 'META'].includes(el.tagName)
    );

    const parentNode = document.querySelector(parentSelector);
    if (!parentNode) return;
    parentNode.appendChild(modalElement[modalOpenCount]);

    initPageContent(modalElement[modalOpenCount]);
    showModal();
    console.log("MOdal counter:", modalOpenCount);
    return modalElement[modalOpenCount];
}

function showModal() {
    modalElement[modalOpenCount].style.display = "flex";
    requestAnimationFrame(() => {
        modalElement[modalOpenCount].classList.add("active");
    });

    const mainContainer = document.getElementById("main");
    if (mainContainer) {
        mainContainer.style.overflow = "hidden";
    }
}

function reset() {
    const mainContainer = document.getElementById("main");
    if (mainContainer) {
        mainContainer.style.overflow = "";
    }
    if (modalElement[modalOpenCount] !== null) {
        modalElement[modalOpenCount].classList.remove("active");
        modalElement[modalOpenCount].style.display = "none";
        modalElement[modalOpenCount].remove();
        modalElement[modalOpenCount] = null;
    }
}

/**
 * Close modal view after execution of onCloseAction
 * @param {Async function with action to do before closing modal modalElement => void} onCloseAction
 * @returns nothing
 */
export async function closeModal(onCloseAction) {
    if (!modalOpenCount || !modalElement) return;
    const modal = modalElement[modalOpenCount];
    if (modal) {
        modal.classList.remove("active");
        modal.classList.add("page-fade-out");
    }
    
    setTimeout(async () => {
        if (modal) {
            modalElement[modalOpenCount].style.display = "none";
            modalElement[modalOpenCount].classList.remove("page-fade-out");

            if (onCloseAction) {
                await onCloseAction(modalElement[modalOpenCount]);
            }
            const mainContainer = document.getElementById("main");
            if (mainContainer) {
                mainContainer.style.overflow = "";
            }
            modalElement[modalOpenCount].remove();
            modalElement[modalOpenCount] = null;
            modalOpenCount = modalOpenCount - 1 >= 0 ? modalOpenCount - 1 : 0;
            console.log("MOdal counter:", modalOpenCount);
        }
    }, 200);
}
