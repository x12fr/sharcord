const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const password = urlParams.get('password');

let selectedUser = null;

document.getElementById('message-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  if (!message) return;

  if (selectedUser && selectedUser !== 'global') {
    socket.emit('private message', { to: selectedUser, from: username, message });
  } else {
    socket.emit('chat message', { user: username, message });
  }

  input.value = '';
});

socket.on('chat message', ({ user, message }) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${user}:</strong> ${message}`;
  msg.addEventListener('click', () => {
    if (user !== username) {
      selectedUser = user;
      alert(`Now chatting privately with ${user}`);
    }
  });
  document.getElementById('messages').appendChild(msg);
});

socket.on('private message', ({ from, message }) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>[DM] ${from}:</strong> ${message}`;
  document.getElementById('messages').appendChild(msg);
});

socket.on('announcement', msg => {
  const ann = document.createElement('div');
  ann.innerHTML = `<div class="announcement">${msg}</div>`;
  document.body.prepend(ann);
});

socket.on('flash', () => {
  const original = document.body.style.backgroundColor;
  let i = 0;
  const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
  const flashInterval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
    if (i >= 10) {
      clearInterval(flashInterval);
      document.body.style.backgroundColor = original;
    }
  }, 200);
});

socket.on('redirect', url => {
  window.location.href = url;
});

socket.on('timeout', seconds => {
  alert(`You have been timed out for ${seconds} seconds`);
  document.getElementById('message-input').disabled = true;
  setTimeout(() => {
    document.getElementById('message-input').disabled = false;
  }, seconds * 1000);
});

socket.on('jumpscare', () => {
  const img = document.createElement('img');
  img.src = "https://preview.redd.it/jeff-the-killer-creepypasta-has-a-legitimately-creepy-v0-ybxlukb1ggsc1.png?width=640&format=png&auto=webp&s=fbc6fe52ac8e3b6ffdc42a8ff6dc9285de9a3c87";
  img.style.position = 'fixed';
  img.style.top = '0';
  img.style.left = '0';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.zIndex = '9999';
  document.body.appendChild(img);
  setTimeout(() => img.remove(), 3000);
});

socket.on('kick', () => {
  alert('You have been kicked.');
  window.location.href = '/';
});

// Enable admin panel
const isOwner = username === "X12" && password === "331256444";
let isAdmin = false;

socket.emit('check admin', { username }, (res) => {
  isAdmin = res.isAdmin;
  if (isAdmin || isOwner) {
    document.getElementById('admin-panel').style.display = 'block';
  }
});

function sendAnnouncement() {
  const msg = prompt('Announcement message:');
  if (msg) socket.emit('announcement', msg);
}

function triggerFlash() {
  const target = prompt('Username to flash:');
  if (target) socket.emit('flash', target);
}

function triggerJumpscare() {
  if (isOwner) {
    socket.emit('jumpscare');
  } else {
    alert('Only owner can do this');
  }
}

function sendRedirect() {
  const user = prompt('Username to redirect:');
  const url = prompt('URL to redirect them to:');
  if (user && url) socket.emit('redirect', { user, url });
}

function timeoutUser() {
  const user = prompt('Username to timeout:');
  const seconds = prompt('For how many seconds?');
  if (user && seconds) socket.emit('timeout', { user, seconds });
}

function kickUser() {
  const user = prompt('Username to kick:');
  if (user) socket.emit('kick', user);
}
