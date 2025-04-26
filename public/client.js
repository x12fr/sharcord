const socket = io();

const username = localStorage.getItem('username');
const profilePic = localStorage.getItem('profilePic') || '/defaultpfp.png';
const isAdmin = username === 'X12';

if (!username) {
    window.location.href = '/login.html';
} else {
    socket.emit('join', { username, profilePic });
}

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

if (isAdmin) {
    document.getElementById('admin-panel').style.display = 'block';
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat message', { username, message, profilePic });
        messageInput.value = '';
    }
});

socket.on('chat message', ({ username, message, profilePic }) => {
    const msgElement = document.createElement('div');
    msgElement.classList.add('message');
    msgElement.innerHTML = `
        <img src="${profilePic}" alt="pfp" class="pfp">
        <b>${username}:</b> ${message}
    `;
    messagesContainer.appendChild(msgElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Profile picture changer
document.getElementById('profile-pic-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPic = document.getElementById('new-pfp').value;
    if (newPic) {
        localStorage.setItem('profilePic', newPic);
        location.reload();
    }
});
