
import {getCurrentUser, getFriends, removeFriend} from "../database.js";
import {showConfirmModal} from "../ui/confirmModal.js";

export async function loadCommunityData() {
    const user = await getCurrentUser();
    if (!user) return;

    await loadFriends(user.id);
    await loadSuggested(user.id);
}

async function loadFriends() {
    var friends = await getFriends("teo@gmail.com");
    console.log(friends);
    showsItemsInContainer(friends, "friends", makeFriendCard);
}

async function loadSuggested() {
    var suggested = [] //await getSuggestedFriends("AMNSHSNGXdZ0xm4XRWBS");
     for (let index = 0; index < 5; index++) {
        suggested.push(
            {
                id: "id-utente"+index,
                email: "suggested@mail.com",
                username: "suggested " + index
            }
        );
    }
    showsItemsInContainer(suggested, "suggested", makeSuggestedCard);
}

/**
 * Generate item list providing containerId, array of items
 * and itemIdName (is used to identify html nodes about this items).
 */
async function showsItemsInContainer(items, itemIdName, cardBuilder) {
    const containerId = `community-${itemIdName}-container`;
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = '<p>Nessun elemento trovato</p>';
        return;
    } else {
        const itemsVisible = 5;
        const [partOne, partTwo] = splitArray(items, itemsVisible);
        appendHtmlChild(partOne, container, cardBuilder);

        const hiddenDiv = document.createElement('div');
        hiddenDiv.classList.add('hidden-items');
        hiddenDiv.classList.add('hidden');
        appendHtmlChild(partTwo, hiddenDiv, cardBuilder);
        container.appendChild(hiddenDiv); 
        
        if (items.length >= itemsVisible) {
            // Add button to show/hide all other items in list
            const selQuery = `#community-${itemIdName}-section header`;
            const header = document.querySelector(selQuery);
            const button = document.createElement('button');
            button.id = `show-all-${itemIdName}-button`;
            button.classList.add('vedi-tutti-button');
            button.textContent = 'Mostra tutti';
            button.addEventListener('click', () => toggleExpand(containerId, button));
            header.appendChild(button);
        }
        
    }
}

function appendHtmlChild(datas, container, cardMaker) {
    datas.forEach(itemData => {
        const friendCard = cardMaker(itemData);
        container.appendChild(friendCard);
    });
}

function splitArray(arr = [], firstSize = 0) {
    const first = arr.slice(0, firstSize);
    const second = arr.slice(firstSize);
    return [first, second];
}

function toggleExpand(containerId, button) {
    const query = `#${containerId} .hidden-items`;
    const hiddenList = document.querySelector(query);
    hiddenList.classList.toggle('hidden')
    const btnLabel = hiddenList.classList.contains('hidden') ? "Mostra tutti" : "Nascondi";
    button.textContent = btnLabel;
}

async function removeFollower(userId, name) {
    const descr = "Non sarai più amico di " + name + ", ma potrai sempre riallacciare i rapporti.";
    const res = await showConfirmModal(`Vuoi rimuovere ${name} come amico?`, descr);
    if (res) {
        //TODO: fix current user email, it not mathc to the one on firebase
        const loggedUser = await getCurrentUser();
        await removeFriend(/*loggedMail.username*/"teo@gmail.com", userId).then(
            await loadFriends()
        );
    }
}

function addFriend(userId) {
    console.log(`Add ${userId} to friends`);
}

function makeCardInfo(data) {
    const friendAvatar = document.createElement("div");
    friendAvatar.className = "user-avatar";
    friendAvatar.textContent = data.username.substring(0, 2);

    const friendCardData = document.createElement("div");
    friendCardData.className = "user-card-data";

    const friendName = document.createElement("h3");
    friendName.className = "text-xl font-bold";
    friendName.textContent = data.username;

    const friendUsername = document.createElement("p");
    friendUsername.className = "font-bold italic";
    friendUsername.innerHTML = `<span>@</span>${data.username}`;

    friendCardData.appendChild(friendName);
    friendCardData.appendChild(friendUsername);

    const flexContainer = document.createElement("div");
    flexContainer.className = "flex flex-row justify-between items-center";
    flexContainer.appendChild(friendAvatar);
    flexContainer.appendChild(friendCardData);
    return flexContainer;
}

function makeFriendActionContainer(data) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "card-actions-container";
    const messageButton = document.createElement("button");
    messageButton.setAttribute("type", "button");
    messageButton.setAttribute("class", "comm-button-action-icon");
    messageButton.setAttribute("alt", "Invia messaggio");
    messageButton.setAttribute("aria-label", "Invia messaggio");
    const messageIcon = document.createElement("img");
    messageIcon.src = "assets/icons/community/message.svg";
    messageButton.appendChild(messageIcon);
    messageButton.addEventListener('click', () => {
        renderMessages(data);
    });

    const removeButton = document.createElement("button");
    removeButton.setAttribute("type", "button");
    removeButton.setAttribute("class", "comm-button-action-icon");
    removeButton.setAttribute("alt", "Rimuovi amico");
    removeButton.setAttribute("aria-label", "Rimuovi amico");
    const removeIcon = document.createElement("img");
    removeIcon.src = "assets/icons/community/delete.svg";
    removeButton.appendChild(removeIcon);
    removeButton.addEventListener('click', () => removeFollower(data.id, data.username));

    actionsContainer.appendChild(messageButton);
    actionsContainer.appendChild(removeButton);
    return actionsContainer;
}

/**
 * Generate HTML friend list item given friend data.
 * Returns an article child.
 */
function makeFriendCard(data) {
    const article = document.createElement("article");
    article.className = "community-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-user-id", data.id);
    article.appendChild(makeCardInfo(data));
    article.appendChild(makeFriendActionContainer(data));
    return article;
}

function makeSuggestedCard(data) {
    const article = document.createElement("article");
    article.className = "community-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-user-id", data.id);

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "card-actions-container";

    const addButton = document.createElement("button");
    addButton.setAttribute("type", "button");
    addButton.setAttribute("class", "comm-button-action-icon");
    addButton.setAttribute("alt", "Aggiungi amico");
    addButton.setAttribute("aria-label", "Aggiungi amico");
    const addIcon = document.createElement("img");
    addIcon.src = "assets/icons/community/add_user.svg";
    addButton.appendChild(addIcon);
    addButton.addEventListener('click', () => addFriend(data.id));

    actionsContainer.appendChild(addButton);

    article.appendChild(makeCardInfo(data));
    article.appendChild(actionsContainer);

    return article;
}

/**
 * Chat loading
 */

// Messaggi di esempio
const messages = [
    { sent: false, image: 'https://via.placeholder.com/200?text=Immagine+1', text: 'Guarda questa foto!' },
    { sent: true, text: 'Bellissima! 😊' },
    { sent: false, image: 'https://via.placeholder.com/200?text=Paesaggio', text: 'L\'ho scattata ieri al tramonto' },
    { sent: true, image: 'https://via.placeholder.com/200?text=Risposta', text: 'Spettacolare!' },
    { sent: false, text: 'Vuoi venire sabato?' },
    { sent: false, image: 'https://via.placeholder.com/200?text=Immagine+1', text: 'Guarda questa foto!' },
    { sent: true, text: 'Bellissima! 😊' },
    { sent: false, image: 'https://via.placeholder.com/200?text=Paesaggio', text: 'L\'ho scattata ieri al tramonto' },
    { sent: true, image: 'https://via.placeholder.com/200?text=Risposta', text: 'Spettacolare!' },
    { sent: false, text: 'Vuoi venire sabato?' },
    { sent: false, image: 'https://via.placeholder.com/200?text=Immagine+1', text: 'Guarda questa foto!' },
    { sent: true, text: 'Bellissima! 😊' },
    { sent: false, image: 'https://via.placeholder.com/200?text=Paesaggio', text: 'L\'ho scattata ieri al tramonto' },
    { sent: true, image: 'https://via.placeholder.com/200?text=Risposta', text: 'Spettacolare!' },
    { sent: false, text: 'Vuoi venire sabato?' }
];

function renderMessages(userData) {
    document.getElementById('chat-container').classList.toggle('hidden-chat');
    const chatName = document.getElementById('user-chat-name');
    chatName.textContent = userData.username;
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    messages.forEach((msg, idx) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${msg.sent ? 'sent' : ''}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // if (msg.image) {
    //     const img = document.createElement('img');
    //     img.src = msg.image;
    //     img.className = 'message-image';
    //     bubble.appendChild(img);
    // }
    
    if (msg.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = msg.text;
        bubble.appendChild(textDiv);
    }
    
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);
    });
    
    // Scorri in fondo
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Chiudi chat
    document.getElementById('closeBtn').addEventListener('click', () => {
        document.getElementById('chat-container').classList.add('hidden-chat');
    });
}
