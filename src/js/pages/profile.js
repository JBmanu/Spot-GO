/**
 * Utility per la gestione della pagina del profilo utente.
 */

let getFirstUser, getReviews, getCreatedSpots, getVisitedSpots, getSavedSpots, loadViewAllSaved;

Promise.all([
    import("../query.js").then(module => {
        getFirstUser = module.getFirstUser;
        getReviews = module.getReviews;
        getCreatedSpots = module.getCreatedSpots;
        getVisitedSpots = module.getVisitedSpots;
        getSavedSpots = module.getSavedSpots;
    }),
    import("./homepage.js").then(module => {
        loadViewAllSaved = module.loadViewAllSaved;
    })
]).catch(err => console.error("Errore nel caricamento dei moduli in profile.js:", err));

/**
 * Carica l'overview del profilo nell'area prevista.
 */
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

/**
 * Inizializza i dati del profilo.
 */
async function initializeProfileData() {
    const user = await getFirstUser();
    const profileData = {
        name: user.username,
        username: "@" + user.username,
        email: user.email,
        avatar: user.username[0].toUpperCase()
    };

    updateProfileUI(profileData);
    updateUserCounters(user.id);

    const savedSpotsButton = document.getElementById("profile-saved-spots-button");
    if (savedSpotsButton) {
        savedSpotsButton.addEventListener("click", async () => {
            await loadViewAllSaved("profile");
        });
    }
}

/**
 * Aggiorna i contatori dell'utente.
 */
async function updateUserCounters(userId) {
    const writtenReviews = document.getElementById("written-reviews");
    const createdSpots = document.getElementById("created-spots");
    const visitedSpots = document.getElementById("visited-spots");
    const savedSpots = document.getElementById("saved-spots");
    if (writtenReviews) writtenReviews.textContent = (await getReviews(userId)).length;
    if (createdSpots) createdSpots.textContent = (await getCreatedSpots(userId)).length;
    if (visitedSpots) visitedSpots.textContent = (await getVisitedSpots(userId)).length;
    if (savedSpots) savedSpots.textContent = (await getSavedSpots(userId)).length;
}

/**
 * Aggiorna l'interfaccia del profilo con i dati forniti.
 */
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

/**
 * Export della funzione principale per smartphone.js
 */
export {loadProfileOverview};
