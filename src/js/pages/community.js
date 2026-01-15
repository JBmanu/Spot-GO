
import {searchUser, getCurrentUser, getFollowingUser, getFollowersUser, getSuggestedFollows} from "../database.js";
import {makeFriendCard, makeSuggestedCard} from '../pages/community/cardsFactory.js'

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

