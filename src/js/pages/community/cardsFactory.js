import {showConfirmModal} from "../../ui/confirmModal.js";
import {openChat} from "../community/chat.js";
import {removeFriend, addFollows, getCurrentUser} from '../../database.js'
import {loadCommunityData} from '../community.js'
import {AVATAR_MAP} from "../../common/avatarImagePaths.js";
import { openModal, closeModal } from "../../common/modalViewStack.js";
import {initializeReadOnlyProfileData} from "../profile.js";

export function makeSelectableCard(userData) {
    return makeGenericCard(userData, checkboxAction(userData));
}

function checkboxAction(userData) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'receiver-checkbox checked';
    checkbox.setAttribute('data-friend-id-mail', userData.id);
    return checkbox;
}

function makeGenericCard(userData, actionContainer) {
    const article = document.createElement("article");
    article.className = "community-card";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-user-id", userData.id);
    article.appendChild(makeCardInfo(userData));
    article.appendChild(actionContainer);
    return article;
}

export function makeSuggestedCard(userData) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "card-actions-container";
    const followsText = document.createElement("p");
    const addButton = followActionBtn(userData.id, followsText);
    followsText.textContent = "Segui";
    actionsContainer.appendChild(addButton);

    const card = makeGenericCard(userData, actionsContainer)
    card.classList.add("community-suggest-card", "carousel-horizontal_item");
    return card;
}

/**
 * Generate HTML follow list item given follow data.
 * Returns an article child.
 */
export function makeFriendCard(userData) {
    return makeGenericCard(userData, makeFriendActionContainer(userData));
}

function makeCardInfo(userData) {

    const avatar = document.createElement("div");
    avatar.className = "user-avatar";

    const avatarImage = document.createElement("img");
    avatarImage.src = `../assets/icons/login-signup/${AVATAR_MAP[userData.username] || AVATAR_MAP.DEFAULT}`;
    //avatar.textContent = data.username.substring(0, 2);
    avatar.appendChild(avatarImage);

    const userInfo = document.createElement("div");
    userInfo.className = "card-user-info flex flex-col justify-between ml-4";

    const name = document.createElement("h3");
    name.className = "text-xl font-bold";
    name.textContent = userData.username;
    userInfo.appendChild(name);

    const username = document.createElement("p");
    username.className = "italic";
    username.innerHTML = `<span>@</span>${userData.username}`;
    userInfo.appendChild(username);

    const container = document.createElement("div");
    container.className = "flex flex-row items-center";
    container.appendChild(avatar);
    container.appendChild(userInfo);
    container.addEventListener('click', async () => await showUserProfileOverview(userData));
    return container;
}

async function showUserProfileOverview(userData) {
    const parentNode = document.querySelector("#community-main-body");
    const overviewName = "community-user-profile-overview";

     // Creo un wrapper cosi posso definire uno stile specifico del conteitore della pagina utente.
    // const wrapperDiv = document.createElement('div');
    // wrapperDiv.id = childNodeName;
    // wrapperDiv.className = "profile-overview-modal";
    
    const modalWrapper = document.createElement('div');
    modalWrapper.id = overviewName;
    modalWrapper.className = "profile-overview-modal-wrapper";
    parentNode.appendChild(modalWrapper);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'glass-close-btn';
    closeButton.classList.add("close-btn");
    closeButton.setAttribute('aria-label', 'Chiudi');
    closeButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    `;
    closeButton.addEventListener("click", () => {
        closeModal();
        modalWrapper.remove();
    });
    modalWrapper.appendChild(closeButton);

    await openModal("../html/profile.html", `#${overviewName}`, async (modalElement) => {
            await initializeReadOnlyProfileData(modalElement, userData);
        });
}

function makeFriendActionContainer(userData) {
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
        await openChat(userData);
    });
    actionsContainer.appendChild(messageButton);

    if (userData.followingBack == true || userData.followingBack == null) {
        const removeButton = document.createElement("button");
        removeButton.setAttribute("type", "button");
        removeButton.setAttribute("class", "comm-button-action-icon");
        removeButton.setAttribute("alt", "Rimuovi amico");
        removeButton.setAttribute("aria-label", "Rimuovi amico");
        const removeIcon = document.createElement("img");
        removeIcon.src = "assets/icons/community/delete.svg";
        removeButton.appendChild(removeIcon);
        removeButton.addEventListener('click', () => removeFollower(userData.id, userData.username));
        actionsContainer.appendChild(removeButton);
    } else {
        const followIcon = document.createElement("img");
        followIcon.src = "assets/icons/community/add_user.svg";
        const iconBtn = followActionBtn(userData.id, followIcon);
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