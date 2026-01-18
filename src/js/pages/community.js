
import {searchUser, getCurrentUser, getFollowingUser, getFollowersUser, getSuggestedFollows} from "../database.js";
import {makeFriendCard, makeSuggestedCard} from '../pages/community/cardsFactory.js'
import {createSearchBarWithKeyboard} from '../createComponent.js';
import {showsItemsInContainer} from './community/communityUtility.js'
let keyboardSetted = false;

export async function loadCommunityData() {
    const user = await getCurrentUser();
    if (!user) return;
    const loggedUser = await getCurrentUser();
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
    const communityPage = document.querySelector('[data-section-view="community"]');
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

let currentTab = null;

function initTabSelector(userId) {
    const searchbarInput = document.getElementById("view-all-saved-search");
    const tabSelector = document.getElementById("community-section-selector");
    const btnCloseSearch = document.getElementById("community-close-search-btn");
    const btnFollows = document.getElementById("community-tab-follows");
    const btnFollowers = document.getElementById("community-tab-followers");
    const btnSearch = document.getElementById("community-tab-search");

    const searchsection = document.getElementById("community-search-section");
    const followsSection = document.getElementById("community-follows-section");
    const followersSection = document.getElementById("community-followers-section");

    const buttons = [btnFollows, btnFollowers, btnSearch];
    const sections = [followsSection, followersSection, searchsection];

    currentTab = followsSection;

    btnFollows.addEventListener('click', async () => {
        currentTab = followsSection;
        hideAll(sections);
        unselectAllButton(buttons);
        btnFollows.classList.add('active-community-tab');
        followsSection.classList.remove('hidden');
        await loadFollowing(userId);
    });

    btnFollowers.addEventListener('click', async () => {
        currentTab = followersSection;
        unselectAllButton(buttons);
        hideAll(sections);
        btnFollowers.classList.add('active-community-tab');
        followersSection.classList.remove('hidden');
    });

    btnSearch.addEventListener('click', () => {
        hideAll(sections);
        tabSelector.classList.add('hidden');
        searchsection.classList.remove('hidden');
    });

    btnCloseSearch.addEventListener('click', ()=> {
        searchbarInput.value = '';
        const resultsDiv = document.getElementById("community-results-container");
        resultsDiv.innerHTML = '';
        searchsection.classList.add('hidden');
        tabSelector.classList.remove('hidden');
        currentTab.classList.remove('hidden');
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
                showsItemsInContainer(finalRes, "results", "community-results-container", data => makeFriendCard(data));
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
        showsItemsInContainer(follows, 'follows', 'community-follows-container', data => makeFriendCard(data))
    );
}

async function loadSuggested(userId) {
    getSuggestedFollows(userId).then(suggested => 
        showsItemsInContainer(suggested, 'suggested', "community-suggested-container", data => makeSuggestedCard(data))
    );
}

async function loadFollowers(userId) {
    getFollowersUser(userId).then(followers => {
        showsItemsInContainer(followers, 'followers', "community-followers-container", data => makeFriendCard(data));
    });
}
