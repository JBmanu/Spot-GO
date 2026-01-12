import {getFriends} from "../json-data-handler";

export async function loadCommunityData() {
    await loadFriends();
    await loadSuggested();
}

async function loadFriends() {
    var friends = [] //await getFriends("AMNSHSNGXdZ0xm4XRWBS");
     for (let index = 0; index < 18; index++) {
        friends.push(
            {
                id: "id-utente-firebase",
                email: "mail@mail.com",
                username: "user " + index
            }
        );
    }
    showsItemsInContainer(friends, "friends", makeFriendCard);
}

async function loadSuggested() {
    var suggested = [] //await getSuggestedFriends("AMNSHSNGXdZ0xm4XRWBS");
     for (let index = 0; index < 18; index++) {
        suggested.push(
            {
                id: "id-utente-firebase",
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

        // Add button to show/hide all other items in list
        const selQuery = `#community-${itemIdName}-section header`;
        const header = document.querySelector(selQuery);
        const button = document.createElement('button');
        button.id = `show-all-${itemIdName}-button`;
        button.classList.add('vedi-tutti-button');
        button.textContent = 'Mostra tutti';
        button.addEventListener('click', () => toggleExpand(containerId));
        header.appendChild(button);
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

function toggleExpand(containerId) {
    const query = `#${containerId} .hidden-items`;
    const hiddenList = document.querySelector(query);
    hiddenList.classList.toggle('hidden')
    //TODO: change show-all-friends-button label
}

function removeFriend(userId) {
    //TODO remove friend from firebase
    console.log("Removed friend");
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

function makeFriendActionContainer(userId) {
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

    const removeButton = document.createElement("button");
    removeButton.setAttribute("type", "button");
    removeButton.setAttribute("class", "comm-button-action-icon");
    removeButton.setAttribute("alt", "Rimuovi amico");
    removeButton.setAttribute("aria-label", "Rimuovi amico");
    const removeIcon = document.createElement("img");
    removeIcon.src = "assets/icons/community/delete.svg";
    removeButton.appendChild(removeIcon);
    removeButton.addEventListener('click', () => removeFriend(userId));

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
    article.appendChild(makeFriendActionContainer(data.id));
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
    addIcon.src = "assets/icons/community/delete.svg";
    addButton.appendChild(addIcon);
    addButton.addEventListener('click', () => removeFriend(data.id));

    actionsContainer.appendChild(addButton);

    article.appendChild(makeCardInfo(data));
    article.appendChild(actionsContainer);

    return article;
}
