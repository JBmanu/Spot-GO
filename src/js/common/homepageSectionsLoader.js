import { PATHS } from "../paths.js";

const htmlCache = new Map();

async function fetchHtmlCached(htmlPath) {
    if (htmlCache.has(htmlPath)) return htmlCache.get(htmlPath);
    const res = await fetch(htmlPath);
    if (!res.ok) return null;
    const html = await res.text();
    htmlCache.set(htmlPath, html);
    return html;
}

async function injectSectionOnce(containerId, htmlPath) {
    const container = document.getElementById(containerId);
    if (!container) return { ok: false, didMount: false };
    if (container.dataset.mounted === "1") return { ok: true, didMount: false };
    const html = await fetchHtmlCached(htmlPath);
    if (html == null) return { ok: false, didMount: false };
    container.innerHTML = html;
    container.dataset.mounted = "1";
    return { ok: true, didMount: true };
}

export async function loadHomepageSections(
    { onSavedLoaded, onNearbyLoaded, onTopRatedLoaded } = {}
) {
    const [saved, nearby, top] = await Promise.all([
        injectSectionOnce("home-saved-section", PATHS.html.homepageSaved),
        injectSectionOnce("home-nearby-section", PATHS.html.homepageNearby),
        injectSectionOnce("home-vertical-section", PATHS.html.homepageTopRated),
    ]);
    if (saved.ok && saved.didMount) await onSavedLoaded?.();
    if (nearby.ok && nearby.didMount) await onNearbyLoaded?.();
    if (top.ok && top.didMount) await onTopRatedLoaded?.();
}
