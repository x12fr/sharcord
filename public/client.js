const socket = io();
let myUsername = '';
let isAdmin = false;
let isOwner = false;

// Login/Register
function register(username, password) {
    socket.emit('register', { username, password });
}

function login(username, password) {
    socket.emit('login', { username, password });
}

socket.on('registerSuccess', () => {
    window.location.href = '/login.html';
});

socket.on('registerError', (message) => {
    alert(message);
});

socket.on('loginSuccess', (username) => {
    myUsername = username;
    if (username === 'X12') {
        isAdmin = true;
        isOwner = true;
    }
    loadChat();
});

socket.on('loginError', (message) => {
    alert(message);
});

// Chat functions
function loadChat() {
    document.body.innerHTML = `
    <div class="chat">
        <div id="messages"></div>
        <input id="messageInput" placeholder="Type a message..." autocomplete="off">
        <input id="dmTarget" placeholder="(Optional) DM User">
        <button onclick="sendMessage()">Send</button>
        ${isAdmin ? adminPanelHTML() : ''}
        ${isOwner ? ownerPanelHTML() : ''}
    </div>
    `;
}

function sendMessage() {
    const message = document.getElementById('messageInput').value;
    const to = document.getElementById('dmTarget').value || null;
    if (message.trim() !== '') {
        socket.emit('sendMessage', { message, to });
        document.getElementById('messageInput').value = '';
    }
}

socket.on('receiveMessage', (data) => {
    const messages = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = data.private ? 'private' : '';
    div.innerText = data.private 
        ? `[DM] ${data.from}: ${data.message}` 
        : `${data.from}: ${data.message}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('receiveAnnouncement', (announcement) => {
    const messages = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'announcement';
    div.innerText = `📢 ANNOUNCEMENT: ${announcement}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});

// Admin Panel
function adminPanelHTML() {
    return `
    <div class="admin-panel">
        <h2>Admin Panel</h2>
        <input id="flashUser" placeholder="Flash User">
        <button onclick="flashScreen()">Flash Screen</button><br><br>
        
        <input id="redirectUser" placeholder="Redirect User">
        <input id="redirectURL" placeholder="URL to redirect">
        <button onclick="redirectUser()">Redirect</button><br><br>
        
        <input id="kickUser" placeholder="Kick User">
        <button onclick="kickUser()">Kick</button><br><br>
        
        <input id="announceInput" placeholder="Announcement text">
        <button onclick="sendAnnouncement()">Send Announcement</button><br><br>
    </div>
    `;
}

function flashScreen() {
    const user = document.getElementById('flashUser').value;
    if (user.trim() !== '') {
        socket.emit('adminFlash', user);
    }
}

function redirectUser() {
    const user = document.getElementById('redirectUser').value;
    const url = document.getElementById('redirectURL').value;
    if (user.trim() !== '' && url.trim() !== '') {
        socket.emit('adminRedirect', { targetUser: user, url: url });
    }
}

function kickUser() {
    const user = document.getElementById('kickUser').value;
    if (user.trim() !== '') {
        socket.emit('adminKick', user);
    }
}

function sendAnnouncement() {
    const text = document.getElementById('announceInput').value;
    if (text.trim() !== '') {
        socket.emit('adminAnnounce', text);
    }
}

// Owner Panel
function ownerPanelHTML() {
    return `
    <div class="owner-panel">
        <h2>Owner Panel</h2>
        <button onclick="triggerJumpscare()">Trigger Jumpscare</button>
    </div>
    `;
}

function triggerJumpscare() {
    socket.emit('ownerJumpscare');
}

// Flash screen effect
socket.on('flashScreen', () => {
    let colors = ['red', 'blue', 'green', 'purple', 'yellow'];
    let i = 0;
    const interval = setInterval(() => {
        document.body.style.backgroundColor = colors[i % colors.length];
        i++;
        if (i > 15) {
            clearInterval(interval);
            document.body.style.backgroundColor = 'white';
        }
    }, 100);
});

// Redirect
socket.on('redirect', (url) => {
    window.location.href = url;
});

// Jumpscare
socket.on('jumpscare', () => {
    const jumpscare = document.createElement('img');
    jumpscare.src = '/images/jumpscare.png';
    jumpscare.style.position = 'fixed';
    jumpscare.style.top = '0';
    jumpscare.style.left = '0';
    jumpscare.style.width = '100%';
    jumpscare.style.height = '100%';
    jumpscare.style.zIndex = '9999';
    document.body.appendChild(jumpscare);

    const scream = new Audio('/sounds/scream.mp3');
    scream.play();
});
