import {getFriends} from "./query";

export async function loadCommunityData() {
    await loadFriends();
}

async function loadFriends() {
    const container = document.getElementById("community-friends-container");
    const friends = await getFriends("scmccT6uz6cRjYRRVgmz");
    friends.forEach(element => {
        console.log(element);
        const friendCard = makeFriendCard(element);
        container.appendChild(friendCard);
    });
}

function makeFriendCard(data) {
    const article = document.createElement("article");
    article.className = "community-friend-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-friend-id", data.id);

    const friendAvatar = document.createElement("div");
    friendAvatar.className = "friend-avatar";
    friendAvatar.textContent = data.username;//.substring(0, 2);

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
    messageButton.setAttribute("alt", "Send message");
    messageButton.setAttribute("aria-label", "Send message friend");
    const messageIcon = document.createElement("img");
    messageIcon.src = "assets/icons/community/message.svg";
    messageIcon.alt = "Message Icon";
    messageButton.appendChild(messageIcon);

    const removeButton = document.createElement("button");
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
