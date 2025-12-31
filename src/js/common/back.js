function showOnlySectionView(main, returnViewKey) {
    const views = Array.from(main.querySelectorAll('[data-section-view]'));
    let target = views.find(v => String(v.getAttribute('data-section-view')) === String(returnViewKey)) || null;
    if (!target && returnViewKey) {
        target = main.querySelector(`#${CSS.escape(String(returnViewKey))}`);
        if (target && !target.hasAttribute('data-section-view')) target = null;
    }
    if (!target && returnViewKey === "profile") {
        target = main.querySelector("#profile-overview-container");
        if (target) target.setAttribute("data-section-view", "profile");
    }
    if (!target && views.length > 0) {
        target = views[0];
    }
    views.forEach(v => v.hidden = v !== target);
    if (target && !views.includes(target)) {
        views.forEach((v) => (v.hidden = true));
        target.hidden = false;
    }
}

function resetHeaderForSection(sectionKey) {
    const headerLeftLogo = document.querySelector('.header-left-logo');
    const headerLogoText = document.getElementById('header-logo-text');
    const headerTitle = document.getElementById('header-title');
    if (sectionKey === 'homepage') {
        if (headerLeftLogo) headerLeftLogo.innerHTML = `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
        if (headerLogoText) headerLogoText.style.display = '';
        if (headerTitle) headerTitle.classList.add('hidden');
    } else if (sectionKey === 'profile') {
        if (headerLeftLogo) headerLeftLogo.innerHTML = `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
        if (headerLogoText) headerLogoText.style.display = '';
        if (headerTitle) headerTitle.classList.add('hidden');
    } else {
        if (headerLeftLogo) headerLeftLogo.innerHTML = `<img src="../../assets/images/LogoNoText.svg" alt="Logo" class="w-[60px] h-auto block">`;
        if (headerLogoText) headerLogoText.style.display = '';
        if (headerTitle) headerTitle.classList.add('hidden');
    }
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

export function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.hidden = true;
    const main = document.getElementById('main');
    if (main) {
        const returnViewKey = overlay.dataset?.returnView || 'homepage';
        showOnlySectionView(main, returnViewKey);
        resetHeaderForSection(returnViewKey);
        activateToolbar(returnViewKey);
    }
}

export function goBack({fallback} = {}) {
    const overlay = document.querySelector('[data-overlay-view]:not([hidden])');
    if (overlay) {
        closeOverlay(overlay);
        return;
    }
    try {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
    } catch (_) {
    }
    if (typeof fallback === 'function') {
        fallback();
        return;
    }
    window.location.href = '/';
}

export function setupBackButton({fallback} = {}) {
    const buttons = document.querySelectorAll('[data-back]');
    buttons.forEach(btn => {
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            goBack({fallback});
        });
    });
}
