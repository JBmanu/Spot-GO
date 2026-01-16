import {getCurrentUser, getCartolinaById, pullMessages} from "../../database.js";
import {formatDate} from "../../common/datetime.js";
import {openPolaroidDetail} from "../polaroidDetail.js"

export async function fetchFriendMessages(followingData) {
    const userMail = await getCurrentUser();
    const messagesData = await pullMessages(userMail.email, followingData.email);
    const messagesPromise = messagesData.map(async msg => {
        const cartolina =  await getCartolinaById(msg.ref);
        return {
            ... msg,
            cartolina: cartolina
        }
    });
    const messages = await Promise.all(messagesPromise);
    renderMessages(followingData, messages);
}

function renderMessages(userData, messages) {
    document.getElementById('chat-container').classList.toggle('hidden-chat');
    const chatName = document.getElementById('user-chat-name');
    chatName.textContent = userData.username;
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML ='';
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
                    //TODO: open modal cartolina details
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
    // Chiudi chat
    document.getElementById('closeBtn').addEventListener('click', () => {
        document.getElementById('chat-container').classList.add('hidden-chat');
    });
}

