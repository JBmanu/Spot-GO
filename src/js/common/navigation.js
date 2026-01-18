export function showOnlySectionView(main, viewKey) {
    if (!main) return null;

    const views = Array.from(main.children).filter(
        (el) => el && el.nodeType === 1 && el.hasAttribute("data-section-view")
    );

    if (!views.length) return null;

    const key = viewKey != null ? String(viewKey) : "";
    let target = key ? views.find((v) => String(v.dataset.sectionView) === key) : null;

    if (!target) target = views[0];

    views.forEach((v) => (v.hidden = v !== target));
    return String(target.dataset.sectionView || null);
}

export function resetHeaderBaseForSection(sectionKey) {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo?.querySelector("#back-button")) {
        headerLeftLogo.innerHTML =
            `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
    }

    const isHome = String(sectionKey) === "homepage";

    if (headerLogoText) headerLogoText.style.display = isHome ? "" : "none";
    if (headerTitle) headerTitle.classList.toggle("hidden", isHome);
}

export function activateToolbar(activeSection = null) {
    const toolbar = document.querySelector(".app-toolbar");
    if (!toolbar) return;

    toolbar.querySelectorAll("button[data-section]").forEach((btn) => {
        btn.removeAttribute("aria-current");
    });

    if (activeSection) {
        const btn = toolbar.querySelector(`button[data-section="${activeSection}"]`);
        if (btn) btn.setAttribute("aria-current", "page");
    }
}
