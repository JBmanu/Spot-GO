import { getDoc, doc, setDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../firebase.js";

function toggleLoading(form, isLoading) {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = isLoading;
        btn.style.opacity = isLoading ? '0.7' : '1';
        btn.textContent = isLoading ? 'Caricamento...' : (form.dataset.authForm === 'login' ? 'Accedi' : 'Registrati');
    }
}

async function handleFictitiousLogin(email, modal) {
    const emailLower = email.toLowerCase();

    try {
        const userSnap = await getDoc(doc(db, "Utente", emailLower));

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const sessionUser = {
                id: userSnap.id,
                email: emailLower,
                username: userData.username,
                livello: userData.livello || 1
            };

            localStorage.setItem('currentUser', JSON.stringify(sessionUser));
            if (modal) modal.classList.add('hidden');
            window.navigateToSection('homepage');
        } else {
            alert("Account non trovato nel database cloud.");
        }
    } catch (error) {
        console.error("Errore nel login fiduciario:", error);
        alert("Impossibile completare l'accesso. Verifica la tua connessione.");
    }
}

export async function initAuthPage() {
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

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (forgotPasswordBtn) forgotPasswordBtn.addEventListener('click', handleForgotPassword);

    const switchToRegisterBtn = document.querySelector('[data-action="switch-to-register"]');
    if (switchToRegisterBtn) {
        switchToRegisterBtn.addEventListener('click', () => switchToTab('register'));
    }

    const switchToLoginBtn = document.querySelector('[data-action="switch-to-login"]');
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', () => switchToTab('login'));
    }

    const loginEmail = loginForm?.querySelector('input[name="email"]');
    const loginPassword = loginForm?.querySelector('input[name="password"]');
    const loginBtn = loginForm?.querySelector('button[type="submit"]');

    const registerEmail = registerForm?.querySelector('input[name="email"]');
    const registerPassword = registerForm?.querySelector('input[name="password"]');
    const registerBtn = registerForm?.querySelector('button[type="submit"]');

    const checkLogin = () => { if (loginBtn) loginBtn.disabled = !(loginEmail.value.trim() && loginPassword.value.trim()); };
    const checkRegister = () => { if (registerBtn) registerBtn.disabled = !(registerEmail.value.trim() && registerPassword.value.trim()); };

    if (loginEmail) {
        loginEmail.addEventListener('input', checkLogin);
        loginPassword.addEventListener('input', checkLogin);
        checkLogin();
    }
    if (registerEmail) {
        registerEmail.addEventListener('input', checkRegister);
        registerPassword.addEventListener('input', checkRegister);
        checkRegister();
    }

    const initAccountPicker = (btnSelector, modalId, emailSelector) => {
        const btn = document.querySelector(btnSelector)?.parentElement;
        const modal = document.getElementById(modalId);
        if (!btn || !modal) return;

        btn.addEventListener('click', () => modal.classList.remove('hidden'));
        modal.querySelector('[class$="-close"]')?.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
        modal.querySelectorAll('[class$="-account"]').forEach(accountBtn => {
            accountBtn.addEventListener('click', () => {
                const email = accountBtn.querySelector(emailSelector).textContent;
                handleFictitiousLogin(email, modal);
            });
        });
    };

    initAccountPicker('.social-btn img[src*="Google.svg"]', 'google-modal', '.gap-email');
    initAccountPicker('.social-btn img[src*="Apple.svg"]', 'apple-modal', '.aip-email');

    window.togglePasswordVisibility = function (event, element) {
        event.preventDefault();
        event.stopPropagation();
        const input = element.closest('.auth-field').querySelector('input');
        const img = element.querySelector('img');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        img.src = isPassword ? 'assets/icons/login-signup/Visible.svg' : 'assets/icons/login-signup/Invisible.svg';
        img.alt = isPassword ? 'Nascondi password' : 'Mostra password';
    };
}

function switchToTab(tab) {
    const switchButtons = document.querySelectorAll('.auth-switch-btn');
    const forms = document.querySelectorAll('.auth-form');
    const slider = document.querySelector('.auth-slider');

    switchButtons.forEach(btn => {
        const isActive = btn.dataset.authTab === tab;
        btn.classList.toggle('is-active', isActive);
        btn.classList.toggle('text-black', isActive);
        btn.style.fontWeight = isActive ? 'bold' : 'normal';
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (slider) slider.style.left = tab === 'login' ? '1%' : '51%';
    forms.forEach(form => form.style.display = form.dataset.authForm === tab ? 'block' : 'none');
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = new FormData(form).get('email').toLowerCase();
    const password = new FormData(form).get('password');

    toggleLoading(form, true);

    try {
        const userSnap = await getDoc(doc(db, "Utente", email));

        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.password === password || !userData.password) {
                const sessionUser = {
                    id: userSnap.id,
                    email: email,
                    username: userData.username,
                    livello: userData.livello || 1
                };
                localStorage.setItem('currentUser', JSON.stringify(sessionUser));
                window.navigateToSection('homepage');
                return;
            }
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const sessionUser = {
            id: user.email,
            email: user.email,
            username: user.email.split('@')[0],
            livello: 1
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        window.navigateToSection('homepage');

    } catch (error) {
        console.error('Errore durante il login:', error);
        let message = 'Credenziali errate o utente non trovato.';
        if (error.code === 'auth/network-request-failed') message = 'Controlla la tua connessione internet.';
        if (error.code === 'auth/too-many-requests') message = 'Troppi tentativi falliti. Riprova più tardi.';
        alert(message);
    } finally {
        toggleLoading(form, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const email = new FormData(form).get('email').toLowerCase();
    const password = new FormData(form).get('password');

    toggleLoading(form, true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData = {
            email: user.email,
            username: user.email.split('@')[0],
            livello: 1,
            dataCreazione: new Date().toISOString()
        };

        await setDoc(doc(db, "Utente", user.email), userData);

        const sessionUser = {
            id: user.email,
            email: user.email,
            username: userData.username,
            livello: 1
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        window.navigateToSection('homepage');
    } catch (error) {
        console.error('Errore registrazione:', error);
        let message = 'Errore durante la registrazione.';
        if (error.code === 'auth/email-already-in-use') message = 'Questa email è già registrata.';
        if (error.code === 'auth/weak-password') message = 'La password deve avere almeno 6 caratteri.';
        alert(message);
    } finally {
        toggleLoading(form, false);
    }
}

async function handleForgotPassword() {
    const email = prompt('Inserisci la tua email per ricevere il link di reset:');
    if (!email) return;

    try {
        await sendPasswordResetEmail(auth, email);
        alert('Email di reset inviata! Controlla la tua casella di posta.');
    } catch (error) {
        console.error('Errore reset password:', error);
        alert('Impossibile inviare l\'email di reset. Controlla che l\'indirizzo sia corretto.');
    }
}
