import {showConfirmModal} from "../../ui/confirmModal.js";
import {openChat} from "../community/chat.js";
import {removeFriend, addFollows, getCurrentUser} from '../../database.js'
import {loadCommunityData} from '../community.js'
import {AVATAR_MAP} from "../../common/avatarImagePaths.js";
import {initializeReadOnlyProfileData} from "../profile.js";
import { closeOverlayAndReveal } from "../../common/back.js";
import { makeProfileIdsUnique } from "./profileIdModifier.js";
import {openPolaroidDetail} from "../polaroidDetail.js";

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
    username.className = "user-card-username";
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
    const main = document.getElementById("main");
    if (!main) return;

    try {
        // 1. Fetch HTML del profilo
        const res = await fetch("../html/profile.html");
        if (!res.ok) return;
        
        const html = await res.text();

        // 2. Chiudi overlay precedente se esiste (per navigare tra profili)
        const existingOverlay = main.querySelector('[data-overlay-view="community-user-profile"]');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // 3. Nascondi la sezione community (come fanno gli altri overlay)
        const communitySection = main.querySelector('[data-section-view="community"]');
        if (communitySection) {
            communitySection.hidden = true;
        }

        // 4. Crea nuovo overlay con data-overlay-view univoco
        const overlay = document.createElement("div");
        overlay.dataset.overlayView = "community-user-profile";
        overlay.dataset.returnView = "community";  // Torna a community
        overlay.classList.add("page-slide-in");    // Animazione slide
        overlay.innerHTML = html;

        main.appendChild(overlay);

        setupReadOnlyProfileHeader(overlay);

        // 5. Inizializza il profilo read-only 
        await initializeReadOnlyProfileData(overlay, userData);
        makeProfileIdsUnique(overlay);


    } catch (err) {
        console.error("Error loading user profile:", err);
    }
}

function setupReadOnlyProfileHeader(overlay) {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    if (!headerLeftLogo) return;

    // Sostituisci il logo con back button
    headerLeftLogo.innerHTML = `
        <button type="button" id="back-button" data-back aria-label="Torna indietro"
            class="flex items-center justify-center w-10 h-10">
            <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
        </button>
    `;

    // Aggiungi handler di cleanup quando l'overlay viene chiuso
    overlay.onClose = () => {
        // Chiudi anche il dettaglio della polaroid se è aperto
        const main = document.getElementById("main");
        if (main) {
            const polaroidDetail = main.querySelector('[data-overlay-view="polaroid-detail"]');
            if (polaroidDetail) {
                try {
                    polaroidDetail.remove();
                } catch (_) {
                    if (polaroidDetail.parentNode) {
                        polaroidDetail.parentNode.removeChild(polaroidDetail);
                    }
                }
            }
        }

        try {
            if (overlay.parentNode) {
                overlay.remove();
            }
        } catch (_) {
            // Fallback se remove() non funziona
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }
    };

    // Aggiungi event listener al back button
    const backBtn = headerLeftLogo.querySelector("#back-button");
    if (backBtn) {
        backBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Chiudi il dettaglio della polaroid se è aperto
            const main = document.getElementById("main");
            if (main) {
                const polaroidDetail = main.querySelector('[data-overlay-view="polaroid-detail"]');
                if (polaroidDetail) {
                    try {
                        polaroidDetail.remove();
                    } catch (_) {
                        if (polaroidDetail.parentNode) {
                            polaroidDetail.parentNode.removeChild(polaroidDetail);
                        }
                    }
                }
            }
            
            // Chiudi l'overlay (che triggeha onClose e rimuove dal DOM)
            closeOverlayAndReveal({ 
                overlay,
                returnViewKey: "community" 
            });
            
            // Extra: assicura rimozione dopo l'animazione
            setTimeout(() => {
                if (overlay.parentNode) {
                    try {
                        overlay.remove();
                    } catch (_) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }
            }, 350);
        });
    }

    // Nascondi logo testo
    const logoText = overlay.querySelector("#header-logo-text");
    if (logoText) logoText.style.display = "none";

    // Mostra titolo
    const title = overlay.querySelector("#header-title");
    if (title) {
        title.textContent = "Profilo Utente";
        title.classList.remove("hidden");
    }
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