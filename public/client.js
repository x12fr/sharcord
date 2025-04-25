const socket = io();
let username;

function register() {
  username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const profilePic = document.getElementById('reg-profile-pic').value;
  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, profilePic })
  }).then(res => {
    if (res.ok) login(username, password);
    else alert('Username taken');
  });
}

function login(user = null, pass = null) {
  username = user || document.getElementById('log-username').value;
  const password = pass || document.getElementById('log-password').value;
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(res => {
    if (res.ok) {
      document.getElementById('home').style.display = 'none';
      document.getElementById('chat-screen').style.display = 'block';
      if (username === 'X12') document.getElementById('admin-panel').style.display = 'block';
      socket.emit('join', username);
    } else alert('Login failed');
  });
}

function send() {
  const input = document.getElementById('msg-input');
  socket.emit('message', { username, text: input.value });
  input.value = '';
}

function sendImage() {
  const file = document.getElementById('img-upload').files[0];
  const reader = new FileReader();
  reader.onload = e => {
    socket.emit('message', { username, image: e.target.result });
  };
  reader.readAsDataURL(file);
}

function flash() {
  const time = parseInt(document.getElementById('flash-time').value);
  socket.emit('flash', { duration: time });
}

function timeout() {
  const target = document.getElementById('timeout-user').value;
  const minutes = parseInt(document.getElementById('timeout-mins').value);
  socket.emit('timeout', { target, minutes });
}

function playAudio() {
  const url = document.getElementById('audio-url').value;
  socket.emit('play-audio', url);
  const audio = new Audio(url);
  audio.play();
}

function redirectUser() {
  const target = document.getElementById('redirect-user').value;
  const link = document.getElementById('redirect-link').value;
  socket.emit('redirect', { target, link });
}

socket.on('init', ({ messages, timeouts }) => {
  for (const msg of messages) render(msg);
  for (const user in timeouts) showTimeout(user, timeouts[user]);
});

socket.on('message', msg => render(msg));
socket.on('flash', () => {
  let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i++ % colors.length];
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = '';
  }, 3000);
});
socket.on('timeout', ({ target, end }) => showTimeout(target, end));
socket.on('redirect', link => window.location.href = link);

function render(msg) {
  const box = document.getElementById('chat-box');
  const el = document.createElement('div');
  el.innerHTML = `<img src="${msg.profilePic}" height="20" style="border-radius:50%"/> <strong>${msg.username}:</strong> ${msg.text || ''}`;
  if (msg.image) el.innerHTML += `<br><img src="${msg.image}" height="100" />`;
  box.appendChild(el);
}

function showTimeout(user, end) {
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((end - now) / 60000));
  const el = document.getElementById('timeouts');
  const div = document.createElement('div');
  div.innerText = `${user} is timed out for ${remaining} min(s)`;
  el.appendChild(div);
}

document.getElementById('msg-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') send();
});
