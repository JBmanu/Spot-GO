async function loadComponentAsDocument(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) return;

        const html = await response.text();
        const parser = new DOMParser();
        const tempDoc = parser.parseFromString(html, "text/html");
        return tempDoc;
    } catch (err) {
        console.log(`Errore nel caricamento del componente [${path}]`);
    }
}

/**
 * Crea una search bar configurabile.
 *
 * @param {string} placeholder - Testo mostrato nel campo di ricerca.
 * @param {(value: string, event: Event) => void} onValueChanged - Funzione eseguita quando la ricerca cambia.
 * @returns {Promise<HTMLElement>} Elemento DOM pronto per essere aggiunto alla pagina.
 */
export async function createSearchBar(placeholder, onValueChanged) {
    const doc = await loadComponentAsDocument("../html/common-components/search-bar.html");
    const root = doc.body.firstElementChild;

    const input = root.querySelector("#view-all-saved-search");

    // Placeholder
    input.placeholder = placeholder;

    // OnValueChanged
    input.addEventListener("input", e => {
        onValueChanged(e.target.value);
    });

    return root;
}
