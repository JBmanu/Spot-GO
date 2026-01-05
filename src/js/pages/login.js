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

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', handleForgotPassword);
    }

    const switchToRegisterBtn = document.querySelector('[data-action="switch-to-register"]');
    if (switchToRegisterBtn) {
        switchToRegisterBtn.addEventListener('click', () => switchToTab('register'));
    }

    const loginEmail = loginForm.querySelector('input[name="email"]');
    const loginPassword = loginForm.querySelector('input[name="password"]');
    const loginBtn = loginForm.querySelector('button[type="submit"]');

    const registerEmail = registerForm.querySelector('input[name="email"]');
    const registerPassword = registerForm.querySelector('input[name="password"]');
    const registerConfirm = registerForm.querySelector('input[name="confirmPassword"]');
    const registerBtn = registerForm.querySelector('button[type="submit"]');

    function checkLogin() {
        loginBtn.disabled = !(loginEmail.value.trim() && loginPassword.value.trim());
    }

    function checkRegister() {
        registerBtn.disabled = !(registerEmail.value.trim() && registerPassword.value.trim() && registerConfirm.value.trim());
    }

    loginEmail.addEventListener('input', checkLogin);
    loginPassword.addEventListener('input', checkLogin);
    registerEmail.addEventListener('input', checkRegister);
    registerPassword.addEventListener('input', checkRegister);
    registerConfirm.addEventListener('input', checkRegister);

    checkLogin();
    checkRegister();

    window.togglePasswordVisibility = function(event, element) {
        event.preventDefault();
        event.stopPropagation();
        const label = element.closest('.auth-field');
        const input = label.querySelector('input');
        const img = element.querySelector('img');
        if (input.type === 'password') {
            input.type = 'text';
            img.src = 'assets/icons/login-signup/Visible.svg';
            img.alt = 'Nascondi password';
        } else {
            input.type = 'password';
            img.src = 'assets/icons/login-signup/Invisible.svg';
            img.alt = 'Mostra password';
        }
    };
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
            btn.style.fontWeight = 'bold';
            btn.setAttribute('aria-selected', 'true');
        } else {
            btn.classList.remove('is-active');
            btn.classList.remove('text-black');
            btn.style.fontWeight = 'normal';
            btn.setAttribute('aria-selected', 'false');
        }
    });

    const slider = document.querySelector('.auth-slider');
    if (slider) {
        if (tab === 'login') {
            slider.style.left = '0';
        } else {
            slider.style.left = '50%';
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
