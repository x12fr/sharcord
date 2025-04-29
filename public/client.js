const socket = io();
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');

const username = localStorage.getItem('username') || 'Guest';
const isAdmin = localStorage.getItem('isAdmin') === 'true';

function appendMessage(msg) {
  const msgEl = document.createElement('div');
  msgEl.classList.add('message');
  if (msg.isAdmin) msgEl.classList.add('admin');
  msgEl.textContent = `${msg.isAdmin ? '[staff] ' : ''}${msg.user}: ${msg.text}`;
  chatBox.appendChild(msgEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}

socket.on('init', history => {
  chatBox.innerHTML = '';
  history.forEach(msg => appendMessage(msg));
});

socket.on('chat message', msg => {
  appendMessage(msg);
});

messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && messageInput.value.trim()) {
    socket.emit('chat message', {
      user: username,
      text: messageInput.value.trim(),
      isAdmin: isAdmin
    });
    messageInput.value = '';
  }
});
