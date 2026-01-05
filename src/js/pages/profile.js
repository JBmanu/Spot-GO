import {getSavedSpots, getReviews, getVisitedSpots, getCreatedSpots} from "../json-data-handler.js";

let loadViewAllSaved;

const __profileDepsReady = Promise.all([
    import("./viewAllSaved.js").then((m) => {
        loadViewAllSaved = m.loadViewAllSaved;
    }),
]).catch((err) => {
    console.error("Errore nel caricamento dei moduli in profile.js:", err);
});

async function loadProfileOverview(wrapper) {
    await __profileDepsReady;

    const overviewContainer = wrapper;
    if (!overviewContainer) return;

    await initializeProfileData(overviewContainer);
}

async function initializeProfileData(overviewContainer) {
    await __profileDepsReady;

    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return;

    const user = JSON.parse(currentUserStr);

    const profileData = {
        name: user.username || "",
        username: user.username ? "@" + user.username : "",
        email: user.email || "",
        avatar: (user.username || "?")[0].toUpperCase(),
    };

    updateProfileUI(profileData);

    await updateUserCounters(user.username);

    const savedSpotsButton = overviewContainer.querySelector("#profile-saved-spots-button");
    if (savedSpotsButton) {
        if (savedSpotsButton.dataset.bound !== "true") {
            savedSpotsButton.dataset.bound = "true";

            savedSpotsButton.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (typeof loadViewAllSaved !== "function") {
                    console.error("loadViewAllSaved is not a function");
                    return;
                }

                await loadViewAllSaved("profile");
            });
        }
    } else {
        console.error("savedSpotsButton not found");
    }

}

function updateProfileUI(data) {
    const nameEl = document.getElementById("profile-name");
    const usernameEl = document.getElementById("profile-username");
    const emailEl = document.getElementById("profile-email");
    const avatarEl = document.getElementById("profile-avatar");

    if (nameEl) nameEl.textContent = data.name;
    if (usernameEl) usernameEl.textContent = data.username;
    if (emailEl) emailEl.textContent = data.email;
    if (avatarEl) avatarEl.textContent = data.avatar;
}

async function updateUserCounters(username) {
    try {
        const [saved, reviews, visited, created] = await Promise.all([
            getSavedSpots(username),
            getReviews(username),
            getVisitedSpots(username),
            getCreatedSpots(username)
        ]);

        const savedCount = saved.length;
        const reviewsCount = reviews.length;
        const visitedCount = visited.length;
        const createdCount = created.length;

        const savedEl = document.getElementById("saved-spots");
        const reviewsEl = document.getElementById("written-reviews");
        const visitedEl = document.getElementById("visited-spots");
        const createdEl = document.getElementById("created-spots");

        if (savedEl) savedEl.textContent = savedCount;
        if (reviewsEl) reviewsEl.textContent = reviewsCount;
        if (visitedEl) visitedEl.textContent = visitedCount;
        if (createdEl) createdEl.textContent = createdCount;
    } catch (error) {
        console.error("Errore nell'aggiornamento dei contatori:", error);
    }
}

window.reloadProfile = async function () {
    await loadProfileOverview();
};

export {loadProfileOverview};
