
import {searchUser, getCurrentUser, getCartolinaById, getFollowingUser, removeFriend, getFollowersUser, getSuggestedFollows, addFollows, pullMessages} from "../database.js";
import {showConfirmModal} from "../ui/confirmModal.js";

export async function loadCommunityData() {
    const user = await getCurrentUser();
    if (!user) return;
    const loggedUser = await getCurrentUser();
    await Promise.all([
        loadFollowing(loggedUser.email),
        loadFollowers(loggedUser.email),
        loadSuggested(loggedUser.email)
    ]);
    initTabSelector(loggedUser.email);
}

function initTabSelector(userId) {
    const searchbarInput = document.getElementById("community-user-search-input");
    const btnCloseSearch = document.getElementById("community-close-search-btn");
    const btnFollows = document.getElementById("community-tab-follows");
    const btnFollowers = document.getElementById("community-tab-followers");
    const btnSuggested = document.getElementById("community-tab-suggested");

    const searchSection = document.getElementById("community-results-section");
    const sectionSelector = document.getElementById("community-section-selector");
    const followsSection = document.getElementById("community-follows-section");
    const followersSection = document.getElementById("community-followers-section");
    const suggestedSection = document.getElementById("community-suggested-section");

    const buttons = [btnFollows, btnFollowers, btnSuggested];
    const sections = [searchSection, followsSection, followersSection, suggestedSection];

    searchbarInput.addEventListener("input", () => {
        //if (searchbarInput.value.length < 3) return;
        searchUser(searchbarInput.value).then(results =>
            getCurrentUser().then(loggedUser =>
                getFollowingUser(loggedUser.email).then(followings => {
                    const followingIds = followings.map(f => f.email);
                    const finalRes = results.map(usr => {
                        return {
                            ...usr,
                            following: followingIds.includes(usr.email)
                        }
                    });
                    showsItemsInContainer(finalRes, "results", data =>
                        data.following ? makeFriendCard(data) : makeSuggestedCard(data));
                })
            ));
    });

    searchbarInput.addEventListener('click', ()=> {
        hideAll(sections);
        sectionSelector.classList.add('hidden');
        searchSection.classList.remove('hidden');
    });

    btnCloseSearch.addEventListener('click', ()=> {
        hideAll(sections);
        unselectAllButton(buttons);
        searchbarInput.value = '';
        const resultsDiv = document.getElementById("community-results-container");
        resultsDiv.innerHTML = '';
        sectionSelector.classList.remove('hidden');
        followsSection.classList.remove('hidden');
        btnFollows.classList.add('active-community-tab');

    });

    btnFollows.addEventListener('click', async () => {
        hideAll(sections);
        unselectAllButton(buttons);
        btnFollows.classList.add('active-community-tab');
        followsSection.classList.remove('hidden');
        await loadFollowing(userId);
    });

    btnFollowers.addEventListener('click', async () => {
        unselectAllButton(buttons);
        hideAll(sections);
        btnFollowers.classList.add('active-community-tab');
        followersSection.classList.remove('hidden');
    });

    btnSuggested.addEventListener('click', async () => {
        unselectAllButton(buttons);
        hideAll(sections);
        await loadSuggested(userId);
        btnSuggested.classList.add('active-community-tab');
        suggestedSection.classList.remove('hidden');
    }); 
}

function hideAll(nodes) {
    nodes.forEach(b => b.classList.add('hidden'));
}

function unselectAllButton(buttons) {
    buttons.forEach(b => b.classList.remove('active-community-tab'));
}

async function loadFollowing(userId) {
    getFollowingUser(userId).then(follows => 
        showsItemsInContainer(follows, "follows", makeFriendCard)
    );
}

async function loadSuggested(userId) {
    getSuggestedFollows(userId).then(suggested => 
        showsItemsInContainer(suggested, "suggested", makeSuggestedCard)
    );
}

async function loadFollowers(userId) {
    getFollowersUser(userId).then(followers => {
        showsItemsInContainer(followers, "followers", 
            data => data.followingBack ? makeFriendCard(data): makeSuggestedCard(data));
    });
}

/**
 * Generate item list providing containerId, array of items
 * and itemIdName (is used to identify html nodes about this items).
 */
async function showsItemsInContainer(items, itemIdName, cardBuilderStrategy) {
    const containerId = `community-${itemIdName}-container`;
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    if (items.length === 0) {
        container.innerHTML = '<p>Nessun elemento trovato</p>';
        return;
    } else {
        appendHtmlChild(items, container, cardBuilderStrategy);
    }
}

function appendHtmlChild(datas, container, cardMaker) {
    datas.forEach(itemData => {
        const followCard = cardMaker(itemData);
        container.appendChild(followCard);
    });
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
    addButton.addEventListener('click', () => addFollower(data.id));

    actionsContainer.appendChild(addButton);

    article.appendChild(makeCardInfo(data));
    article.appendChild(actionsContainer);

    return article;
}

/**
 * Chat loading
 */
async function fetchFriendMessages(followingData) {
    const userMail = await getCurrentUser();
    const messagesData = await pullMessages(userMail.email, followingData.email);
    const messagesPromise = messagesData.map(async msg => {
        //TODO: capire perche non  carica/legge i dati 
        const cartolina =  await getCartolinaById(msg.ref);
        return {
            ... msg,
            cartolina: cartolina
        }
    });
    const messages = await Promise.all(messagesPromise);
    renderMessages(followingData, messages);
}

function renderMessages(userData, messages) {
    document.getElementById('chat-container').classList.toggle('hidden-chat');
    const chatName = document.getElementById('user-chat-name');
    chatName.textContent = userData.username;
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML ='';
    if (messages.length > 0) {
        messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.isMittente ? 'sent' : ''}`;
    
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.innerHTML = 
            `<article class="profile-polaroid">
                <button
                        type="button"
                        class="profile-polaroid-menu"
                        aria-label="Menu polaroid">
                    ⋮
                </button>
                <div class="profile-polaroid-image-container">
                    <div class="profile-polaroid-image">
                        <img class="cardboard-image" src="${msg.cartolina.immagini[0]}">
                    </div>
                </div>
                <div class="profile-polaroid-text">
                    <h2 class="profile-polaroid-title">${msg.cartolina.title}</h2>
                    <p class="profile-polaroid-subtitle">${msg.cartolina.date}}</p>
                </div>
            </article>
            <div class='text-message'><p>${msg.testo}</p></div>`;
        
            msgDiv.appendChild(bubble);
            messagesContainer.appendChild(msgDiv);
        });
    } else {
        messagesContainer.innerHTML = '<p class="text-lg text-gray-500 text-center">Non hai ancora condiviso nessuna cartolina 🖼️</p>';;
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    // Chiudi chat
    document.getElementById('closeBtn').addEventListener('click', () => {
        document.getElementById('chat-container').classList.add('hidden-chat');
    });
}
