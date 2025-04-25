const socket = io();
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const adminPanel = document.getElementById('adminPanel');

socket.on('connect', () => {
  socket.emit('join', { username: localStorage.getItem('username'), isAdmin: localStorage.getItem('isAdmin') === 'true' });
});

socket.on('message', (data) => {
  const item = document.createElement('div');
  item.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('clearChat', () => {
  messages.innerHTML = '';
});

socket.on('announcement', (msg) => {
  alert(`[Announcement] ${msg}`);
});

socket.on('timeout', (seconds) => {
  alert(`You are timed out for ${seconds} seconds.`);
  messageInput.disabled = true;
  setTimeout(() => {
    messageInput.disabled = false;
  }, seconds * 1000);
});

socket.on('kick', () => {
  alert('You have been kicked!');
  window.location.href = "https://google.com";
});

socket.on('redirect', (url) => {
  window.location.href = url;
});

socket.on('spamTabs', (url) => {
  for (let i = 0; i < 10; i++) {
    window.open(url, '_blank');
  }
});

socket.on('grantTempAdmin', (duration) => {
  alert(`You are an admin for ${duration} seconds!`);
  adminPanel.style.display = 'block';
  setTimeout(() => {
    adminPanel.style.display = 'none';
  }, duration * 1000);
});

socket.on('jumpscare', (data) => {
  const img = document.createElement('img');
  img.src = data.imageUrl;
  img.style.position = 'fixed';
  img.style.top = 0;
  img.style.left = 0;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.zIndex = 9999;
  document.body.appendChild(img);

  const audio = new Audio(data.audioUrl);
  audio.play();

  setTimeout(() => {
    img.remove();
  }, 5000); // 5 seconds
});

socket.on('strobe', () => {
  let colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
    if (i > 20) { // 20 color changes
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    }
  }, 100);
});

// Send message
function sendMessage() {
  if (messageInput.value.trim() !== '') {
    socket.emit('chatMessage', messageInput.value);
    messageInput.value = '';
  }
}

// Admin Actions
function strobeAll() {
  socket.emit('adminAction', { type: 'strobe' });
}

function clearChat() {
  socket.emit('adminAction', { type: 'clearChat' });
}

function sendAnnouncement() {
  const message = prompt('Enter announcement message:');
  if (message) {
    socket.emit('adminAction', { type: 'announcement', message });
  }
}

function timeoutUser() {
  const username = prompt('Username to timeout:');
  const seconds = prompt('Timeout duration in seconds:');
  if (username && seconds) {
    socket.emit('adminAction', { type: 'timeout', username, seconds });
  }
}

function kickUser() {
  const username = prompt('Username to kick:');
  if (username) {
    socket.emit('adminAction', { type: 'kick', username });
  }
}

function redirectUser() {
  const username = prompt('Username to redirect:');
  const url = prompt('URL to redirect to:');
  if (username && url) {
    socket.emit('adminAction', { type: 'redirect', username, url });
  }
}

function spamTabs() {
  const username = prompt('Username to spam tabs on:');
  const url = prompt('URL to open:');
  if (username && url) {
    socket.emit('adminAction', { type: 'spamTabs', username, url });
  }
}

function grantTemporaryAdmin() {
  const username = prompt('Username to grant admin to:');
  const seconds = prompt('How long (seconds):');
  if (username && seconds) {
    socket.emit('adminAction', { type: 'grantTempAdmin', username, seconds });
  }
}

function sendJumpscare() {
  const imageUrl = prompt('URL of jumpscare image:');
  const audioUrl = prompt('URL of jumpscare audio:');
  if (imageUrl && audioUrl) {
    socket.emit('adminAction', { type: 'jumpscare', imageUrl, audioUrl });
  }
}

// Press Enter to send
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
