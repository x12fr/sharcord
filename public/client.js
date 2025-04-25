const socket = io();
let username, profilePic;

function register() {
  username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  profilePic = document.getElementById('profile-pic').value;
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
  }).then(res => res.json()).then(data => {
    if (data.success) {
      profilePic = data.profilePic;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('chat-screen').style.display = 'block';
      if (username === 'X12') document.getElementById('admin-panel').style.display = 'block';
      socket.emit('join', username);
    } else {
      alert('Login failed');
    }
  });
}

function send() {
  const input = document.getElementById('msg-input');
  const file = document.getElementById('img-upload').files[0];
  const reader = new FileReader();
  if (file) {
    reader.onload = function (e) {
      socket.emit('message', { username, profilePic, text: input.value, image: e.target.result });
      input.value = '';
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('message', { username, profilePic, text: input.value });
    input.value = '';
  }
}

function flash() {
  const duration = parseInt(document.getElementById('strobe-time').value) * 1000;
  socket.emit('flash', duration);
}

function timeout() {
  const target = document.getElementById('timeout-user').value;
  const minutes = parseInt(document.getElementById('timeout-mins').value);
  socket.emit('timeout', { target, minutes });
}

function playAudio() {
  const url = document.getElementById('yt-url').value;
  socket.emit('playAudio', url);
}

socket.on('init', ({ messages, timeouts }) => {
  for (const msg of messages) render(msg);
  for (const user in timeouts) {
    showTimeout(user, timeouts[user]);
  }
});

socket.on('message', msg => render(msg));
socket.on('flash', duration => {
  const colors = ['red', 'blue', 'green', 'purple', 'yellow'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i++ % colors.length];
  }, 300);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = 'black';
  }, duration);
});
socket.on('timeout', ({ target, end }) => showTimeout(target, end));
socket.on('playAudio', url => {
  const audio = new Audio(`https://www.youtube.com/watch?v=${new URL(url).searchParams.get("v")}`);
  audio.play();
});

document.getElementById('msg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') send();
});

function render(msg) {
  const box = document.getElementById('chat-box');
  const el = document.createElement('div');
  el.innerHTML = `<img src="${msg.profilePic}" height="30" style="vertical-align: middle; border-radius: 50%;"> <strong>${msg.username}:</strong> ${msg.text || ''}`;
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
