let __newSpotPageHtml = null;

async function getNewSpotPageHtml() {
    if (__newSpotPageHtml) return __newSpotPageHtml;

    const res = await fetch("../html/map-pages/new-spot.html");
    if (!res.ok) return null;

    __newSpotPageHtml = await res.text();
    return __newSpotPageHtml;
}