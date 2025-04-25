// client.js
const socket = io();

const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');

const strobeBtn = document.getElementById('strobeBtn');
const strobeDuration = document.getElementById('strobeDuration');
const timeoutBtn = document.getElementById('timeoutBtn');
const timeoutUser = document.getElementById('timeoutUser');
const timeoutDuration = document.getElementById('timeoutDuration');
const redirectBtn = document.getElementById('redirectBtn');
const redirectUser = document.getElementById('redirectUser');
const redirectLink = document.getElementById('redirectLink');
const announceBtn = document.getElementById('announceBtn');
const announcementText = document.getElementById('announcementText');
const jumpscareBtn = document.getElementById('jumpscareBtn');
const jumpscareImage = document.getElementById('jumpscareImage');
const jumpscareAudio = document.getElementById('jumpscareAudio');
const logoutBtn = document.getElementById('logoutBtn');

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim() !== '') {
        socket.emit('chatMessage', message);
        messageInput.value = '';
    }
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendButton.click();
});

socket.on('chatMessage', (data) => {
    const div = document.createElement('div');
    div.textContent = `${data.username}: ${data.message}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Admin Controls
if (strobeBtn) {
    strobeBtn.addEventListener('click', () => {
        socket.emit('adminStrobe', { duration: parseInt(strobeDuration.value) });
    });
}

if (timeoutBtn) {
    timeoutBtn.addEventListener('click', () => {
        socket.emit('adminTimeout', { user: timeoutUser.value, duration: parseInt(timeoutDuration.value) });
    });
}

if (redirectBtn) {
    redirectBtn.addEventListener('click', () => {
        socket.emit('adminRedirect', { user: redirectUser.value, link: redirectLink.value });
    });
}

if (announceBtn) {
    announceBtn.addEventListener('click', () => {
        socket.emit('adminAnnounce', announcementText.value);
    });
}

if (jumpscareBtn) {
    jumpscareBtn.addEventListener('click', () => {
        const imageFile = jumpscareImage.files[0];
        const audioFile = jumpscareAudio.files[0];

        if (imageFile && audioFile) {
            const readerImg = new FileReader();
            const readerAud = new FileReader();

            readerImg.onload = (e) => {
                const imageUrl = e.target.result;
                readerAud.onload = (ev) => {
                    const audioUrl = ev.target.result;
                    socket.emit('adminJumpscare', { image: imageUrl, audio: audioUrl });
                };
                readerAud.readAsDataURL(audioFile);
            };
            readerImg.readAsDataURL(imageFile);
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
    });
}

// Receive admin events
socket.on('strobe', (duration) => {
    let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'pink', 'white'];
    let index = 0;
    const interval = setInterval(() => {
        document.body.style.backgroundColor = colors[index++ % colors.length];
    }, 100);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = '';
    }, duration * 1000);
});

socket.on('timeout', (data) => {
    if (data.username === window.username) {
        alert(`You are timed out for ${data.duration} seconds!`);
        document.getElementById('messageInput').disabled = true;
        setTimeout(() => {
            document.getElementById('messageInput').disabled = false;
        }, data.duration * 1000);
    }
});

socket.on('redirect', (link) => {
    window.location.href = link;
});

socket.on('announce', (message) => {
    alert(`Announcement: ${message}`);
});

socket.on('jumpscare', (data) => {
    const img = document.createElement('img');
    img.src = data.image;
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100vw';
    img.style.height = '100vh';
    img.style.zIndex = '9999';
    document.body.appendChild(img);

    const audio = new Audio(data.audio);
    audio.play();
});
