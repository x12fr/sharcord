const socket = io();
let isTyping = false;
let lastMessageTime = 0;
let privateRecipient = null;

// Messaging
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;

    const now = Date.now();
    if (now - lastMessageTime < 3000) {
        alert('Cooldown: Wait 3 seconds!');
        return;
    }

    socket.emit('chat message', message);
    input.value = '';
    lastMessageTime = now;
}

function sendImage() {
    const fileInput = document.getElementById('imageInput');
    if (fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        socket.emit('chat image', e.target.result);
    };
    reader.readAsDataURL(file);
}

function sendPrivateMessage() {
    const message = document.getElementById('privateMessageInput').value.trim();
    if (message && privateRecipient) {
        socket.emit('private message', { to: privateRecipient, message });
        closePrivateMessage();
    }
}

function closePrivateMessage() {
    document.getElementById('privateMessageContainer').classList.add('hidden');
    privateRecipient = null;
}

// Admin Stuff
function kickUser() {
    const user = document.getElementById('kickUser').value.trim();
    if (user) socket.emit('admin kick', user);
}

function timeoutUser() {
    const user = document.getElementById('timeoutUser').value.trim();
    const seconds = document.getElementById('timeoutDuration').value;
    if (user && seconds) socket.emit('admin timeout', { user, seconds });
}

function redirectUser() {
    const user = document.getElementById('redirectUser').value.trim();
    const link = document.getElementById('redirectLink').value.trim();
    if (user && link) socket.emit('admin redirect', { user, link });
}

function sendAnnouncement() {
    const text = document.getElementById('announcementText').value.trim();
    if (text) socket.emit('admin announce', text);
}

function jumpscareAll() {
    const image = document.getElementById('jumpscareImage').value.trim();
    const audio = document.getElementById('jumpscareAudio').value.trim();
    if (image && audio) socket.emit('admin jumpscare', { image, audio });
}

function strobeScreen() {
    socket.emit('admin strobe');
}

function kickEveryone() {
    socket.emit('admin kickall');
}

function changeUserPfp() {
    const user = document.getElementById('changePfpUser').value.trim();
    const url = document.getElementById('newPfpUrl').value.trim();
    if (user && url) socket.emit('admin changepfp', { user, url });
}

function changeMyPfp() {
    const fileInput = document.getElementById('pfpInput');
    if (fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        socket.emit('change pfp', e.target.result);
    };
    reader.readAsDataURL(file);
}

function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    panel.classList.toggle('hidden');
}

// Listeners
socket.on('chat message', ({ username, message, pfp, link }) => {
    const chat = document.getElementById('chatArea');
    const msgElement = document.createElement('div');
    msgElement.innerHTML = `<img src="${pfp}" width="30" style="border-radius:50%;"> <b>${username}</b>: ${link || message}`;
    chat.appendChild(msgElement);
    chat.scrollTop = chat.scrollHeight;
});

socket.on('chat image', ({ username, image, pfp }) => {
    const chat = document.getElementById('chatArea');
    const msgElement = document.createElement('div');
    msgElement.innerHTML = `<img src="${pfp}" width="30" style="border-radius:50%;"> <b>${username}</b>:<br><img src="${image}" width="150">`;
    chat.appendChild(msgElement);
    chat.scrollTop = chat.scrollHeight;
});

socket.on('private message', ({ from, message }) => {
    alert(`Private message from ${from}: ${message}`);
});

socket.on('jumpscare', ({ image, audio }) => {
    const overlay = document.getElementById('jumpscareOverlay');
    const img = document.getElementById('jumpscareImageElement');
    img.src = image;
    overlay.classList.remove('hidden');
    const sound = new Audio(audio);
    sound.play();
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 5000);
});

socket.on('redirect', (link) => {
    window.location.href = link;
});

socket.on('timeout', (seconds) => {
    alert(`You are timed out for ${seconds} seconds!`);
});

socket.on('announcement', (text) => {
    alert(`Announcement: ${text}`);
});

socket.on('strobe', () => {
    const colors = ['red', 'blue', 'green', 'yellow', 'pink', 'white'];
    let i = 0;
    const interval = setInterval(() => {
        document.body.style.background = colors[i % colors.length];
        i++;
    }, 200);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.background = '#0d0d0d';
    }, 3000);
});

socket.on('update userlist', (users) => {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    users.forEach(u => {
        const userEl = document.createElement('div');
        userEl.innerHTML = `<img src="${u.pfp}" width="20" style="border-radius:50%;"> ${u.username}`;
        userEl.onclick = () => {
            privateRecipient = u.username;
            document.getElementById('privateRecipient').innerText = u.username;
            document.getElementById('privateMessageContainer').classList.remove('hidden');
        };
        userList.appendChild(userEl);
    });
});

// "P" Key Jumpscare
document.addEventListener('keydown', (e) => {
    const input = document.activeElement.tagName.toLowerCase();
    if (e.key === 'p' && input !== 'input' && input !== 'textarea') {
        const overlay = document.getElementById('jumpscareOverlay');
        const img = document.getElementById('jumpscareImageElement');
        img.src = 'https://files.catbox.moe/5pz8os.png';
        overlay.classList.toggle('hidden');
    }
});
