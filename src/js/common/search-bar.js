const TEMPLATE_ID = "search-bar-template";
let tmplPromise = null;

export async function ensureSearchBarTemplateLoaded({
                                                        templateUrl = "base/search-bar/search-bar.html",
                                                    } = {}) {
    if (document.getElementById(TEMPLATE_ID)) return true;
    if (tmplPromise) return tmplPromise;

    tmplPromise = (async () => {
        try {
            const res = await fetch(templateUrl, {cache: "force-cache"});
            if (!res.ok) return false;

            const html = await res.text();
            const temp = document.createElement("div");
            temp.innerHTML = html;

            const tpl = temp.querySelector(`template#${TEMPLATE_ID}`);
            if (!tpl) return false;

            document.body.appendChild(tpl);
            return true;
        } catch {
            return false;
        } finally {
            if (!document.getElementById(TEMPLATE_ID)) tmplPromise = null;
        }
    })();

    return tmplPromise;
}

export function insertSearchBar(
    targetSelector,
    {inputId = "search-bar-input", filterBtnId = "search-bar-filter-btn"} = {}
) {
    const tpl = document.getElementById(TEMPLATE_ID);
    if (!tpl?.content) return null;

    const target =
        typeof targetSelector === "string"
            ? document.querySelector(targetSelector)
            : targetSelector;

    if (!target) return null;

    const clone = tpl.content.cloneNode(true);

    const input = clone.querySelector("#search-bar-input");
    const btn = clone.querySelector("#search-bar-filter-btn");

    if (input && inputId !== "search-bar-input") input.id = inputId;
    if (btn && filterBtnId !== "search-bar-filter-btn") btn.id = filterBtnId;

    target.appendChild(clone);
    return target.querySelector(`#${CSS.escape(inputId)}`);
}
