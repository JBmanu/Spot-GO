/**
 * Modifica gli ID dell'HTML del profilo per renderli univoci nell'overlay community
 * Aggiunge il prefisso "community-" a tutti gli ID
 * 
 * @param {HTMLElement} overlay - L'elemento overlay che contiene il profilo
 * @returns {Object} Mappa di ID originali -> ID modificati
 */
export function makeProfileIdsUnique(overlay) {
    if (!overlay) return {};

    const idMap = {};

    // Trova tutti gli elementi con ID nell'overlay
    const elementsWithId = overlay.querySelectorAll('[id]');

    elementsWithId.forEach((el) => {
        const originalId = el.id;
        const newId = `community-${originalId}`;

        idMap[originalId] = newId;
        el.id = newId;
    });

    // Aggiorna i data-id che potrebbero fare riferimento agli ID originali
    const elementsWithDataId = overlay.querySelectorAll('[data-id], [data-target], [aria-labelledby], [aria-controls]');
    
    elementsWithDataId.forEach((el) => {
        if (el.dataset.id && idMap[el.dataset.id]) {
            el.dataset.id = idMap[el.dataset.id];
        }
        if (el.dataset.target && idMap[el.dataset.target]) {
            el.dataset.target = idMap[el.dataset.target];
        }
        if (el.getAttribute('aria-labelledby')) {
            const origValue = el.getAttribute('aria-labelledby');
            if (idMap[origValue]) {
                el.setAttribute('aria-labelledby', idMap[origValue]);
            }
        }
        if (el.getAttribute('aria-controls')) {
            const origValue = el.getAttribute('aria-controls');
            if (idMap[origValue]) {
                el.setAttribute('aria-controls', idMap[origValue]);
            }
        }
    });

    console.log("Profile IDs modified for community overlay:", idMap);

    return idMap;
}
