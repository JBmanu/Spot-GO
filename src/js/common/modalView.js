
let modalElement = null;
let isModalOpen = false;

export async function openModal(htmlPath, parentSelector, initPageContent) {
    if (isModalOpen) return;

    const response = await fetch(htmlPath);
    if (!response.ok) return;

    const html = await response.text();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    // Prendi il primo elemento renderizzato, ignorando script, link e altri tag non visibili
    modalElement = Array.from(tempDiv.children).find(el => 
        !['SCRIPT', 'LINK', 'STYLE', 'META'].includes(el.tagName)
    );

    const parentNode = document.querySelector(parentSelector);
    if (!parentNode) return;
    parentNode.appendChild(modalElement);

    initPageContent(modalElement);

    isModalOpen = true;
    modalElement.style.display = "flex";
    requestAnimationFrame(() => {
        modalElement.classList.add("active");
    });

    const mainContainer = document.getElementById("main");
    if (mainContainer) {
        mainContainer.style.overflow = "hidden";
    }
    return modalElement;
}

/**
 * Close modal view after execution of onCloseAction
 * @param {Async function with action to do before closing modal modalElement => void} onCloseAction 
 * @returns nothing
 */
export async function closeModal(onCloseAction) {
    if (!isModalOpen || !modalElement) return;

    isModalOpen = false;
    modalElement.classList.remove("active");

    setTimeout(async () => {
        modalElement.style.display = "none";
        if (onCloseAction) {
            await onCloseAction(modalElement);
        }
        const mainContainer = document.getElementById("main");
        if (mainContainer) {
            mainContainer.style.overflow = "";
        }
        modalElement.remove();
        modalElement = null;
    }, 300);
}