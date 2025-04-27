const socket = io();
let username = new URLSearchParams(window.location.search).get('username');
let canSend = true;
let currentAudio = null;

socket.emit('setUsername', username);

document.getElementById('send-button').onclick = sendMessage;
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    if (canSend) {
        const msg = document.getElementById('message-input').value;
        if (msg.trim() !== '') {
            socket.emit('chatMessage', msg);
            document.getElementById('message-input').value = '';
            canSend = false;
            setTimeout(() => { canSend = true }, 3000);
        }
    }
}

document.getElementById('send-image-button').onclick = () => {
    const img = document.getElementById('image-url').value;
    socket.emit('chatImage', img);
    document.getElementById('image-url').value = '';
};

document.getElementById('set-pfp-button').onclick = () => {
    const url = document.getElementById('pfp-url').value;
    socket.emit('setProfilePic', url);
};

socket.on('chatMessage', data => {
    const box = document.getElementById('chat-box');
    const msg = document.createElement('div');
    const isOwner = data.username === "X12";
    msg.innerHTML = `<img src="${data.profilePic}" width="30" height="30"> <b style="color:${isOwner ? 'purple' : 'white'};">${data.username}${isOwner ? ' [owner]' : ''}:</b> ${formatMessage(data.message)}`;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
});

socket.on('chatImage', data => {
    const box = document.getElementById('chat-box');
    const img = document.createElement('div');
    const isOwner = data.username === "X12";
    img.innerHTML = `<img src="${data.profilePic}" width="30" height="30"> <b style="color:${isOwner ? 'purple' : 'white'};">${data.username}${isOwner ? ' [owner]' : ''}:</b><br><img src="${data.image}" style="max-width:300px;">`;
    box.appendChild(img);
    box.scrollTop = box.scrollHeight;
});

function formatMessage(msg) {
    return msg.replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
}

// Admin
if (username === "X12") {
    document.addEventListener('keydown', (e) => {
        if (e.key === ']') {
            const panel = document.getElementById('admin-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    });
}

function strobe() {
    socket.emit('adminStrobe');
}

function playAudio() {
    const url = document.getElementById('audio-url').value;
    socket.emit('adminAudio', url);
}

function stopAudio() {
    socket.emit('adminStopAudio');
}

function timeout() {
    const user = document.getElementById('timeout-user').value;
    const duration = document.getElementById('timeout-duration').value;
    socket.emit('adminTimeout', { user, duration });
}

function redirect() {
    const user = document.getElementById('redirect-user').value;
    const link = document.getElementById('redirect-link').value;
    socket.emit('adminRedirect', { user, link });
}

function changePFP() {
    const user = document.getElementById('change-pfp-user').value;
    const url = document.getElementById('change-pfp-url').value;
    socket.emit('adminChangePFP', { user, url });
}

function jumpScare() {
    const img = document.getElementById('jumpscare-img').value;
    const audio = document.getElementById('jumpscare-audio').value;
    socket.emit('adminJumpScare', { img, audio });
}

socket.on('strobe', () => {
    let colors = ['black', 'yellow'];
    let i = 0;
    const interval = setInterval(() => {
        document.body.style.backgroundColor = colors[i % colors.length];
        i++;
    }, 200);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = "black";
    }, 3000);
});

socket.on('playAudio', (url) => {
    if (currentAudio) currentAudio.pause();
    currentAudio = new Audio(url);
    currentAudio.play();
});

socket.on('stopAudio', () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
});

socket.on('timeout', (duration) => {
    document.body.innerHTML = `<h1 style="color:red;">Timed Out for ${duration} seconds</h1>`;
    setTimeout(() => {
        location.reload();
    }, duration * 1000);
});

socket.on('redirect', (link) => {
    window.location.href = link;
});

socket.on('updatePFP', (url) => {
    // Profile picture updated
});

socket.on('jumpScare', (data) => {
    const img = document.createElement('img');
    img.src = data.img;
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.zIndex = '9999';
    document.body.appendChild(img);

    if (currentAudio) currentAudio.pause();
    currentAudio = new Audio(data.audio);
    currentAudio.play();

    setTimeout(() => {
        img.remove();
    }, 5000);
});
