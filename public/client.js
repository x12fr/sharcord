const socket = io();
let username;

function register() {
  username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const profilePic = document.getElementById('profile-pic').value || '';
  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, profilePic })
  }).then(res => res.ok ? login() : alert('Username taken'));
}

function login() {
  username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(res => {
    if (res.ok) {
      location.href = 'chat.html?username=' + encodeURIComponent(username);
    } else alert('Login failed');
  });
}

function initChat() {
  const urlParams = new URLSearchParams(window.location.search);
  username = urlParams.get('username');
  socket.emit('join', username);
  if (username === 'X12') {
    document.getElementById('admin-panel').style.display = 'block';
  }
}

function send() {
  const input = document.getElementById('msg-input');
  const text = input.value;
  const file = document.getElementById('img-upload').files[0];
  const reader = new FileReader();
  if (file) {
    reader.onload = function (e) {
      socket.emit('message', { username, text, image: e.target.result });
      input.value = '';
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('message', { username, text });
    input.value = '';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('msg-input')) {
    send();
  }
});

function flash() {
  const duration = parseInt(document.getElementById('strobe-time').value) || 3;
  socket.emit('flash', { duration });
}

function timeout() {
  const target = document.getElementById('timeout-user').value;
  const minutes = parseInt(document.getElementById('timeout-mins').value);
  socket.emit('timeout', { target, minutes });
}

function redirect() {
  const user = document.getElementById('redirect-user').value;
  const url = document.getElementById('redirect-url').value;
  socket.emit('redirect', { user, url });
}

function playYouTube() {
  const url = document.getElementById('youtube-url').value;
  socket.emit('youtube', { url });
}

socket.on('init', ({ messages, timeouts }) => {
  for (const msg of messages) render(msg);
  for (const user in timeouts) {
    showTimeout(user, timeouts[user]);
  }
});

socket.on('message', msg => render(msg));
socket.on('flash', duration => {
  const colors = ['red', 'blue', 'green', 'purple', 'yellow', 'cyan', 'orange'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = '';
  }, duration * 1000);
});

socket.on('timeout', ({ target, end }) => showTimeout(target, end));

socket.on('redirect', ({ user, url }) => {
  if (user === username) {
    window.location.href = url;
  }
});

socket.on('youtube', url => {
  const audio = new Audio(`https://www.youtube.com/watch_popup?v=${url.split('v=')[1]}`);
  audio.play();
});

function render(msg) {
  const box = document.getElementById('chat-box');
  const el = document.createElement('div');
  el.innerHTML = `<img src="${msg.profilePic || ''}" width="20" /> <strong>${msg.username}:</strong> ${msg.text || ''}`;
  if (msg.image) el.innerHTML += `<br><img src="${msg.image}" height="100" />`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function showTimeout(user, end) {
  const el = document.getElementById('users');
  const div = document.createElement('div');
  const remaining = Math.floor((end - Date.now()) / 60000);
  div.innerText = `${user} is timed out for ${remaining} min(s)`;
  el.appendChild(div);
}
