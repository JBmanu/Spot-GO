import {getFriends} from "../json-data-handler";

export async function loadCommunityData() {
    await loadFriends();
}

async function loadFriends() {
    const container = document.getElementById("community-friends-container");
    container.innerHTML = "";
    var friends = [] //await getFriends("AMNSHSNGXdZ0xm4XRWBS");
    console.log(friends);

    for (let index = 0; index < 18; index++) {
        friends.push(
            {
                id: "id-utente-firebase",
                email: "mail@mail.com",
                username: "user " + index
            }
        );
    }

    if (friends.length === 0) {
        container.innerHTML = '<p>Nessun amico trovato</p>';
        return;
    } else {
        const friendsVisible = 5;
        const [friendsOne, friendsTwo] = splitArray(friends, friendsVisible);
        appendHtmlChild(friendsOne, container);

        const hiddenDiv = document.createElement('div');
        hiddenDiv.id = 'hidden-friends';
        hiddenDiv.classList.add('hide-other');
        appendHtmlChild(friendsTwo, hiddenDiv);
        container.appendChild(hiddenDiv); 

        // Add button to show/hide all other friends in list
        const header = document.querySelector('#community-friends-section header');
        const button = document.createElement('button');
        button.id = 'show-all-friends-button';
        button.classList.add('vedi-tutti-button');
        button.textContent = 'Mostra tutti';
        button.addEventListener('click', toggleExpandFriends);
        header.appendChild(button);
    }
}

function appendHtmlChild(items, container) {
    items.forEach(element => {
        const friendCard = makeFriendCard(element);
        container.appendChild(friendCard);
    });
}

function splitArray(arr = [], firstSize = 0) {
    const first = arr.slice(0, firstSize);
    const second = arr.slice(firstSize);
    return [first, second];
}

function toggleExpandFriends() {
    const hiddenList = document.querySelector('#hidden-friends');
    hiddenList.classList.toggle('hide-other')
}

/**
 * Generate HTML friend list item given friend data.
 * Returns an article child.
 */
function makeFriendCard(data) {
    const article = document.createElement("article");
    article.className = "community-friend-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-friend-id", data.id);

    const friendAvatar = document.createElement("div");
    friendAvatar.className = "friend-avatar";
    friendAvatar.textContent = data.username.substring(0, 2);

    const friendCardData = document.createElement("div");
    friendCardData.className = "friend-card-data";

    const friendName = document.createElement("h3");
    friendName.className = "text-xl font-bold";
    friendName.textContent = data.username;

    const friendUsername = document.createElement("p");
    friendUsername.className = "font-bold italic";
    friendUsername.innerHTML = `<span>@</span>${data.username}`;

    friendCardData.appendChild(friendName);
    friendCardData.appendChild(friendUsername);

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "card-actions-container";

    const messageButton = document.createElement("button");
    messageButton.setAttribute("type", "button");
    messageButton.setAttribute("class", "comm-button-action-icon");
    messageButton.setAttribute("alt", "Send message");
    messageButton.setAttribute("aria-label", "Send message friend");
    const messageIcon = document.createElement("img");
    messageIcon.src = "assets/icons/community/message.svg";
    messageIcon.alt = "Message Icon";
    messageButton.appendChild(messageIcon);

    const removeButton = document.createElement("button");
    removeButton.setAttribute("type", "button");
    removeButton.setAttribute("class", "comm-button-action-icon");
    removeButton.setAttribute("alt", "Remove friend");
    removeButton.setAttribute("aria-label", "Remove friend");
    const removeIcon = document.createElement("img");
    removeIcon.src = "assets/icons/community/delete.svg";
    removeIcon.alt = "Remove friend";
    removeButton.appendChild(removeIcon);

    actionsContainer.appendChild(messageButton);
    actionsContainer.appendChild(removeButton);

    const flexContainer = document.createElement("div");
    flexContainer.className = "flex flex-row justify-between items-center";
    flexContainer.appendChild(friendAvatar);
    flexContainer.appendChild(friendCardData);

    article.appendChild(flexContainer);
    article.appendChild(actionsContainer);

    return article;
}
