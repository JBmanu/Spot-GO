import {PATHS} from "./paths.js";
import {
    activateToolbar,
    resetHeaderBaseForSection,
    closeOverlayAndReveal,
} from "./common/back.js";
import "./common/carousels.js";

const SECTION_CONFIG = {
    homepage: { title: "Spot & Go", content: PATHS.html.homepage },
    map: { title: "Mappa", content: PATHS.html.map },
    community: { title: "Community", content: PATHS.html.community },
    goals: { title: "Missioni", content: PATHS.html.goals },
    profile: { title: "Il mio Profilo", content: PATHS.html.profile },
    login: { title: "Accedi", content: PATHS.html.login },
};

const handlers = {
    homepage: { init: null },
    map: { init: null },
    profile: { init: null },
    goals: { init: null },
};

const modulesLoaded = Promise.allSettled([
    import("./pages/profile.js").then((m) => (handlers.profile.init = m.loadProfileOverview)),
    import("./pages/homepage/homepage.js").then((m) => (handlers.homepage.init = m.initializeHomepage)),
    import("./map.js").then((m) => (handlers.map.init = m.initializeMap)),
    import("./goals/goals.js").then((m) => (handlers.goals.init = m.initializeGoals)),
]);

async function replaceNodeFromHtml({ url, targetSelector, sourceSelector }) {
    const target = document.querySelector(targetSelector);
    if (!target) return false;

    try {
        const res = await fetch(url);
        if (!res.ok) return false;

        const html = await res.text();
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const source = parsed.querySelector(sourceSelector);
        if (!source) return false;

        target.innerHTML = source.innerHTML;
        Array.from(source.attributes).forEach((attr) =>
            target.setAttribute(attr.name, attr.value)
        );

        return true;
    } catch {
        return false;
    }
}

function getVisibleSectionKey(mainEl) {
    const visible = mainEl.querySelector('[data-section-view]:not([hidden])');
    return visible?.dataset?.sectionView || null;
}

function closeAnyOverlay(main) {
    const overlay = main.querySelector("[data-overlay-view]");
    if (overlay) closeOverlayAndReveal({ overlay });
}

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
        replaceNodeFromHtml({
            url: PATHS.html.header,
            targetSelector: "header.app-header",
            sourceSelector: "header",
        }),
        replaceNodeFromHtml({
            url: PATHS.html.toolbar,
            targetSelector: ".app-toolbar",
            sourceSelector: "nav",
        }),
    ]);

    const main = document.getElementById("main");
    const toolbar = document.querySelector(".app-toolbar");
    const titleEl = document.getElementById("header-title");

    if (!main || !toolbar) return;

    const sectionState = new Map();
    let currentSection = null;
    let isNavigating = false;

    async function navigateTo(section) {
        if (isNavigating) return;
        const cfg = SECTION_CONFIG[section];
        if (!cfg) return;

        isNavigating = true;
        try {
            closeAnyOverlay(main);

            updateHeader(section, cfg);
            await mountSection(section, cfg);

            currentSection = section;
            main.scrollTop = 0;
        } finally {
            isNavigating = false;
        }
    }

    function updateHeader(section, cfg) {
        resetHeaderBaseForSection(section);

        if (titleEl) titleEl.textContent = cfg.title;

        const logoutBtn = document.getElementById('logout-button');
        const isAuthenticated = !!localStorage.getItem('currentUser');
        const isProfile = section === "profile";
        if (logoutBtn) {
            logoutBtn.style.display = (isProfile && isAuthenticated) ? 'block' : 'none';
        }

        const header = document.querySelector('.app-header');
        const tb = document.querySelector('.app-toolbar');
        if (section === 'login') {
            if (header) header.style.display = 'none';
            if (tb) tb.style.display = 'none';
        } else {
            if (header) header.style.display = '';
            if (tb) tb.style.display = '';
        }
    }

    async function mountSection(section, cfg) {
        if (sectionState.has(section)) {
            showOnly(section);
            return;
        }

        let html = "";
        try {
            const res = await fetch(cfg.content);
            if (!res.ok) throw new Error("fetch failed");
            html = await res.text();
        } catch {
            main.innerHTML = `<div class="p-4">Errore caricamento</div>`;
            sectionState.clear();
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.dataset.sectionView = section;
        wrapper.hidden = true;
        wrapper.innerHTML = html;

        main.appendChild(wrapper);
        sectionState.set(section, { el: wrapper, initialized: false });

        showOnly(section);
        await initSectionOnce(section, wrapper);

        const st = sectionState.get(section);
        if (st) st.initialized = true;
    }

    window.navigateToSection = navigateTo;

    function showOnly(activeSection) {
        for (const [section, { el }] of sectionState.entries()) {
            el.hidden = section !== activeSection;
        }
        activateToolbar(activeSection);
        currentSection = activeSection;
    }

    async function initSectionLogic(section, wrapperEl) {
        if (section === "login") {
            try {
                const { initAuthPage } = await import("./pages/login.js");
                await initAuthPage();
            } catch (err) {
                console.warn("Login init failed:", err);
            }
            return;
        }

        const handler = handlers[section]?.init;
        if (handler) {
            try {
                await handler(wrapperEl || document);
                if (section === "profile" && wrapperEl) {
                    wrapperEl.dataset.sectionView = "profile";
                }
            } catch (err) {
                console.warn(`Init failed for ${section}:`, err);
            }
        }
    }

    async function initSectionOnce(section, wrapperEl) {
        const st = sectionState.get(section);
        if (!st || st.initialized) return;

        await initSectionLogic(section, wrapperEl);
        st.initialized = true;
    }

    toolbar.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-section]");
        if (!btn || isNavigating) return;
        if (btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true") return;

        const next = (btn.dataset.section || "").trim();
        if (!next) return;

        e.preventDefault();
        closeAnyOverlay(main);

        const visible = getVisibleSectionKey(main) || currentSection;
        if (next === visible) return;

        await navigateTo(next);
    });

    document.addEventListener("section:revealed", async (e) => {
        const shown = e?.detail?.section;
        if (!shown) return;
        currentSection = shown;

        if (shown === "homepage" && handlers.homepage.init) {
            const homeWrapper = main.querySelector('[data-section-view="homepage"]');
            await handlers.homepage.init(homeWrapper || document);
        }
        else if (handlers[shown]?.init) {
            await handlers[shown].init();
        }
    });

    await modulesLoaded;

    const currentUser = localStorage.getItem('currentUser');
    const isAuthenticated = !!currentUser;

    const loginBtn = document.getElementById('login-button');
    if (loginBtn) loginBtn.style.display = isAuthenticated ? 'none' : 'block';

    if (isAuthenticated) {
        await navigateTo("homepage");
    } else {
        await navigateTo("login");
    }

    window.handleLogout = function () {
        localStorage.removeItem('currentUser');
        window.location.reload();
    };
});
