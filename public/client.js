const socket = io();
let username = '';
let isAdmin = false;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('msg-input')) {
    document.getElementById('msg-input').addEventListener('keypress', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }
});

function register() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  const profilePic = document.getElementById('profile-pic').value;
  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass, profilePic })
  }).then(res => {
    if (res.ok) window.location.href = '/login.html';
    else alert('Username taken');
  });
}

function login() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      username = user;
      isAdmin = user === 'X12';
      localStorage.setItem('username', username);
      localStorage.setItem('isAdmin', isAdmin);
      window.location.href = '/chat.html';
    } else alert('Login failed');
  });
}

function initChat() {
  socket.emit('join', localStorage.getItem('username'));
  if (localStorage.getItem('isAdmin') === 'true') {
    document.getElementById('admin-panel').style.display = 'block';
  }
}

function sendMessage() {
  const text = document.getElementById('msg-input').value;
  const file = document.getElementById('img-upload').files[0];
  const reader = new FileReader();
  if (file) {
    reader.onload = e => {
      socket.emit('message', {
        username,
        text,
        image: e.target.result,
        profilePic: localStorage.getItem('profilePic') || ''
      });
      document.getElementById('msg-input').value = '';
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('message', {
      username,
      text,
      profilePic: localStorage.getItem('profilePic') || ''
    });
    document.getElementById('msg-input').value = '';
  }
}

function adminFlash() {
  const duration = parseInt(document.getElementById('flash-time').value);
  socket.emit('admin-flash', duration);
}

function adminTimeout() {
  const target = document.getElementById('timeout-user').value;
  const minutes = parseInt(document.getElementById('timeout-mins').value);
  socket.emit('admin-timeout', { target, minutes });
}

function adminRedirect() {
  const target = document.getElementById('redirect-user').value;
  const link = document.getElementById('redirect-link').value;
  socket.emit('admin-redirect', { target, link });
}

function adminPlayAudio() {
  const url = document.getElementById('youtube-url').value;
  socket.emit('admin-audio', url);
}

socket.on('message', msg => {
  const box = document.getElementById('chat-box');
  const el = document.createElement('div');
  el.innerHTML = `
    <img src="${msg.profilePic || 'default.png'}" class="pfp">
    <strong>${msg.username}:</strong> ${msg.text || ''}
  `;
  if (msg.image) el.innerHTML += `<br><img src="${msg.image}" class="chat-img"/>`;
  box.appendChild(el);
});

socket.on('flash', () => {
  const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = '';
  }, 3000);
});

socket.on('redirect', link => {
  window.location.href = link;
});

socket.on('audio', url => {
  const audio = new Audio(`https://www.youtube.com/watch?v=${url}`);
  audio.play();
});
