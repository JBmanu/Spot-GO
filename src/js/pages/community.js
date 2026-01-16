
import {searchUser, getCurrentUser, getFollowingUser, getFollowersUser, getSuggestedFollows} from "../database.js";
import {makeFriendCard, makeSuggestedCard} from '../pages/community/cardsFactory.js'
import {createSearchBarWithKeyboard} from '../createComponent.js';

export async function loadCommunityData() {
    const user = await getCurrentUser();
    if (!user) return;
    const loggedUser = await getCurrentUser();
    await Promise.all([
        loadFollowing(loggedUser.email),
        loadFollowers(loggedUser.email),
        loadSuggested(loggedUser.email)
    ]);
    await configureKeyboard();
    initTabSelector(loggedUser.email);
}

async function configureKeyboard() {
    // Bind search bar and keyboard to search section.
    const {searchBarEl, keyboardEl, overlayEl} = await createSearchBarWithKeyboard("Cerca utente", onValueChangeSearch);
    const searchsection = document.getElementById("community-search-section");
    const searchInput = searchBarEl.querySelector("#view-all-saved-search");
    // Sostituisci solo con l'input estratto
    document.getElementById("community-search-input").replaceWith(searchInput);
    searchsection.appendChild(keyboardEl);
} 

function initTabSelector(userId) {
    const searchbarInput = document.getElementById("view-all-saved-search");
    const body = document.getElementById("community-main-body");
    const btnCloseSearch = document.getElementById("community-close-search-btn");
    const btnFollows = document.getElementById("community-tab-follows");
    const btnFollowers = document.getElementById("community-tab-followers");
    const btnSearch = document.getElementById("community-tab-search");

    const searchsection = document.getElementById("community-search-section");
    const followsSection = document.getElementById("community-follows-section");
    const followersSection = document.getElementById("community-followers-section");

    const buttons = [btnFollows, btnFollowers, btnSearch];
    const sections = [followsSection, followersSection];

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

    btnSearch.addEventListener('click', () => {
        console.log("Open search modal");
        const searchsection = document.getElementById("community-search-section");
        searchsection.classList.remove('hidden');
        body.classList.add('hidden');
    });

    btnCloseSearch.addEventListener('click', ()=> {
        searchbarInput.value = '';
        const resultsDiv = document.getElementById("community-results-container");
        resultsDiv.innerHTML = '';
        searchsection.classList.add('hidden');
        body.classList.remove('hidden');
    });
}

function onValueChangeSearch(value) {
    searchUser(value).then(results =>
        getCurrentUser().then(loggedUser =>
            getFollowingUser(loggedUser.email).then(followings => {
                const followingIds = followings.map(f => f.email);
                const finalRes = results.map(usr => {
                    return {
                        ...usr,
                        followingBack: followingIds.includes(usr.email)
                    }
                });
                showsItemsInContainer(finalRes, "results", data => makeFriendCard(data));
            })
        ));

}

function hideAll(nodes) {
    nodes.forEach(b => b.classList.add('hidden'));
}

function unselectAllButton(buttons) {
    buttons.forEach(b => b.classList.remove('active-community-tab'));
}

async function loadFollowing(userId) {
    getFollowingUser(userId).then(follows => 
        showsItemsInContainer(follows, "follows", data => makeFriendCard(data))
    );
}

async function loadSuggested(userId) {
    getSuggestedFollows(userId).then(suggested => 
        showsItemsInContainer(suggested, "suggested", data => makeSuggestedCard(data))
    );
}

async function loadFollowers(userId) {
    getFollowersUser(userId).then(followers => {
        showsItemsInContainer(followers, "followers", data => makeFriendCard(data));
    });
}

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
async function showsItemsInContainer(items, itemIdName, cardBuilderStrategy) {
    const containerId = `community-${itemIdName}-container`;
    const errData = P404_MSG[itemIdName] || P404_MSG["default"];
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    if (items.length === 0) {
        container.appendChild(createEmptyStateNode(errData.emoji, errData.testo));
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

