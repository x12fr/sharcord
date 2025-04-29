const socket = io();

let myUsername = '';
let myProfilePic = '';

document.getElementById('registerBtn').onclick = () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const profilePic = document.getElementById('profilePic').value;
  socket.emit('register', { username, password, profilePic });
};

document.getElementById('loginBtn').onclick = () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  socket.emit('login', { username, password });
};

socket.on('registerSuccess', ({ username, profilePic }) => {
  myUsername = username;
  myProfilePic = profilePic;
  enterChat();
});

socket.on('registerFail', (msg) => alert(msg));

socket.on('loginSuccess', ({ username, profilePic }) => {
  myUsername = username;
  myProfilePic = profilePic;
  enterChat();
});

socket.on('loginFail', (msg) => alert(msg));

function enterChat() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('chat').style.display = 'block';

  if (myUsername === 'X12') {
    document.getElementById('adminPanel').style.display = 'block';
  }
}

document.getElementById('sendBtn').onclick = () => {
  sendMessage();
};

document.getElementById('message').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const msg = document.getElementById('message').value.trim();
  if (!msg) return;
  socket.emit('chatMessage', { type: 'text', message: msg });
  document.getElementById('message').value = '';
}

document.getElementById('sendImageBtn').onclick = () => {
  const url = document.getElementById('imageUrl').value.trim();
  if (url) {
    socket.emit('chatMessage', { type: 'image', imageUrl: url });
    document.getElementById('imageUrl').value = '';
  }
};

socket.on('chatMessage', (data) => {
  const chat = document.getElementById('messages');
  const div = document.createElement('div');

  const timeoutNotice = data.timeout ? ` (timed out)` : '';
  const nameLine = `<strong><img src="${data.profilePic}" class="pfp">${data.username}</strong>${timeoutNotice}:`;

  if (data.type === 'text') {
    div.innerHTML = `${nameLine} ${data.message}`;
  } else if (data.type === 'image') {
    div.innerHTML = `${nameLine}<br><img src="${data.imageUrl}" class="chat-image">`;
  }

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on('timeoutApplied', ({ target, duration }) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<em>${target} has been timed out for ${duration}s</em>`;
  document.getElementById('messages').appendChild(msg);
});

socket.on('timeoutLifted', ({ target }) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<em>${target}'s timeout is over</em>`;
  document.getElementById('messages').appendChild(msg);
});

socket.on('userJoined', ({ username, profilePic }) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<em>${username} joined</em>`;
  document.getElementById('messages').appendChild(msg);
});

socket.on('userLeft', (username) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<em>${username} left</em>`;
  document.getElementById('messages').appendChild(msg);
});

// Admin commands
document.getElementById('strobeBtn').onclick = () => {
  const duration = parseInt(prompt('Strobe duration (seconds):'), 10);
  if (!isNaN(duration)) {
    socket.emit('adminCommand', { action: 'strobe', duration });
  }
};

document.getElementById('audioBtn').onclick = () => {
  const url = prompt('YouTube audio URL:');
  if (url) socket.emit('adminCommand', { action: 'playAudio', url });
};

document.getElementById('timeoutBtn').onclick = () => {
  const target = prompt('Username to timeout:');
  const duration = parseInt(prompt('Timeout duration in seconds:'), 10);
  if (target && !isNaN(duration)) {
    socket.emit('adminCommand', { action: 'timeout', target, duration });
  }
};

document.getElementById('redirectBtn').onclick = () => {
  const targetSocketId = prompt('Target socket ID:');
  const url = prompt('Redirect URL:');
  if (targetSocketId && url) {
    socket.emit('adminCommand', { action: 'redirect', targetSocketId, url });
  }
};

// Client reactions
socket.on('strobeScreen', ({ duration }) => {
  let count = 0;
  const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[count % colors.length];
    count++;
    if (count > duration * 10) {
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    }
  }, 100);
});

socket.on('playAudio', ({ url }) => {
  const audio = new Audio(url);
  audio.play();
});

socket.on('redirect', (url) => {
  window.location.href = url;
});
