import {showConfirmModal} from "../../ui/confirmModal.js";
import {fetchFriendMessages} from "../community/chat.js";
import {removeFriend, addFollows, getCurrentUser} from '../../database.js'
import {loadCommunityData} from '../community.js'
import {AVATAR_MAP} from "../../common/avatarImagePaths.js";

export function makeSuggestedCard(data) {

    const article = document.createElement("article");
    article.className = "carousel-horizontal_item community-card community-suggest-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-user-id", data.id);

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "card-actions-container";

    const followsText = document.createElement("p");
    followsText.textContent = "Segui";

    const addButton = followActionBtn(data.id, followsText);
    actionsContainer.appendChild(addButton);

    article.appendChild(makeCardInfo(data));
    article.appendChild(actionsContainer);

    return article;
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

function makeCardInfo(data) {

    const avatar = document.createElement("div");
    avatar.className = "user-avatar";

    const avatarImage = document.createElement("img");
    avatarImage.src = `../assets/icons/login-signup/${AVATAR_MAP[data.username] || AVATAR_MAP.DEFAULT}`;
    //avatar.textContent = data.username.substring(0, 2);
    avatar.appendChild(avatarImage);

    const userInfo = document.createElement("div");
    userInfo.className = "card-user-info flex flex-col justify-between ml-4";

    const name = document.createElement("h3");
    name.className = "text-xl font-bold";
    name.textContent = data.username;
    userInfo.appendChild(name);

    const username = document.createElement("p");
    username.className = "italic";
    username.innerHTML = `<span>@</span>${data.username}`;
    userInfo.appendChild(username);

    const container = document.createElement("div");
    container.className = "flex flex-row items-center";
    container.appendChild(avatar);
    container.appendChild(userInfo);
    return container;
}

function makeFriendActionContainer(data) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "card-actions-container";

    if (data.followingBack == true || data.followingBack == null) {
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
    } else {
        const followIcon = document.createElement("img");
        followIcon.src = "assets/icons/community/add_user.svg";
        const iconBtn = followActionBtn(data.id, followIcon);
        actionsContainer.appendChild(iconBtn);
    }
    return actionsContainer;
}


function followActionBtn(userId, btnBody) {
    const addButton = document.createElement("button");
    addButton.setAttribute("type", "button");
    addButton.setAttribute("class", "comm-button-action-icon follow-btn");
    addButton.setAttribute("alt", "Aggiungi amico");
    addButton.setAttribute("aria-label", "Aggiungi amico");
    addButton.appendChild(btnBody);
    addButton.addEventListener('click', () => addFollower(userId));
    return addButton;
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