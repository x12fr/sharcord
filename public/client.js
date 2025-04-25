const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('user');
const isAdmin = urlParams.get('admin') === 'true';
let profilePic = localStorage.getItem('pfp') || '';

socket.emit('login', username);

if (isAdmin) document.getElementById('adminPanel').style.display = 'block';

let lastSent = 0;
function sendMessage() {
    const now = Date.now();
    if (now - lastSent < 3000) return alert('Wait before sending again!');
    const msg = document.getElementById('msgInput').value;
    if (msg.trim() === '') return;
    socket.emit('chat message', { msg, profilePic });
    document.getElementById('msgInput').value = '';
    lastSent = now;
}

document.getElementById('pfpUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        profilePic = reader.result;
        localStorage.setItem('pfp', profilePic);
    };
    if (file) reader.readAsDataURL(file);
});

socket.on('chat message', data => {
    const chat = document.getElementById('chatBox');
    const wrapper = document.createElement('div');
    wrapper.classList.add('chat-msg');
    const img = document.createElement('img');
    img.src = data.profilePic || '';
    img.width = 32;
    img.height = 32;
    img.style.borderRadius = '50%';
    img.onerror = () => img.style.display = 'none';
    const msg = document.createElement('span');
    msg.textContent = `${data.username}: ${data.message}`;
    wrapper.appendChild(img);
    wrapper.appendChild(msg);
    chat.appendChild(wrapper);
    chat.scrollTop = chat.scrollHeight;
});

socket.on('clearChat', () => {
    document.getElementById('chatBox').innerHTML = '';
});

socket.on('announcement', msg => {
    const bar = document.getElementById('announcementBar');
    bar.textContent = msg;
    bar.style.display = 'block';
    setTimeout(() => bar.style.display = 'none', 5000);
});

function strobe() { socket.emit('admin:strobe'); }
function timeoutUser() {
    const user = document.getElementById('targetUser').value;
    const dur = parseInt(document.getElementById('duration').value);
    socket.emit('admin:timeout', { username: user, duration: dur });
}
function kickUser() {
    const user = document.getElementById('targetUser').value;
    socket.emit('admin:kick', user);
}
function redirectUser() {
    const user = document.getElementById('targetUser').value;
    const url = document.getElementById('targetURL').value;
    socket.emit('admin:redirect', { username: user, url });
}
function spamTabs() {
    const user = document.getElementById('targetUser').value;
    socket.emit('admin:spamTabs', user);
}
function clearChat() { socket.emit('admin:clearChat'); }
function jumpscare() {
    const img = document.getElementById('jumpImg').files[0];
    const aud = document.getElementById('jumpAudio').files[0];
    if (!img || !aud) return alert('Choose both files!');
    const reader1 = new FileReader();
    const reader2 = new FileReader();
    reader1.onload = e1 => {
        reader2.onload = e2 => {
            socket.emit('admin:jumpscare', { image: e1.target.result, audio: e2.target.result });
        };
        reader2.readAsDataURL(aud);
    };
    reader1.readAsDataURL(img);
}
function grantTempAdmin() {
    const user = document.getElementById('targetUser').value;
    const dur = parseInt(document.getElementById('duration').value);
    socket.emit('admin:grantTempAdmin', { username: user, duration: dur });
}
function sendAnnouncement() {
    const msg = document.getElementById('announceMsg').value;
    socket.emit('admin:announce', msg);
}


document.getElementById('msgInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendPrivateMessage() {
    const to = document.getElementById('privateTo').value;
    const msg = document.getElementById('msgInput').value;
    if (!to || !msg) return alert('Private message needs a recipient and text!');
    socket.emit('private message', { to, message: msg, profilePic });
    document.getElementById('msgInput').value = '';
}

document.getElementById('imgUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        socket.emit('chat message', { msg: `<img src="${reader.result}" style="max-height:100px;">`, profilePic });
    };
    if (file) reader.readAsDataURL(file);
});

document.getElementById('audioUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        socket.emit('chat message', { msg: `<audio controls src="${reader.result}"></audio>`, profilePic });
    };
    if (file) reader.readAsDataURL(file);
});

socket.on('private message', data => {
    const chat = document.getElementById('chatBox');
    const wrapper = document.createElement('div');
    wrapper.classList.add('chat-msg');
    const msg = document.createElement('span');
    msg.innerHTML = `[Private] ${data.from}: ${data.message}`;
    wrapper.appendChild(msg);
    chat.appendChild(wrapper);
    chat.scrollTop = chat.scrollHeight;
});


function createMessageElement(data) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('chat-msg');

    const avatar = document.createElement('img');
    avatar.src = data.profilePic || '';
    avatar.classList.add('pfp');
    avatar.style.cursor = 'pointer';
    avatar.onclick = () => showUserProfile(data.username, data.profilePic);

    const text = document.createElement('span');
    text.innerHTML = `<strong>${data.username}:</strong> ${data.msg}`;

    wrapper.appendChild(avatar);
    wrapper.appendChild(text);

    return wrapper;
}

function showUserProfile(username, profilePic) {
    const overlay = document.createElement('div');
    overlay.id = 'profileOverlay';
    overlay.innerHTML = `
      <div id="profileBox">
        <img src="${profilePic}" class="pfp-large"><br>
        <strong>${username}</strong><br>
        <button onclick="startPrivateChat('${username}')">DM</button>
        <button onclick="closeOverlay()">Close</button>
      </div>`;
    document.body.appendChild(overlay);
}

function closeOverlay() {
    const overlay = document.getElementById('profileOverlay');
    if (overlay) overlay.remove();
}

function startPrivateChat(username) {
    document.getElementById('privateTo').value = username;
    closeOverlay();
}