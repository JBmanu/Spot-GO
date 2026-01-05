let users = [];

export async function initAuthPage() {

    try {
        const res = await fetch('./db/json/utenti.json');
        users = await res.json();
    } catch (err) {
        console.error('Errore caricamento utenti:', err);
        users = [];
    }

    const switchButtons = document.querySelectorAll('.auth-switch-btn');
    const loginForm = document.querySelector('[data-auth-form="login"]');
    const registerForm = document.querySelector('[data-auth-form="register"]');
    const forgotPasswordBtn = document.querySelector('[data-action="forgot-password"]');

    switchButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.authTab;
            switchToTab(tab);
        });
    });

    switchToTab('login');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', handleForgotPassword);
    }
}

/**
 * Cambia tab tra login e registrazione.
 */
function switchToTab(tab) {
    const switchButtons = document.querySelectorAll('.auth-switch-btn');
    const forms = document.querySelectorAll('.auth-form');

    switchButtons.forEach(btn => {
        if (btn.dataset.authTab === tab) {
            btn.classList.add('is-active');
            btn.classList.add('text-black');
            btn.setAttribute('aria-selected', 'true');
        } else {
            btn.classList.remove('is-active');
            btn.classList.remove('text-black');
            btn.setAttribute('aria-selected', 'false');
        }
    });

    const slider = document.querySelector('.auth-slider');
    if (slider) {
        if (tab === 'login') {
            slider.style.left = '0.25rem';
        } else {
            slider.style.left = 'calc(50% + 0.25rem)';
        }
    }

    forms.forEach(form => {
        if (form.dataset.authForm === tab) {
            form.style.display = 'block';
        } else {
            form.style.display = 'none';
        }
    });
}

/**
 * Gestisce il login con email e password.
 */
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        console.log('Login riuscito:', user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.navigateToSection('homepage');
    } else {
        alert('Email o password errate.');
    }
}

/**
 * Gestisce la registrazione.
 */
async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        alert('Le password non corrispondono.');
        return;
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        alert('Email già registrata.');
        return;
    }

    const newUser = {
        email,
        username: email.split('@')[0],
        password,
        livello: 1
    };
    users.push(newUser);
    console.log('Registrazione riuscita:', newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    window.navigateToSection('homepage');
}

/**
 * Gestisce il reset password.
 */
function handleForgotPassword() {
    const email = prompt('Inserisci la tua email per il reset della password:');
    if (email) {
        alert('Reset password simulato per ' + email);
    }
}
