
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
    initTabSelector();
}

async function configureKeyboard() {
    // Bind search bar and keyboard to search section.
    const {searchBarEl, keyboardEl, overlayEl, newId} = await createSearchBarWithKeyboard("Cerca utente", onValueChangeSearch);
    const communityPage = document.querySelector(".app-toolbar");
    communityPage.appendChild(keyboardEl);
    const searchBar = document.querySelector("#search-bar-placeholder");
    searchBar.replaceWith(searchBarEl);
    keyboardSetted = true;
}

function initTabSelector() {
    const tabs = {
        "follows": {
        button: document.getElementById("community-tab-follows"),
        section: document.getElementById("community-follows-section"),
        sliderPosition: '1%'
        },
        "followers": {
        button: document.getElementById("community-tab-followers"),
        section: document.getElementById("community-followers-section"),
        sliderPosition: '51%'
        }
    };

    const slider = document.querySelector('.community-slider');
    const switchToTab = (tabName) => {
        const selectedTab = tabs[tabName];
        
        Object.values(tabs).forEach(tab => {
            tab.button.classList.remove('is-active');
            tab.section.classList.add('hidden');
        });

        selectedTab.button.classList.add('is-active');
        selectedTab.section.classList.remove('hidden');
        
        if (slider) slider.style.left = selectedTab.sliderPosition;
    };

    Object.entries(tabs).forEach(([tabName, tab]) => {
        tab.button.addEventListener('click', () => switchToTab(tabName));
    });
}

function onValueChangeSearch(value) {
    getCurrentUser().then(u => {
        loadSuggested(u.id, value);
        loadFollowing(u.id, value);
        loadFollowers(u.id, value);
    });
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

