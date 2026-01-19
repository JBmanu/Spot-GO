import { getCurrentUser, getCartolinaById, pullMessages } from "../../database.js";
import { formatDate } from "../../common/datetime.js";
import { openPolaroidDetail } from "../polaroidDetail.js"
import { AVATAR_MAP } from "../../common/avatarImagePaths.js";
import { resetHeaderBaseForSection } from "../../common/navigation.js";
import { PATHS } from "../../paths.js";

let chatTemplateCache = null;

async function loadChatView() {
    if (document.getElementById('chat-container')) return;

    try {
        if (!chatTemplateCache) {
            console.log("Fetching chat template from:", PATHS.html.chat);
            const res = await fetch(PATHS.html.chat);
            if (!res.ok) throw new Error(`Failed to load chat template: ${res.statusText}`);
            chatTemplateCache = await res.text();
        }

        const wrapper = document.createElement('div');
        wrapper.innerHTML = chatTemplateCache;
        const chatContainer = wrapper.querySelector('#chat-container');

        if (!chatContainer) {
            throw new Error("Chat container #chat-container not found in template");
        }

        const commBody = document.getElementById("community-main-body");
        if (commBody && commBody.parentNode) {
            commBody.parentNode.insertBefore(chatContainer, commBody);
        } else {
            const main = document.getElementById("main");
            const commSection = main.querySelector('[data-section-view="community"]');
            if (commSection) {
                commSection.appendChild(chatContainer);
            } else {
                main.appendChild(chatContainer);
            }
        }
    } catch (err) {
        console.error("Error loading chat view:", err);
        alert("Impossibile caricare la chat. Riprova o ricarica la pagina.");
    }
}

export async function openChat(userData) {
    await loadChatView();

    const chatContainer = document.getElementById('chat-container');
    const messagesContainer = document.getElementById('messagesContainer');

    if (chatContainer) {
        chatContainer.classList.remove('hidden-chat');
        hideCommunityMainSections();
    }

    updateChatHeader(userData);
    history.pushState({ chatOpen: true }, "");

    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-40 gap-3 opacity-60">
                <div class="w-8 h-8 border-4 border-primary_color border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm font-medium text-gray-500">Caricamento messaggi...</p>
            </div>
        `;
    }

    try {
        const userMail = await getCurrentUser();
        const messagesData = await pullMessages(userMail.email, userData.email);
        const messagesPromise = messagesData.map(async msg => {
            const cartolina = await getCartolinaById(msg.ref);
            return {
                ...msg,
                cartolina: cartolina
            }
        });
        const messages = await Promise.all(messagesPromise);

        renderMessages(userData, messages);
    } catch (error) {
        console.error("Errore caricamento chat:", error);
        if (messagesContainer) {
            messagesContainer.innerHTML = '<p class="text-center text-red-500 p-4">Errore durante il caricamento dei messaggi.</p>';
        }
    }
}

function updateChatHeader(userData) {
    const headerLeftLogo = document.querySelector(".header-left-logo");
    const headerLogoText = document.getElementById("header-logo-text");
    const headerTitle = document.getElementById("header-title");

    if (headerLeftLogo) {
        headerLeftLogo.innerHTML = `
            <button type="button" id="back-button" data-back aria-label="Torna indietro"
                class="flex items-center justify-center w-10 h-10">
                <img src="../../assets/icons/profile/Back.svg" alt="Indietro" class="w-6 h-6">
            </button>
        `;
    }

    if (headerLogoText) headerLogoText.style.display = "none";

    if (headerTitle) {
        headerTitle.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img src="../assets/icons/login-signup/${AVATAR_MAP[userData.username] || AVATAR_MAP.DEFAULT}"
                         alt="Avatar" class="w-full h-full object-cover">
                </div>
                <span class="text-base font-semibold text-gray-800">${userData.username}</span>
            </div>
        `;
        headerTitle.classList.remove("hidden");
    }
}

function hideCommunityMainSections() {
    document.getElementById("community-main-body").classList.add('hidden');
}

function showCommunityMainSections() {
    document.getElementById("community-main-body").classList.remove('hidden');
}

function renderMessages(userData, messages) {
    hideCommunityMainSections();
    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.remove('hidden-chat');

    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    if (messages.length > 0) {
        messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.isMittente ? 'sent' : ''}`;

            const msgDateTime = new Date(msg.timestamp.seconds * 1000)
                .toLocaleDateString('it-IT', {
                    minute: '2-digit',
                    hour: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                });

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.innerHTML =
                `<article class="community-chat-polaroid" >
                <button
                        type="button"
                        class="profile-polaroid-menu"
                        aria-label="Menu polaroid">
                    ⋮
                </button>
                <div class="profile-polaroid-image-container">
                    <div class="profile-polaroid-image">
                        <img class="cardboard-image" src="${msg.cartolina.immagini[0]}">
                    </div>
                </div>
                <div class="profile-polaroid-text">
                    <h2 class="profile-polaroid-title">${msg.cartolina.title}</h2>
                    <p class="profile-polaroid-subtitle">${formatDate(msg.cartolina.date)}</p>
                </div>
            </article>
            <div class='datetime-message'><p>${msgDateTime}</p></div>`;
            const article = bubble.querySelector('.community-chat-polaroid');
            if (article) {
                article.addEventListener('click', (e) => {
                    if (e.target.closest('.profile-polaroid-menu')) {
                        return;
                    }
                    openPolaroidDetail(msg.cartolina);
                });
            }
            msgDiv.appendChild(bubble);
            messagesContainer.appendChild(msgDiv);
        });
    } else {
        messagesContainer.innerHTML = '<p class="text-lg text-gray-500 text-center">Non hai ancora condiviso nessuna cartolina 🖼️</p>';;
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

window.addEventListener('popstate', (event) => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer && !chatContainer.classList.contains('hidden-chat')) {
        showCommunityMainSections();
        chatContainer.classList.add('hidden-chat');
        resetHeaderBaseForSection('community');
        document.dispatchEvent(new CustomEvent("section:revealed", { detail: { section: 'community' } }));
    }
});
