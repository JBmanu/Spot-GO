import {getFirstUser, getReviews, getCreatedSpots, getVisitedSpots, getSavedSpots} from "../query.js";

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

    const user = await getFirstUser();
    if (!user) return;

    const profileData = {
        name: user.username || "",
        username: user.username ? "@" + user.username : "",
        email: user.email || "",
        avatar: (user.username || "?")[0].toUpperCase(),
    };

    updateProfileUI(profileData);

    if (user.id != null) {
        await updateUserCounters(user.id);
    }

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

async function updateUserCounters(userId) {
    await __profileDepsReady;

    const writtenReviews = document.getElementById("written-reviews");
    const createdSpots = document.getElementById("created-spots");
    const visitedSpots = document.getElementById("visited-spots");
    const savedSpots = document.getElementById("saved-spots");

    const [reviews, created, visited, saved] = await Promise.all([
        getReviews?.(userId),
        getCreatedSpots?.(userId),
        getVisitedSpots?.(userId),
        getSavedSpots?.(userId),
    ]);

    const r = Array.isArray(reviews) ? reviews : [];
    const c = Array.isArray(created) ? created : [];
    const v = Array.isArray(visited) ? visited : [];
    const s = Array.isArray(saved) ? saved : [];

    if (writtenReviews) writtenReviews.textContent = String(r.length);
    if (createdSpots) createdSpots.textContent = String(c.length);
    if (visitedSpots) visitedSpots.textContent = String(v.length);
    if (savedSpots) savedSpots.textContent = String(s.length);
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

window.reloadProfile = async function () {
    await loadProfileOverview();
};

export {loadProfileOverview};
