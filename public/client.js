let socket;
let currentUser = '';
let isAdmin = false;
const privateChats = {};

function register() {
  const username = prompt('Username:');
  const password = prompt('Password:');
  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(res => res.json()).then(data => {
    if (data.success) alert('Registered! Now log in.');
    else alert(data.message);
  });
}

function login() {
  const username = prompt('Username:');
  const password = prompt('Password:');
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      currentUser = data.username;
      isAdmin = data.isAdmin;
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('chat-section').style.display = 'block';
      if (isAdmin) {
        document.getElementById('admin-panel').style.display = 'block';
      }
      startSocket();
    } else alert(data.message);
  });
}

function startSocket() {
  socket = io();
  socket.emit('join', { username: currentUser });

  socket.on('chat history', history => {
    history.forEach(msg => appendMessage(msg.user, msg.text));
  });

  socket.on('chat message', msg => {
    appendMessage(msg.user, msg.text);
  });

  socket.on('private message', ({ fromUser, text }) => {
    if (!privateChats[fromUser]) privateChats[fromUser] = [];
    privateChats[fromUser].push(`${fromUser}: ${text}`);
    openPrivateChat(fromUser);
  });

  socket.on('admin announcement', msg => {
    const banner = document.getElementById('announcement');
    banner.innerText = msg;
    banner.style.display = 'block';
    setTimeout(() => banner.style.display = 'none', 5000);
  });

  socket.on('flash', () => {
    const body = document.body;
    const original = body.style.backgroundColor;
    const colors = ['red', 'blue', 'green', 'purple', 'yellow'];
    let i = 0;
    const interval = setInterval(() => {
      body.style.backgroundColor = colors[i % colors.length];
      i++;
    }, 200);
    setTimeout(() => {
      clearInterval(interval);
      body.style.backgroundColor = original;
    }, 2000);
  });
}

function sendMessage() {
  const input = document.getElementById('message');
  const text = input.value.trim();
  if (text) {
    socket.emit('chat message', { user: currentUser, text });
    input.value = '';
  }
}

function appendMessage(user, text) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.innerHTML = `<strong>${user}:</strong> ${text}`;
  div.onclick = () => openPrivateChat(user);
  chat.appendChild(div);
}

function openPrivateChat(user) {
  if (user === currentUser) return;

  const dmContainer = document.getElementById('dm-container');
  dmContainer.style.display = 'block';
  document.getElementById('dm-title').innerText = `Chat with ${user}`;
  document.getElementById('dm-messages').innerHTML = '';

  if (privateChats[user]) {
    privateChats[user].forEach(msg => {
      const dmDiv = document.createElement('div');
      dmDiv.textContent = msg;
      document.getElementById('dm-messages').appendChild(dmDiv);
    });
  }

  dmContainer.dataset.target = user;
}

function sendPrivateMessage() {
  const target = document.getElementById('dm-container').dataset.target;
  const input = document.getElementById('dm-input');
  const text = input.value.trim();
  if (text) {
    socket.emit('private message', { toUser: target, fromUser: currentUser, text });
    if (!privateChats[target]) privateChats[target] = [];
    privateChats[target].push(`You: ${text}`);
    openPrivateChat(target);
    input.value = '';
  }
}

// Admin tools
function flashUser() {
  const user = prompt('Username to flash:');
  if (user) socket.emit('admin:flash', user);
}

function announce() {
  const msg = prompt('Enter announcement:');
  if (msg) socket.emit('admin:announce', msg);
}
