const socket = io();
const username = new URLSearchParams(window.location.search).get('username');

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value;
  if (message.trim() !== '') {
    socket.emit('chat message', { username, message });
    input.value = '';
  }
}

socket.on('chat message', ({ username, message }) => {
  const messagesDiv = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.textContent = `${username}: ${message}`;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
