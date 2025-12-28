import { getFirstUser, getSavedSpots, getSpots } from "../query.js";
import { fillSpotCard } from "../common/populateSpotCards.js";

export async function getSavedSpotsData() {
    const user = await getFirstUser();
    if (!user) return [];
    const relations = await getSavedSpots(user.id);
    const ids = (relations || []).map((r) => r.idLuogo).filter(Boolean);
    if (!ids.length) return [];
    const allSpots = await getSpots();
    const spotById = new Map((allSpots || []).map((s) => [s.id, s]));
    return ids.map((id) => spotById.get(id)).filter(Boolean);
}

export function createSavedSpotShellFromTemplate(templateShell, spot) {
    if (!templateShell || !spot) return null;
    const shell = templateShell.cloneNode(true);
    shell.removeAttribute("data-template");
    shell.removeAttribute("aria-hidden");
    shell.hidden = false;
    const card = shell.querySelector('[role="listitem"]');
    if (!card) return null;
    fillSpotCard(card, spot, { wrapperEl: shell, setCategoryText: false });
    return shell;
}

export async function populateSavedSpots({
    containerId = "home-saved-container",
    emptyStateId = "saved-empty-state",
    templateSelector = '[data-template="saved-card"]',
} = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const emptyState = document.getElementById(emptyStateId);
    const templateShell = container.querySelector(templateSelector);
    if (!templateShell) {
        console.warn("Template saved-card non trovato dentro", `#${containerId}`);
        return;
    }
    templateShell.hidden = true;
    templateShell.setAttribute("aria-hidden", "true");
    try {
        const spots = await getSavedSpotsData();
        container.innerHTML = "";
        container.appendChild(templateShell);
        if (!spots.length) {
            if (emptyState) emptyState.classList.remove("hidden");
            return;
        }
        if (emptyState) emptyState.classList.add("hidden");
        spots.forEach((spot) => {
            const shellEl = createSavedSpotShellFromTemplate(templateShell, spot);
            if (shellEl) container.appendChild(shellEl);
        });
    } catch (err) {
        console.error("Errore populateSavedSpots:", err);
    }
}
