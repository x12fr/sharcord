const socket = io();

// Elements
const loginSection = document.querySelector('.container');
const chatSection = document.getElementById('chatSection');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const imageURL = document.getElementById('imageURL');
const imageSendBtn = document.getElementById('imageSendBtn');
const profilePicInput = document.getElementById('profilePicInput');
const setPicBtn = document.getElementById('setPicBtn');
const adminPanel = document.getElementById('adminPanel');

let username = localStorage.getItem('username');
let profilePic = localStorage.getItem('profilePic') || 'https://via.placeholder.com/30';
let isAdmin = false;

if (username) {
    socket.emit('join', { username, adminKey: localStorage.getItem('adminKey') });
    loginSection.style.display = 'none';
    chatSection.style.display = 'block';
}

document.getElementById('claimBtn')?.addEventListener('click', () => {
    username = document.getElementById('usernameInput').value.trim();
    const adminKey = document.getElementById('adminKeyInput').value.trim();
    if (!username) return alert('Please enter a username');
    localStorage.setItem('username', username);
    localStorage.setItem('adminKey', adminKey);
    socket.emit('join', { username, adminKey });
    loginSection.style.display = 'none';
    chatSection.style.display = 'block';
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message !== '') {
        socket.emit('chatMessage', { username, message, profilePic });
        messageInput.value = '';
    }
}

imageSendBtn.addEventListener('click', () => {
    const imgUrl = imageURL.value.trim();
    if (imgUrl !== '') {
        socket.emit('chatImage', { username, imgUrl, profilePic });
        imageURL.value = '';
    }
});

setPicBtn.addEventListener('click', () => {
    const newPic = profilePicInput.value.trim();
    if (newPic) {
        profilePic = newPic;
        localStorage.setItem('profilePic', profilePic);
    }
});

// Admin functions
document.getElementById('playAudioBtn')?.addEventListener('click', () => {
    const url = document.getElementById('audioURL').value.trim();
    if (url) socket.emit('playAudio', url);
});

document.getElementById('strobeBtn')?.addEventListener('click', () => {
    const duration = parseInt(document.getElementById('strobeDuration').value.trim());
    if (!isNaN(duration)) socket.emit('strobeScreen', duration);
});

document.getElementById('timeoutBtn')?.addEventListener('click', () => {
    const targetUsername = document.getElementById('timeoutUsername').value.trim();
    const duration = parseInt(document.getElementById('timeoutDuration').value.trim());
    if (targetUsername && !isNaN(duration)) {
        socket.emit('timeoutUser', { targetUsername, duration });
    }
});

document.getElementById('redirectBtn')?.addEventListener('click', () => {
    const targetUsername = document.getElementById('redirectUsername').value.trim();
    const redirectURL = document.getElementById('redirectURL').value.trim();
    if (targetUsername && redirectURL) {
        socket.emit('redirectUser', { targetUsername, redirectURL });
    }
});

// Incoming Messages
socket.on('chatMessage', (data) => {
    const div = document.createElement('div');
    div.innerHTML = `<img class="chat-pfp" src="${data.profilePic}"> <strong style="color:${data.isAdmin ? 'red' : 'white'}">${data.username}${data.isAdmin ? ' [Administrator]' : ''}</strong>: ${data.message}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('chatImage', (data) => {
    const div = document.createElement('div');
    div.innerHTML = `<img class="chat-pfp" src="${data.profilePic}"> <strong style="color:${data.isAdmin ? 'red' : 'white'}">${data.username}${data.isAdmin ? ' [Administrator]' : ''}</strong>:<br><img src="${data.imgUrl}" class="chat-img">`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('adminStatus', () => {
    adminPanel.style.display = 'block';
});

socket.on('playAudio', (url) => {
    const audio = new Audio(url);
    audio.play();
});

socket.on('strobeScreen', (duration) => {
    let colors = ['red', 'blue', 'green', 'purple', 'yellow'];
    let count = 0;
    const interval = setInterval(() => {
        document.body.style.backgroundColor = colors[count % colors.length];
        count++;
    }, 300);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = 'black';
    }, duration * 1000);
});

socket.on('timeoutUser', (seconds) => {
    alert(`You have been timed out for ${seconds} seconds.`);
    document.body.innerHTML = `<h1 style="color:red;">Timed Out: ${seconds}s</h1>`;
    setTimeout(() => location.reload(), seconds * 1000);
});

socket.on('redirectUser', (url) => {
    window.location.href = url;
});

// Load previous messages
socket.on('chatHistory', (messages) => {
    messagesDiv.innerHTML = '';
    messages.forEach(data => {
        const div = document.createElement('div');
        if (data.type === 'text') {
            div.innerHTML = `<img class="chat-pfp" src="${data.profilePic}"> <strong style="color:${data.isAdmin ? 'red' : 'white'}">${data.username}${data.isAdmin ? ' [Administrator]' : ''}</strong>: ${data.message}`;
        } else if (data.type === 'image') {
            div.innerHTML = `<img class="chat-pfp" src="${data.profilePic}"> <strong style="color:${data.isAdmin ? 'red' : 'white'}">${data.username}${data.isAdmin ? ' [Administrator]' : ''}</strong>:<br><img src="${data.imgUrl}" class="chat-img">`;
        }
        messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
