import {showConfirmModal} from "../../ui/confirmModal.js";
import {fetchFriendMessages} from "../community/chat.js";
import {removeFriend, addFollows, getCurrentUser} from '../../database.js'
import {loadCommunityData} from '../community.js'

function makeCardInfo(data) {
    const followAvatar = document.createElement("div");
    followAvatar.className = "user-avatar";
    followAvatar.textContent = data.username.substring(0, 2);

    const followCardData = document.createElement("div");
    followCardData.className = "user-card-data";

    const followName = document.createElement("h3");
    followName.className = "text-xl font-bold";
    followName.textContent = data.username;

    const followUsername = document.createElement("p");
    followUsername.className = "italic";
    followUsername.innerHTML = `<span>@</span>${data.username}`;

    followCardData.appendChild(followName);
    followCardData.appendChild(followUsername);

    const flexContainer = document.createElement("div");
    flexContainer.className = "flex flex-row justify-between items-center";
    flexContainer.appendChild(followAvatar);
    flexContainer.appendChild(followCardData);
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
    messageButton.addEventListener('click', async () => {
        await fetchFriendMessages(data);
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
 * Generate HTML follow list item given follow data.
 * Returns an article child.
 */
export function makeFriendCard(data) {
    const article = document.createElement("article");
    article.className = "community-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-user-id", data.id);
    article.appendChild(makeCardInfo(data));
    article.appendChild(makeFriendActionContainer(data));
    return article;
}

export function makeSuggestedCard(data) {
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
    addButton.addEventListener('click', () => addFollower(data.id));

    actionsContainer.appendChild(addButton);

    article.appendChild(makeCardInfo(data));
    article.appendChild(actionsContainer);

    return article;
}

async function removeFollower(userId, name) {
    const descr = "Non sarai più amico di " + name + ", ma potrai sempre riallacciare i rapporti.";
    const res = await showConfirmModal(`Vuoi rimuovere ${name} come amico?`, descr);
    if (res) {
        const loggedUser = await getCurrentUser();
        await removeFriend(loggedUser.email, userId).then(
            await loadCommunityData()
        );
    }
}

async function addFollower(userId) {
    const loggedUser = await getCurrentUser();
    await addFollows(loggedUser.email, userId).then(
        await loadCommunityData()
    );
}