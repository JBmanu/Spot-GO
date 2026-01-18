import { showOnlySectionView, resetHeaderBaseForSection, activateToolbar } from "./navigation.js";

export function closeOverlayAndReveal({ overlay, returnViewKey } = {}) {
    const main = document.getElementById("main");
    if (!main) return null;

    const ov = overlay || main.querySelector('[data-overlay-view]');
    if (!ov) return null;

    const returnKey = returnViewKey || ov.dataset.returnView || null;

    if (ov.classList.contains("page-slide-in") || ov.classList.contains("overlay-full-page")) {
        ov.classList.remove("page-slide-in");
        ov.classList.add("page-slide-out");

        if (returnKey && main.querySelector(`[data-overlay-view="${returnKey}"]`)) {
            const returnOverlay = main.querySelector(`[data-overlay-view="${returnKey}"]`);
            returnOverlay.hidden = false;
        } else {
            showOnlySectionView(main, returnKey);
        }

        setTimeout(() => {
            if (typeof ov.onClose === 'function') ov.onClose();

            try {
                ov.remove();
            } catch (_) {
                if (ov.parentNode) ov.parentNode.removeChild(ov);
            }

            if (!returnKey || !main.querySelector(`[data-overlay-view="${returnKey}"]`)) {
                const shown = showOnlySectionView(main, returnKey) || "homepage";
                resetHeaderBaseForSection(shown);
                activateToolbar(shown);
                document.dispatchEvent(new CustomEvent("section:revealed", { detail: { section: shown } }));
            }

        }, 300);

        return returnKey || "homepage";
    }

    if (typeof ov.onClose === 'function') {
        ov.onClose();
    }

    if (ov.classList.contains("page-fade-in") || ov.dataset.animateExit === "true") {
        ov.classList.remove("page-fade-in");
        ov.classList.add("page-fade-out");

        setTimeout(() => {
            try {
                ov.remove();
            } catch (_) {
                if (ov.parentNode) ov.parentNode.removeChild(ov);
            }
        }, 200);
    } else {
        try {
            ov.remove();
        } catch (_) {
            if (ov.parentNode) ov.parentNode.removeChild(ov);
        }
    }

    if (returnKey && main.querySelector(`[data-overlay-view="${returnKey}"]`)) {
        const returnOverlay = main.querySelector(`[data-overlay-view="${returnKey}"]`);
        returnOverlay.hidden = false;
        return returnKey;
    }

    const shown = showOnlySectionView(main, returnKey) || "homepage";

    resetHeaderBaseForSection(shown);
    activateToolbar(shown);

    document.dispatchEvent(
        new CustomEvent("section:revealed", { detail: { section: shown } })
    );

    return shown;
}

export function goBack({ fallback } = {}) {
    const main = document.getElementById("main");

    if (main) {
        const visibleSections = Array.from(main.querySelectorAll('[data-section-view]'))
            .filter(el => el.style.display !== 'none' && !el.hidden);

        for (const section of visibleSections) {
            const returnTo = section.dataset.returnSection;
            if (returnTo) {
                section.style.display = 'none';
                section.hidden = true;

                const returnSection = main.querySelector(`[data-section-view="${returnTo}"]`);
                if (returnSection) {
                    returnSection.style.display = '';
                    returnSection.hidden = false;
                }

                resetHeaderBaseForSection(returnTo);
                activateToolbar(returnTo);

                return;
            }
        }
    }

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

function setupBackButton({ fallback } = {}) {
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

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setupBackButton());
    } else {
        setupBackButton();
    }

    const observer = new MutationObserver((mutations) => {
        let shouldSetup = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.hasAttribute?.('data-back') || node.querySelector?.('[data-back]')) {
                            shouldSetup = true;
                            break;
                        }
                    }
                }
            }
            if (shouldSetup) break;
        }

        if (shouldSetup) {
            setupBackButton();
        }
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });

    window.addEventListener("popstate", (event) => {
        const overlay = document.querySelector('[data-overlay-view]');
        const currentState = event.state || {};
        if (overlay && !overlay.hidden) {
            if (currentState.overlay !== overlay.dataset.overlayView) {
                closeOverlayAndReveal({ overlay });
            }
        }
    });
}
