const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

socket.emit('join', { username, profilePic: '/default.png' });

const chatBox = document.getElementById('chat-box');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

if (username === 'X12') {
    document.getElementById('admin-panel').style.display = 'block';
}

socket.on('chat message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<b><img src="${data.profilePic}" width="20" height="20"> ${data.username}:</b> ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('image upload', (data) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<b><img src="${data.profilePic}" width="20" height="20"> ${data.username}:</b><br><img src="${data.image}" width="200">`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('announcement', (data) => {
    const announcementBar = document.getElementById('announcement-bar');
    announcementBar.innerText = data.message;
    announcementBar.style.backgroundColor = 'yellow';
});

socket.on('strobe', () => {
    let colors = ['red', 'blue', 'green', 'purple', 'orange'];
    let count = 0;
    const strobeInterval = setInterval(() => {
        document.body.style.backgroundColor = colors[count % colors.length];
        count++;
        if (count > 10) clearInterval(strobeInterval);
    }, 300);
});

socket.on('timeout user', ({ username: target, duration }) => {
    if (username === target) {
        messageInput.disabled = true;
        setTimeout(() => {
            messageInput.disabled = false;
        }, duration * 1000);
    }
});

socket.on('redirect user', ({ username: target, url }) => {
    if (username === target) {
        window.location.href = url;
    }
});

socket.on('play audio', (url) => {
    const audio = new Audio(url);
    audio.play();
});

socket.on('jumpscare', ({ image, audio }) => {
    const img = document.createElement('img');
    img.src = image;
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.zIndex = '9999';
    document.body.appendChild(img);

    const sound = new Audio(audio);
    sound.play();

    setTimeout(() => {
        img.remove();
    }, 5000);
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (messageInput.value.trim() !== '') {
        socket.emit('chat message', { message: messageInput.value });
        messageInput.value = '';
    }
});

function strobe() {
    socket.emit('strobe');
}

function sendAnnouncement() {
    const text = prompt('Enter announcement text:');
    if (text) {
        socket.emit('announcement', text);
    }
}

function timeoutUser() {
    const target = prompt('Enter username to timeout:');
    const seconds = prompt('Enter timeout duration (seconds):');
    if (target && seconds) {
        socket.emit('timeout user', { username: target, duration: parseInt(seconds) });
    }
}

function redirectUser() {
    const target = prompt('Enter username to redirect:');
    const url = prompt('Enter URL to redirect to:');
    if (target && url) {
        socket.emit('redirect user', { username: target, url });
    }
}

function jumpscare() {
    const image = document.getElementById('jumpscare-image').value;
    const audio = document.getElementById('jumpscare-audio').value;
    if (image && audio) {
        socket.emit('jumpscare', { image, audio });
    }
}
