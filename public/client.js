const socket = io();
let username;

function register() {
  username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const profilePic = document.getElementById('profile-pic').value;
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
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('chat-screen').style.display = 'block';
      if (username === 'X12') document.getElementById('admin-panel').style.display = 'block';
      socket.emit('join', username);
    } else alert('Login failed');
  });
}

function send() {
  const input = document.getElementById('msg-input');
  const file = document.getElementById('img-upload').files[0];
  const reader = new FileReader();
  if (file) {
    reader.onload = function (e) {
      socket.emit('message', { username, text: input.value, image: e.target.result });
      input.value = '';
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('message', { username, text: input.value });
    input.value = '';
  }
}

function flash() {
  socket.emit('flash');
}

function timeout() {
  const target = document.getElementById('timeout-user').value;
  const minutes = parseInt(document.getElementById('timeout-mins').value);
  socket.emit('timeout', { target, minutes });
}

socket.on('init', ({ messages, timeouts }) => {
  for (const msg of messages) render(msg);
  for (const user in timeouts) {
    showTimeout(user, timeouts[user]);
  }
});

socket.on('message', msg => render(msg));
socket.on('flash', () => {
  document.body.style.backgroundColor = 'red';
  setTimeout(() => document.body.style.backgroundColor = '', 3000);
});
socket.on('timeout', ({ target, end }) => showTimeout(target, end));

function render(msg) {
  const box = document.getElementById('chat-box');
  const el = document.createElement('div');
  el.innerHTML = `<strong>${msg.username}:</strong> ${msg.text || ''}`;
  if (msg.image) el.innerHTML += `<br><img src="${msg.image}" height="100" />`;
  box.appendChild(el);
}

function showTimeout(user, end) {
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((end - now) / 60000));
  const el = document.getElementById('users');
  const div = document.createElement('div');
  div.innerText = `${user} is timed out for ${remaining} min(s)`;
  el.appendChild(div);
}
