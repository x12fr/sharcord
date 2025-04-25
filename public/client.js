let socket;
let currentUser = '';
let isAdmin = false;

function login(username, password) {
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      currentUser = data.username;
      isAdmin = data.isAdmin;
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('chat-section').style.display = 'block';
      if (isAdmin) {
        document.getElementById('admin-panel').style.display = 'block';
      }
      startSocket();
    } else {
      alert(data.message);
    }
  });
}

function startSocket() {
  socket = io();

  socket.emit('join', { username: currentUser });

  socket.on('chat history', history => {
    const chat = document.getElementById('chat');
    chat.innerHTML = '';
    history.forEach(msg => appendMessage(msg.user, msg.text));
  });

  socket.on('chat message', msg => {
    appendMessage(msg.user, msg.text);
  });

  socket.on('private message', ({ fromUser, text }) => {
    alert(`Private from ${fromUser}: ${text}`);
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
    body.style.backgroundColor = 'lime';
    setTimeout(() => body.style.backgroundColor = original, 2000);
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

function flashUser() {
  const target = prompt('Username to flash:');
  if (target) {
    socket.emit('admin:flash', target);
  }
}

function announce() {
  const msg = prompt('Enter announcement:');
  if (msg) {
    socket.emit('admin:announce', msg);
  }
}

function appendMessage(user, text) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.innerHTML = `<strong>${user}:</strong> ${text}`;
  div.onclick = () => {
    const dm = prompt(`Send private message to ${user}:`);
    if (dm) socket.emit('private message', { toUser: user, fromUser: currentUser, text: dm });
  };
  chat.appendChild(div);
}
