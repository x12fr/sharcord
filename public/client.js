const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
socket.emit('register-user', username);

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

let lastSentTime = 0;

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSentTime < 3000) {
        alert('You must wait 3 seconds between messages!');
        return;
    }
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat-message', message);
        lastSentTime = now;
    }
    messageInput.value = '';
});

document.getElementById('send-image-btn').addEventListener('click', () => {
    const imgUrl = document.getElementById('image-url-input').value;
    if (imgUrl) {
        socket.emit('image-message', imgUrl);
    }
});

socket.on('chat-message', ({ user, pfp, msg }) => {
    const msgElement = document.createElement('div');
    msgElement.classList.add('message');
    msgElement.innerHTML = `<img src="${pfp}" class="pfp"> <b>${user}:</b> ${formatMessage(msg)}`;
    messagesContainer.appendChild(msgElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on('image-message', ({ user, pfp, imgUrl }) => {
    const imgElement = document.createElement('div');
    imgElement.classList.add('message');
    imgElement.innerHTML = `<img src="${pfp}" class="pfp"> <b>${user}:</b><br><img src="${imgUrl}" class="chat-image">`;
    messagesContainer.appendChild(imgElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on('error-message', (errMsg) => {
    alert(errMsg);
});

socket.on('redirect', (url) => {
    window.location.href = url;
});

socket.on('kicked', () => {
    alert('You were kicked!');
    window.location.href = '/';
});

socket.on('strobe', () => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    let i = 0;
    const interval = setInterval(() => {
        document.body.style.backgroundColor = colors[i % colors.length];
        i++;
    }, 100);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = '';
    }, 3000);
});

socket.on('play-audio', (audioUrl) => {
    const audio = new Audio(audioUrl);
    audio.play();
});

socket.on('jumpscare', () => {
    const img = document.createElement('img');
    img.src = 'https://i.imgur.com/Z4oql7y.png'; 
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.zIndex = '9999';
    document.body.appendChild(img);
    setTimeout(() => {
        document.body.removeChild(img);
    }, 2000);
});

function formatMessage(msg) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return msg.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
}

// ADMIN ONLY "P" toggle
if (username === "X12") {
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'url(https://i.imgur.com/qHj4fZ9.png) center center / cover no-repeat';
            overlay.style.zIndex = '9999';
            document.body.appendChild(overlay);
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 3000);
        }
    });
}
