const socket = io();
const username = localStorage.getItem('username');
const pfp = localStorage.getItem('pfp') || 'default.png';

// Send a message
function sendMessage() {
  const messageInput = document.getElementById('message');
  const message = messageInput.value;
  if (message.trim() !== '') {
    socket.emit('chat message', { username, message, pfp });
    messageInput.value = '';
  }
}

// Admin functions
function strobe() {
  socket.emit('admin action', { type: 'strobe' });
}

function timeoutUser() {
  const user = document.getElementById('targetUser').value;
  socket.emit('admin action', { type: 'timeout', user });
}

function kickUser() {
  const user = document.getElementById('targetUser').value;
  socket.emit('admin action', { type: 'kick', user });
}

function redirectUser() {
  const user = document.getElementById('targetUser').value;
  socket.emit('admin action', { type: 'redirect', user });
}

function spamTabs() {
  const user = document.getElementById('targetUser').value;
  socket.emit('admin action', { type: 'spamTabs', user });
}

function clearChat() {
  socket.emit('admin action', { type: 'clearChat' });
}

function sendAnnouncement() {
  const text = document.getElementById('announcementText').value;
  socket.emit('admin action', { type: 'announcement', text });
}

function secretRedirect() {
  const user = document.getElementById('secretUser').value;
  socket.emit('admin action', { type: 'secretRedirect', user });
}

function playJumpscare() {
  socket.emit('admin action', { type: 'jumpscare' });
}

// Receiving messages
socket.on('chat message', (data) => {
  const chatBox = document.getElementById('chat-box');
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<img src="${data.pfp}" width="30" height="30" style="border-radius:50%;"> <b>${data.username}</b>: ${data.message}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Admin actions
socket.on('admin action', (action) => {
  if (action.type === 'announcement') {
    const ann = document.getElementById('announcement');
    ann.textContent = action.text;
    ann.style.display = 'block';
    setTimeout(() => {
      ann.style.display = 'none';
    }, 10000);
  }

  if (action.type === 'secretRedirect' && action.user === username) {
    window.location.href = 'secret.html';
  }
});
