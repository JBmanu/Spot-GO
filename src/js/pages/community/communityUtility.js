
const P404_MSG = {
    "follows": {emoji: '🥲', testo: 'Non segui ancora nessuno'},
    "following": {emoji: '🙄', testo: 'Nessuno ancora ti segue'},
    "results": {emoji: '🤷🏼‍♂️', testo: 'Nessun utente trovato'},
    "suggested": {emoji: '', testo: 'Per ora nessuna proposta'},
    "default" : {emoji: '🔍', testo: 'Nessun risultato'},
};

/**
 * Generate item list providing containerId, array of items
 * and itemIdName (is used to identify html nodes about this items).
 */
export async function showsItemsInContainer(items, emptyMsgfor, containerId, itemBuilder) {
    const errData = P404_MSG[emptyMsgfor] || P404_MSG["default"];
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    if (items.length === 0) {
        container.appendChild(createEmptyStateNode(errData.emoji, errData.testo));
        return;
    } else {
        appendHtmlChild(items, container, itemBuilder);
    }
}

function appendHtmlChild(datas, container, cardMaker) {
    datas.forEach(itemData => {
        const followCard = cardMaker(itemData);
        container.appendChild(followCard);
    });
}

function createEmptyStateNode(emoji = '🔍', message = 'Nessun utente trovato') {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <div class="empty-state-content">
            <span class="empty-state-emoji">${emoji}</span>
            <p class="empty-state-text">${message}</p>
        </div>
    `;
    return emptyState;
}


export function searchUsersByName(users, searchString) {
    if (!searchString || searchString.trim() === '') {
        return users;
    }
    
    const search = searchString.toLowerCase().trim();
    
    const startsWith = users.filter(u => 
        u.username?.toLowerCase().startsWith(search)
    );
    const contains = users.filter(u => 
        u.username?.toLowerCase().includes(search) && 
        !u.username?.toLowerCase().startsWith(search)
    );
    
    return [...startsWith, ...contains];
}