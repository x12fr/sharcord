const socket = io();
let username = new URLSearchParams(window.location.search).get('username');
let canSend = true;

socket.emit('setUsername', username);

document.getElementById('send-button').onclick = () => {
    if (canSend) {
        const msg = document.getElementById('message-input').value;
        socket.emit('chatMessage', msg);
        document.getElementById('message-input').value = '';
        canSend = false;
        setTimeout(() => { canSend = true }, 3000); // 3 second cooldown
    }
};

// ✨ Add Enter Key sending
document.getElementById('message-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        document.getElementById('send-button').click();
    }
});

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

    // ✨ Add purple [owner] name if X12
    let displayName = data.username;
    if (data.username === 'X12') {
        displayName = '<span style="color: purple;">X12 [owner]</span>';
    }

    msg.innerHTML = `<img src="${data.profilePic}" width="30" height="30"> <b>${displayName}:</b> ${formatMessage(data.message)}`;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
});

socket.on('chatImage', data => {
    const box = document.getElementById('chat-box');
    const img = document.createElement('div');

    let displayName = data.username;
    if (data.username === 'X12') {
        displayName = '<span style="color: purple;">X12 [owner]</span>';
    }

    img.innerHTML = `<img src="${data.profilePic}" width="30" height="30"> <b>${displayName}:</b><br><img src="${data.image}" style="max-width:300px;">`;
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
    let colors = ['red', 'yellow', 'black', 'orange'];
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
    const audio = new Audio(url);
    audio.play();
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
    // PFP Updated
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

    const audio = new Audio(data.audio);
    audio.play();

    setTimeout(() => {
        img.remove();
    }, 5000);
});
