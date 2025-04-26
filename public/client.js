const socket = io();
const params = new URLSearchParams(window.location.search);
const sessionID = params.get('session');

socket.emit('join', sessionID);

socket.on('init', ({ username, pfp, isAdmin }) => {
    document.getElementById('usernameDisplay').innerText = username;
    if (isAdmin) {
        document.getElementById('adminPanel').style.display = 'block';
    }
});

function sendMessage() {
    const input = document.getElementById('messageInput');
    if (input.value.trim() !== "") {
        socket.emit('sendMessage', input.value);
        input.value = "";
    }
}

socket.on('message', ({ username, pfp, text }) => {
    const chat = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.innerHTML = `<img src="${pfp}" style="width:30px;height:30px;border-radius:50%;"> <b>${username}:</b> ${text}`;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
});

function changePfp() {
    const newPfp = document.getElementById('pfpInput').value;
    if (newPfp.trim() !== "") {
        socket.emit('updatePfp', newPfp);
        alert('Profile picture updated!');
    }
}

function clearChat() {
    document.getElementById('chatMessages').innerHTML = '';
}

function strobeAll() {
    let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
    let count = 0;
    const interval = setInterval(() => {
        document.body.style.background = colors[count % colors.length];
        count++;
        if (count > 20) {
            clearInterval(interval);
            document.body.style.background = '';
        }
    }, 100);
}

function sendAnnouncement() {
    const msg = document.getElementById('announcementInput').value;
    if (msg.trim() !== "") {
        socket.emit('sendAnnouncement', msg);
    }
}

socket.on('announcement', (text) => {
    const notice = document.createElement('div');
    notice.style.background = "black";
    notice.style.color = "white";
    notice.style.padding = "10px";
    notice.style.textAlign = "center";
    notice.innerText = text;
    document.body.prepend(notice);
    setTimeout(() => {
        notice.remove();
    }, 10000);
});

socket.on('forceLogout', () => {
    window.location.href = "/";
});
