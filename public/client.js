const socket = io();

const chatBox = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendImageInput = document.getElementById('sendImageInput');
const sendImageBtn = document.getElementById('sendImageBtn');
const pfpInput = document.getElementById('pfpInput');
const adminPanel = document.getElementById('adminPanel');

// Send message on Enter
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim() !== '') {
        socket.emit('chat message', messageInput.value.trim());
        messageInput.value = '';
    }
});

// Send Image Button
sendImageBtn.addEventListener('click', () => {
    const imageUrl = sendImageInput.value.trim();
    if (imageUrl) {
        socket.emit('chat image', imageUrl);
        sendImageInput.value = '';
    }
});

// Update profile picture
pfpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && pfpInput.value.trim() !== '') {
        localStorage.setItem('pfp', pfpInput.value.trim());
        window.location.reload();
    }
});

// Join Chat
socket.emit('join', {
    username: localStorage.getItem('username'),
    adminKey: localStorage.getItem('adminKey'),
    pfp: localStorage.getItem('pfp')
});

// Receive initial admin info
socket.on('init', (data) => {
    if (data.isAdmin) {
        adminPanel.style.display = 'block';
    }
});

// Display incoming chat messages
socket.on('chat message', (data) => {
    appendMessage(data);
});

// Display incoming chat images
socket.on('chat image', (data) => {
    appendImage(data);
});

// Append text messages
function appendMessage(data) {
    const div = document.createElement('div');
    div.className = 'message';

    const pfpImg = document.createElement('img');
    pfpImg.src = data.pfp || 'default.png';
    pfpImg.className = 'pfp';

    const usernameSpan = document.createElement('span');
    usernameSpan.innerText = data.username;
    usernameSpan.style.color = data.isAdmin ? 'red' : 'white';

    const adminTag = data.isAdmin ? ' [administrator]' : '';

    const messageSpan = document.createElement('span');
    messageSpan.innerText = ` ${adminTag}: ${data.message}`;
    messageSpan.style.color = 'white';

    div.appendChild(pfpImg);
    div.appendChild(usernameSpan);
    div.appendChild(messageSpan);

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Append image messages
function appendImage(data) {
    const div = document.createElement('div');
    div.className = 'message';

    const pfpImg = document.createElement('img');
    pfpImg.src = data.pfp || 'default.png';
    pfpImg.className = 'pfp';

    const usernameSpan = document.createElement('span');
    usernameSpan.innerText = data.username;
    usernameSpan.style.color = data.isAdmin ? 'red' : 'white';

    const adminTag = data.isAdmin ? ' [administrator]' : '';

    const img = document.createElement('img');
    img.src = data.imageUrl;
    img.className = 'chat-image';

    div.appendChild(pfpImg);
    div.appendChild(usernameSpan);
    div.append(` ${adminTag}: `);
    div.appendChild(img);

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
