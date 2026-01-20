
import {getCurrentUser, getFollowingUser, getFollowersUser, getSuggestedFollows} from "../database.js";
import {makeFriendCard, makeSuggestedCard} from '../pages/community/cardsFactory.js'
import {createSearchBarWithKeyboard} from '../createComponent.js';
import {showsItemsInContainer, searchUsersByName} from './community/communityUtility.js'
import { closeChat } from './community/chat.js';
let keyboardSetted = false;

export async function loadCommunityData(arg) {
    const user = await getCurrentUser();
    if (!user) return;
    const loggedUser = await getCurrentUser();
    closeChat({ animated: false });

    await Promise.all([
        loadFollowing(loggedUser.email),
        loadFollowers(loggedUser.email),
        loadSuggested(loggedUser.email)
    ]);
    if (keyboardSetted !== true) {
        await configureKeyboard();
    }
    initTabSelector(loggedUser.email);
}

async function configureKeyboard() {
    // Bind search bar and keyboard to search section.
    const {searchBarEl, keyboardEl, overlayEl} = await createSearchBarWithKeyboard("Cerca utente", onValueChangeSearch);
    const communityPage = document.querySelector(".app-toolbar");
    //Estrai nodo input
    const searchInput = searchBarEl.querySelector("#view-all-saved-search");
    // Sostituisci l'input mio con quello estratto e associato alla keyboard
    const oldInput = document.getElementById("community-search-input");
    // oldInput.replaceWith(searchInput);
    if (oldInput) {
        oldInput.replaceWith(searchInput);
    }
    communityPage.appendChild(keyboardEl);
    keyboardSetted = true;
}


function initTabSelector(userId) {
    const btnFollows = document.getElementById("community-tab-follows");
    const btnFollowers = document.getElementById("community-tab-followers");
    const followsSection = document.getElementById("community-follows-section");
    const followersSection = document.getElementById("community-followers-section");
    const buttons = [btnFollows, btnFollowers];
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

}

function onValueChangeSearch(value) {
    getCurrentUser().then(u => {
        loadSuggested(u.id, value);
        loadFollowing(u.id, value);
        loadFollowers(u.id, value);
    });

}

function hideAll(nodes) {
    nodes.forEach(b => b.classList.add('hidden'));
}

function unselectAllButton(buttons) {
    buttons.forEach(b => b.classList.remove('active-community-tab'));
}

async function loadFollowing(userId, searchTerm = null) {
    getFollowingUser(userId).then(follows =>
        showsItemsInContainer(
            searchUsersByName(follows, searchTerm), 
            'follows', 
            'community-follows-container', 
            data => makeFriendCard(data)
        )
    );
}

async function loadSuggested(userId, searchTerm = null) {
    getSuggestedFollows(userId).then(suggested => 
        showsItemsInContainer(
            searchUsersByName(suggested, searchTerm), 
            'suggested', 
            "community-suggested-container", 
            data => makeSuggestedCard(data)
        )
    );
}

async function loadFollowers(userId, searchTerm = null) {
    getFollowersUser(userId).then(followers => {
        showsItemsInContainer(
            searchUsersByName(followers, searchTerm), 
            'followers', 
            "community-followers-container", 
            data => makeFriendCard(data)
        );
    });
}

