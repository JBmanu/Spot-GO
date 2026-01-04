import { PATHS } from "../../paths.js";

const htmlCache = new Map();

/**
 * Carica l'HTML dal percorso specificato, utilizzando una cache per evitare richieste ripetute.
 * @param {string} htmlPath - Il percorso del file HTML da caricare.
 * @returns {Promise<string|null>} L'HTML caricato o null se fallisce.
 */
async function loadHtmlFromCache(htmlPath) {
    if (htmlCache.has(htmlPath)) return htmlCache.get(htmlPath);
    const res = await fetch(htmlPath);
    if (!res.ok) return null;
    const html = await res.text();
    htmlCache.set(htmlPath, html);
    return html;
}

/**
 * Monta una sezione HTML in un contenitore una sola volta, utilizzando la cache.
 * @param {string} containerId - L'ID del contenitore DOM.
 * @param {string} htmlPath - Il percorso del file HTML.
 * @returns {Promise<{ok: boolean, didMount: boolean}>} Oggetto con stato dell'operazione.
 */
async function mountSectionOnce(containerId, htmlPath) {
    const container = document.getElementById(containerId);
    if (!container) return { ok: false, didMount: false };
    if (container.dataset.mounted === "1") return { ok: true, didMount: false };
    const html = await loadHtmlFromCache(htmlPath);
    if (html == null) return { ok: false, didMount: false };
    container.innerHTML = html;
    container.dataset.mounted = "1";
    return { ok: true, didMount: true };
}

/**
 * Configura le sezioni della homepage caricando l'HTML e chiamando i callback appropriati.
 * @param {Object} [callbacks] - Oggetto con callback per le sezioni.
 * @param {Function} [callbacks.onSavedLoaded] - Callback quando la sezione degli spot salvati è caricata.
 * @param {Function} [callbacks.onNearbyLoaded] - Callback quando la sezione degli spot vicini è caricata.
 * @param {Function} [callbacks.onTopRatedLoaded] - Callback quando la sezione degli spot top-rated è caricata.
 * @returns {Promise<void>}
 */
export async function setupHomeSections(
    { onSavedLoaded, onNearbyLoaded, onTopRatedLoaded } = {}
) {
    const [saved, nearby, top] = await Promise.all([
        mountSectionOnce("home-saved-section", PATHS.html.homepageSaved),
        mountSectionOnce("home-nearby-section", PATHS.html.homepageNearby),
        mountSectionOnce("home-vertical-section", PATHS.html.homepageTopRated),
    ]);
    if (saved.ok && saved.didMount) await onSavedLoaded?.();
    if (nearby.ok && nearby.didMount) await onNearbyLoaded?.();
    if (top.ok && top.didMount) await onTopRatedLoaded?.();
}
