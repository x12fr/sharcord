const socket = io();

// Get HTML elements
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');
const adminPanel = document.getElementById('admin-panel');

// Example username setup (replace with your real login system)
const username = localStorage.getItem('username') || prompt('Enter your username:');
localStorage.setItem('username', username);

// Show admin panel if user is admin
if (username === "X12") {
  adminPanel.style.display = 'block';
}

// Send message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (messageInput.value.trim() !== '') {
    const messageData = {
      username: username,
      text: messageInput.value.trim()
    };
    socket.emit('chat message', messageData);
    messageInput.value = '';
  }
});

// Listen for incoming messages
socket.on('chat message', (data) => {
  const msgElement = document.createElement('div');
  msgElement.classList.add('message');
  msgElement.innerHTML = `<strong>${data.username}:</strong> ${data.text}`;
  messagesContainer.appendChild(msgElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto scroll down
});
