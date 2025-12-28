/**
 * Carica i template HTML delle sezioni homepage dentro i container:
 * - #home-saved-section
 * - #home-nearby-section
 * - #home-vertical-section
 */

import { PATHS } from "../paths.js";

async function injectSection(containerId, htmlPath) {
    const container = document.getElementById(containerId);
    if (!container) return false;

    const res = await fetch(htmlPath, { cache: "no-store" });
    if (!res.ok) return false;

    container.innerHTML = await res.text();
    return true;
}

export async function loadHomepageSections(
    { onSavedLoaded, onNearbyLoaded, onTopRatedLoaded } = {}
) {
    const [savedOk, nearbyOk, topOk] = await Promise.all([
        injectSection("home-saved-section", PATHS.html.homepageSaved),
        injectSection("home-nearby-section", PATHS.html.homepageNearby),
        injectSection("home-vertical-section", PATHS.html.homepageTopRated),
    ]);

    if (savedOk) await onSavedLoaded?.();
    if (nearbyOk) await onNearbyLoaded?.();
    if (topOk) await onTopRatedLoaded?.();
}
