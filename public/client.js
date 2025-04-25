const socket = io();
let currentUser = localStorage.getItem('username');
let isAdmin = false;
let isOwner = false;

function appendMessage(msg, sender, isPrivate = false) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.textContent = `${sender}: ${msg}`;
  div.className = isPrivate ? 'private-message' : 'message';
  div.onclick = () => {
    if (sender !== currentUser) openPrivateChat(sender);
  };
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function openPrivateChat(targetUser) {
  const message = prompt(`Send private message to ${targetUser}:`);
  if (message) {
    socket.emit('private message', {
      to: targetUser,
      from: currentUser,
      message
    });
  }
}

document.getElementById('send').onclick = () => {
  const input = document.getElementById('messageInput');
  if (input.value.trim()) {
    socket.emit('chat message', { message: input.value, username: currentUser });
    input.value = '';
  }
};

document.getElementById('uploadFile').onchange = function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    socket.emit('file upload', {
      file: e.target.result,
      name: file.name,
      type: file.type,
      username: currentUser
    });
  };
  reader.readAsDataURL(file);
};

socket.on('chat message', data => {
  appendMessage(data.message, data.username);
});

socket.on('file upload', data => {
  const div = document.createElement('div');
  div.textContent = `${data.username}: `;
  if (data.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = data.file;
    img.style.maxWidth = '200px';
    div.appendChild(img);
  } else if (data.type.startsWith('audio/')) {
    const audio = document.createElement('audio');
    audio.src = data.file;
    audio.controls = true;
    div.appendChild(audio);
  } else {
    const link = document.createElement('a');
    link.href = data.file;
    link.textContent = data.name;
    div.appendChild(link);
  }
  document.getElementById('messages').appendChild(div);
});

socket.on('private message', ({ from, message }) => {
  appendMessage(`(DM) ${message}`, from, true);
});

socket.on('announcement', ({ username, announcement }) => {
  const banner = document.createElement('div');
  banner.className = 'announcement-banner';
  banner.textContent = `📢 ${username}: ${announcement}`;
  document.body.prepend(banner);
  setTimeout(() => banner.remove(), 7000);
});

socket.on('kick', () => {
  alert('You have been kicked by an admin.');
  window.location.href = '/';
});

socket.on('jumpscare', () => {
  const img = document.createElement('img');
  img.src = 'https://preview.redd.it/jeff-the-killer-creepypasta-has-a-legitimately-creepy-v0-ybxlukb1ggsc1.png?width=640&format=png&auto=webp&s=fbc6fe52ac8e3b6ffdc42a8ff6dc9285de9a3c87';
  img.style.position = 'fixed';
  img.style.top = '0';
  img.style.left = '0';
  img.style.width = '100vw';
  img.style.height = '100vh';
  img.style.zIndex = '9999';
  document.body.appendChild(img);
  setTimeout(() => img.remove(), 2000);
});

function showAdminPanel() {
  const panel = document.getElementById('adminPanel');
  panel.style.display = 'block';

  document.getElementById('kickBtn').onclick = () => {
    const userToKick = prompt("Kick which user?");
    if (userToKick) socket.emit('kick user', { username: userToKick });
  };

  document.getElementById('announceBtn').onclick = () => {
    const msg = prompt("Announcement text:");
    if (msg) socket.emit('announcement', { username: currentUser, announcement: msg });
  };

  document.getElementById('redirectBtn').onclick = () => {
    const user = prompt("Username to redirect:");
    const url = prompt("URL to send them to:");
    if (user && url) socket.emit('redirect user', { username: user, url });
  };

  document.getElementById('flashBtn').onclick = () => {
    const user = prompt("Flash which user?");
    if (user) socket.emit('flash user', { username: user, duration: 2000 });
  };

  document.getElementById('jumpscareBtn').onclick = () => {
    if (isOwner) socket.emit('jumpscare everyone');
  };
}

socket.emit('check admin', { username: currentUser }, result => {
  isAdmin = result;
  isOwner = currentUser === 'X12';
  if (isAdmin) showAdminPanel();
});
