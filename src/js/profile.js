import { getFirstUser, getReviews, getCreatedSpots, getVisitedSpots, getSavedSpots} from "./query.js";

async function loadProfileOverview() {
    const overviewContainer = document.getElementById("profile-overview-container");
    if (!overviewContainer) {
        return;
    }

    const res = await fetch("./html/profile-pages/overview.html", {cache: "no-store"});
    if (!res.ok) {
        overviewContainer.innerHTML = `<div>Errore caricamento profilo</div>`;
        return;
    }

    overviewContainer.innerHTML = await res.text();
    await initializeProfileData();
}

// Inizializza i dati del profilo
async function initializeProfileData() {
    // Qui puoi aggiungere logica per caricare i dati dall'utente da Firebase
    const user = await getFirstUser();
    const profileData = {
        name: user.username,
        username: "@" + user.username,
        email: user.email,
        avatar: user.username[0].toUpperCase()
    };

    // Dati di default
    // const profileData = {
    //     name: "Paperino",
    //     username: "@paperino1",
    //     email: "paperino@example.com",
    //     avatar: "P"
    // };

    updateProfileUI(profileData);
    updateUserCounters(user.id);
}

async function updateUserCounters(userId) {
    const writtenReviews = document.getElementById("written-reviews");
    const createdSpots = document.getElementById("created-spots");
    const visitedSpots = document.getElementById("visited-spots");
    const savedSpots = document.getElementById("saved-spots");

    const [reviews, created, visited, saved] = await Promise.all([
        getReviews(userId),
        getCreatedSpots(userId),
        getVisitedSpots(userId),
        getSavedSpots(userId)
    ]);

    if (writtenReviews) writtenReviews.textContent = reviews.length;
    if (createdSpots) createdSpots.textContent = created.length;
    if (visitedSpots) visitedSpots.textContent = visited.length;
    if (savedSpots) savedSpots.textContent = saved.length;
}

// Aggiorna l'interfaccia del profilo con i dati
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

// Export della funzione principale per smartphone.js
export {loadProfileOverview};
