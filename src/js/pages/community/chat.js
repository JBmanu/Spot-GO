import { getCurrentUser, getCartolinaById, pullMessages } from "../../database.js";
import { openPolaroidDetail } from "../polaroidDetail.js"
import { AVATAR_MAP } from "../../common/avatarImagePaths.js";
import { resetHeaderBaseForSection } from "../../common/navigation.js";
import { PATHS } from "../../paths.js";

let chatTemplateCache = null;


async function loadSharedTemplates() {
    if (document.getElementById("shared-spot-templates-container")) return;
    try {
        const res = await fetch(PATHS.html.spotTemplates);
        if (!res.ok) throw new Error("Failed to load templates");
        const html = await res.text();
        const container = document.createElement("div");
        container.id = "shared-spot-templates-container";
        container.style.display = "none";
        container.innerHTML = html;
        document.body.appendChild(container);
    } catch (err) {
        console.error("Error loading shared templates:", err);
    }
}

async function loadChatView() {
    if (document.getElementById('chat-container')) return;

    try {
        await loadSharedTemplates();

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
        const main = document.getElementById("main");
        main.appendChild(chatContainer);
    } catch (err) {
        console.error("Error loading chat view:", err);
        alert("Impossibile caricare la chat. Riprova o ricarica la pagina.");
    }
}


export function closeChat({ animated = true } = {}) {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer && !chatContainer.classList.contains('hidden-chat')) {

        if (!animated) {
            chatContainer.style.display = 'none';
        }

        resetHeaderBaseForSection('community');
        if (history.state && history.state.chatOpen) {
            history.back();
        }
    }
}

export async function openChat(userData) {
    await loadChatView();

    const chatContainer = document.getElementById('chat-container');
    const messagesContainer = document.getElementById('messagesContainer');

    if (chatContainer) {
        // chatContainer.classList.remove('hidden-chat');
        chatContainer.style.display = '';
        // hideCommunityMainSections();
        const communitySection = main.querySelector('[data-section-view="community"]');
        communitySection.hidden = true;
    }

    const avatarImg = document.getElementById('chat-header-avatar');
    const userName = document.getElementById('chat-header-name');

    if (avatarImg) {
        avatarImg.src = `../assets/icons/login-signup/${AVATAR_MAP[userData.username] || AVATAR_MAP.DEFAULT}`;
        avatarImg.alt = userData.username;
    }
    if (userName) {
        userName.textContent = userData.username;
    }

    updateChatHeader(userData);
    history.pushState({ chatOpen: true }, "");

    const loader = document.getElementById('chat-loader');
    if (loader) loader.classList.remove('hidden');

    if (messagesContainer) messagesContainer.innerHTML = '';

    try {
        const currentUser = await getCurrentUser();
        const messagesData = await pullMessages(currentUser.email, userData.email);
        const messagesPromise = messagesData.map(async msg => {
            const cartolina = await getCartolinaById(msg.ref);
            return {
                ...msg,
                cartolina: cartolina
            }
        });
        const messages = await Promise.all(messagesPromise);

        if (loader) loader.classList.add('hidden');

        renderMessages(messages);
    } catch (error) {
        console.error("Errore caricamento chat:", error);

        if (loader) loader.classList.add('hidden');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<p class="text-center text-red-500 p-4">Errore durante il caricamento dei messaggi.</p>';
        }
    }
}

function updateChatHeader() {
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
        headerTitle.textContent = "Chat";
        headerTitle.classList.remove("hidden");
    }
}

function hideCommunityMainSections() {
    document.getElementById("community-main-body").classList.add('hidden');
}

function showCommunityMainSections() {
    document.getElementById("community-main-body").classList.remove('hidden');
}

function renderMessages(messages) {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.remove('hidden-chat');

    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    if (messages.length > 0) {
        let lastDateStr = '';

        messages.forEach(msg => {
            const msgDateObj = new Date(msg.timestamp.seconds * 1000);

            const dateStr = msgDateObj.toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            if (dateStr !== lastDateStr) {
                const separator = document.createElement('div');
                separator.className = 'chat-date-separator';
                separator.textContent = dateStr;
                messagesContainer.appendChild(separator);
                lastDateStr = dateStr;
            }

            const bubble = document.createElement('div');
            bubble.className = `message-bubble ${msg.isMittente ? 'sent' : ''}`;

            const template = document.querySelector('[data-template="chat-polaroid-template"]');
            if (template) {
                const clone = template.content.cloneNode(true);
                const article = clone.querySelector('.chat-polaroid-card');

                const img = clone.querySelector('[data-field="image"]');
                const title = clone.querySelector('[data-field="title"]');

                console.log(msg);
                if (msg.cartolina !== null) {
                    if (img && msg.cartolina.immagini && msg.cartolina.immagini.length > 0) {
                        img.src = msg.cartolina.immagini[0];
                    }
                    if (title) title.textContent = msg.cartolina.title;

                    if (article) {
                        article.addEventListener('click', (e) => {
                            openPolaroidDetail(msg.cartolina, {returnViewKey: "community-chat-view"});
                        });
                    }
                } else {
                    article.classList.add('chat-corrupted-polaroid');
                    if (title) title.textContent = "Non disponibile";
                }
            
                bubble.appendChild(clone);

            } else {
                console.warn("Template chat-polaroid-template not found, fallback to legacy html");
                bubble.innerHTML = `<p style="color:red">Template Error</p>`;
            }

            messagesContainer.appendChild(bubble);
        });
    } else {
        messagesContainer.innerHTML = '<p class="text-lg text-gray-500 text-center">Non hai ancora condiviso nessuna cartolina 🖼️</p>';;
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

window.addEventListener('popstate', (event) => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer /*&& !chatContainer.classList.contains('hidden-chat')*/) {
        // showCommunityMainSections();
        chatContainer.classList.add('hidden-chat');
        resetHeaderBaseForSection('community');
        document.dispatchEvent(new CustomEvent("section:revealed", { detail: { section: 'community' } }));
    }
});
