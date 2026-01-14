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

    if (headerLeftLogo?.querySelector("#header-back-button")) {
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

export function closeOverlayAndReveal({ overlay, returnViewKey } = {}) {
    const main = document.getElementById("main");
    if (!main) return null;

    const ov = overlay || main.querySelector('[data-overlay-view]');
    if (!ov) return null;

    const returnKey = returnViewKey || ov.dataset.returnView || null;

    if (typeof ov.onClose === 'function') {
        ov.onClose();
    }

    try {
        ov.remove();
    } catch (_) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
    }

    if (returnKey && main.querySelector(`[data-overlay-view="${returnKey}"]`)) {
        const returnOverlay = main.querySelector(`[data-overlay-view="${returnKey}"]`);
        returnOverlay.hidden = false;
        return returnKey;
    }

    const shown = showOnlySectionView(main, returnKey) || "homepage";

    resetHeaderBaseForSection(shown);
    activateToolbar(shown);

    main.classList.remove("spot-detail-enter", "spot-detail-exit");
    main.removeAttribute("data-category");

    document.dispatchEvent(
        new CustomEvent("section:revealed", { detail: { section: shown } })
    );

    return shown;
}

export function closeOverlay(overlay) {
    return closeOverlayAndReveal({ overlay });
}

export function goBack({ fallback } = {}) {
    const overlay = document.querySelector('[data-overlay-view]');
    if (overlay) {
        closeOverlayAndReveal({ overlay });
        return;
    }

    try {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
    } catch (_) {
    }

    if (typeof fallback === "function") {
        fallback();
        return;
    }

    window.location.href = "/";
}

export function setupBackButton({ fallback } = {}) {
    const buttons = document.querySelectorAll("[data-back]");
    buttons.forEach((btn) => {
        if (btn.dataset.bound === "true") return;
        btn.dataset.bound = "true";

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            goBack({ fallback });
        });
    });
}
