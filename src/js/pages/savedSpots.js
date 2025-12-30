import {getFirstUser, getSavedSpots, getSpots} from "../query.js";
import {fillSpotCard} from "../common/populateSpotCards.js";
import {fitText} from "../common/fitText.js";

function ensureSavedBookmarkDataset(cardEl) {
    const btn = cardEl.querySelector("[data-bookmark-button]");
    if (!btn) return;

    btn.dataset.saved = "true";

    btn.setAttribute("data-bookmark-type", "saved");
}

function clearRenderedShells(container, templateSelector) {
    const template = container.querySelector(templateSelector);
    Array.from(container.children).forEach((child) => {
        if (child === template) return;
        child.remove();
    });
}

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

    if (spot?.id) card.setAttribute("data-spot-id", String(spot.id));

    fillSpotCard(card, spot, {wrapperEl: shell, setCategoryText: false});

    ensureSavedBookmarkDataset(card);

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

        clearRenderedShells(container, templateSelector);

        if (!spots.length) {
            if (emptyState) emptyState.classList.remove("hidden");
            return;
        }

        if (emptyState) emptyState.classList.add("hidden");

        spots.forEach((spot) => {
            const shellEl = createSavedSpotShellFromTemplate(templateShell, spot);
            if (shellEl) container.appendChild(shellEl);
        });

        fitText(".saved-card .spot-card-title", "#" + containerId, 2, 10.5);
    } catch (err) {
        console.error("Errore populateSavedSpots:", err);
    }
}
