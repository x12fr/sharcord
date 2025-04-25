const socket = io();
const username = sessionStorage.getItem('username');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');

if (username === 'X12') {
  document.getElementById('admin-panel').style.display = 'block';
}

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value;
  if (message.trim() !== '') {
    socket.emit('chat message', { user: username, text: message });
    messageInput.value = '';
  }
});

socket.on('chat message', (msgData) => {
  const msg = document.createElement('div');
  msg.textContent = `${msgData.user}: ${msgData.text}`;
  messagesDiv.appendChild(msg);
});

// ADMIN COMMANDS FROM SERVER
socket.on('admin action', (action) => {
  if (action.type === 'strobe') {
    const colors = ['red', 'blue', 'green', 'purple', 'orange'];
    let i = 0;
    const interval = setInterval(() => {
      document.body.style.backgroundColor = colors[i % colors.length];
      i++;
      if (i > 20) {
        clearInterval(interval);
        document.body.style.backgroundColor = '';
      }
    }, 100);
  }

  if (action.type === 'timeout' && action.target === username) {
    document.body.innerHTML = '<h1>You have been timed out.</h1>';
  }

  if (action.type === 'kick' && action.target === username) {
    window.close();
  }

  if (action.type === 'redirect' && action.target === username) {
    window.location.href = action.url;
  }

  if (action.type === 'announcement') {
    alert(`📢 ADMIN ANNOUNCEMENT: ${action.text}`);
  }

  if (action.type === 'jumpscare') {
    document.body.innerHTML = `<img src="${action.image}" style="width:100vw;height:100vh;object-fit:cover;position:fixed;top:0;left:0;z-index:9999;">`;
    const audio = new Audio(action.audio);
    audio.play();
  }
});

// Admin functions
function sendStrobe() {
  socket.emit('admin action', { type: 'strobe' });
}

function timeoutUser() {
  const user = document.getElementById('timeout-user').value;
  socket.emit('admin action', { type: 'timeout', target: user });
}

function kickUser() {
  const user = document.getElementById('kick-user').value;
  socket.emit('admin action', { type: 'kick', target: user });
}

function redirectUser() {
  const user = document.getElementById('redirect-user').value;
  const url = document.getElementById('redirect-url').value;
  socket.emit('admin action', { type: 'redirect', target: user, url });
}

function sendAnnouncement() {
  const text = document.getElementById('announcement').value;
  socket.emit('admin action', { type: 'announcement', text });
}

function sendJumpscare() {
  const img = document.getElementById('jumpscare-img').value;
  const audio = document.getElementById('jumpscare-audio').value;
  socket.emit('admin action', { type: 'jumpscare', image: img, audio });
}
