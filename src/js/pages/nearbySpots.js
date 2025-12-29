import {getSpots} from "../query.js";
import {fillSpotCard} from "../common/populateSpotCards.js";

function setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
}

function pickDistance(spot) {
    return spot?.distanza ?? spot?.distance ?? spot?.metri ?? spot?.meters ?? null;
}

function pickRating(spot) {
    return spot?.rating ?? spot?.valutazione ?? spot?.stelle ?? spot?.mediaVoti ?? null;
}

export async function populateNearbySpots({
                                              containerId = "home-nearby-section",
                                              templateSelector = '[data-template="nearby-card"]',
                                              limit = 10,
                                          } = {}) {
    const section = document.getElementById(containerId);
    if (!section) return;

    const container = section.querySelector("#home-nearby-container");
    if (!container) return;

    const templateShell = section.querySelector(templateSelector);
    if (!templateShell) {
        console.warn("Template nearby-card non trovato dentro", `#${containerId}`);
        return;
    }

    templateShell.hidden = true;
    templateShell.setAttribute("aria-hidden", "true");

    const spots = await getSpots();
    console.log("Spots retrieved for nearby:", spots);
    const list = (spots || []).slice(0, limit);

    container.innerHTML = "";
    // Append a hidden template inside the container for cloning
    const hiddenTemplate = templateShell.cloneNode(true);
    hiddenTemplate.hidden = true;
    hiddenTemplate.setAttribute("aria-hidden", "true");
    container.appendChild(hiddenTemplate);

    if (!list.length) return;

    for (const spot of list) {
        const shell = hiddenTemplate.cloneNode(true);

        shell.removeAttribute("data-template");
        shell.removeAttribute("aria-hidden");
        shell.hidden = false;

        const card = shell.querySelector('[role="listitem"]');

        if (!card) continue;

        fillSpotCard(card, spot, {
            wrapperEl: shell,
            setCategoryText: true,
            hideIfMissingId: true,
        });

        if (card.style.display === "none") continue;

        setText(card.querySelector('[data-field="distance"]'), pickDistance(spot));
        setText(card.querySelector('[data-field="rating"]'), pickRating(spot));

        container.appendChild(shell);
    }
}
