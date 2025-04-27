const socket = io();

const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');
const sendImageBtn = document.getElementById('send-image-btn');
const imageUrlInput = document.getElementById('image-url-input');
const pfpUrlInput = document.getElementById('pfp-url-input');
const setPfpBtn = document.getElementById('set-pfp-btn');
const adminPanel = document.getElementById('admin-panel');

let username = localStorage.getItem('username');
let pfp = localStorage.getItem('pfp') || 'https://cdn.discordapp.com/embed/avatars/0.png'; 
let isAdmin = username === 'X12'; // Replace with your real admin username

// Set PFP
setPfpBtn.addEventListener('click', () => {
    const url = pfpUrlInput.value;
    if (url) {
        pfp = url;
        localStorage.setItem('pfp', pfp);
        alert('Profile picture updated!');
    }
});

// Toggle Admin Panel
document.addEventListener('keydown', (e) => {
    if (e.key === ']') {
        if (isAdmin) {
            adminPanel.style.display = adminPanel.style.display === 'none' ? 'block' : 'none';
        }
    }
});

// Sending text messages
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', { text: input.value, username, pfp });
        input.value = '';
    }
});

// Sending image messages
sendImageBtn.addEventListener('click', () => {
    const url = imageUrlInput.value;
    if (url) {
        socket.emit('chat image', { image: url, username, pfp });
        imageUrlInput.value = '';
    }
});

// Display incoming messages
socket.on('chat message', (msg) => {
    const item = document.createElement('div');
    item.innerHTML = `<img src="${msg.pfp}" width="30" style="border-radius:50%; vertical-align:middle;"> <b>${msg.username}</b>: ${msg.text}`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('chat image', (data) => {
    const item = document.createElement('div');
    item.innerHTML = `<img src="${data.pfp}" width="30" style="border-radius:50%; vertical-align:middle;"> <b>${data.username}</b>:<br><img src="${data.image}" style="max-width:200px;">`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// Admin Buttons
document.getElementById('jumpscare-btn').addEventListener('click', () => {
    const img = document.getElementById('jumpscare-img').value;
    const audio = document.getElementById('jumpscare-audio').value;
    socket.emit('jumpscare', { img, audio });
});

document.getElementById('kick-btn').addEventListener('click', () => {
    const user = document.getElementById('kick-user').value;
    socket.emit('kick', user);
});

document.getElementById('force-pfp-btn').addEventListener('click', () => {
    const user = document.getElementById('force-pfp-user').value;
    const newPfp = document.getElementById('force-pfp-url').value;
    socket.emit('force pfp', { user, newPfp });
});

document.getElementById('strobe-btn').addEventListener('click', () => {
    socket.emit('strobe');
});

// Admin-Only "P" key image toggle
let pImageToggled = false;
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p' && isAdmin && document.activeElement !== input) {
        if (!pImageToggled) {
            const img = document.createElement('img');
            img.src = 'https://files.catbox.moe/5pz8os.png';
            img.id = 'fullscreen-p-img';
            img.style.position = 'fixed';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100vw';
            img.style.height = '100vh';
            img.style.objectFit = 'cover';
            img.style.zIndex = '9999';
            document.body.appendChild(img);
            pImageToggled = true;
        } else {
            const existing = document.getElementById('fullscreen-p-img');
            if (existing) existing.remove();
            pImageToggled = false;
        }
    }
});

// Socket listeners for admin actions
socket.on('do jumpscare', (data) => {
    const img = document.createElement('img');
    img.src = data.img;
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100vw';
    img.style.height = '100vh';
    img.style.objectFit = 'cover';
    img.style.zIndex = '9999';
    document.body.appendChild(img);

    const audio = new Audio(data.audio);
    audio.play();

    setTimeout(() => {
        img.remove();
    }, 5000);
});

socket.on('kicked', () => {
    alert('You have been kicked!');
    window.location.href = '/';
});

socket.on('force pfp', (data) => {
    if (username === data.user) {
        pfp = data.newPfp;
        localStorage.setItem('pfp', pfp);
        alert('Admin changed your profile picture!');
    }
});

socket.on('strobe', () => {
    let colors = ['red', 'black', 'white'];
    let i = 0;
    const interval = setInterval(() => {
        document.body.style.backgroundColor = colors[i % colors.length];
        i++;
    }, 200);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = '#000';
    }, 3000);
});
