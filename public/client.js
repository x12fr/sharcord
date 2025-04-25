const socket = io();
let canSend = true;

// Handle sending messages
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chat = document.getElementById('chat');
const toggleAdminBtn = document.getElementById('toggleAdminBtn');
const adminPanel = document.getElementById('adminPanel');
const strobeBtn = document.getElementById('strobeBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const playAudioBtn = document.getElementById('playAudioBtn');
const audioUrlInput = document.getElementById('audioUrlInput');

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

toggleAdminBtn.addEventListener('click', () => {
  adminPanel.classList.toggle('hidden');
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message && canSend) {
    socket.emit('chatMessage', { message });
    messageInput.value = '';
    canSend = false;
    setTimeout(() => { canSend = true; }, 3000); // 3 sec cooldown
  }
}

socket.on('chatMessage', (data) => {
  const msgDiv = document.createElement('div');
  msgDiv.innerHTML = `<strong>${data.username}</strong>: ${data.message}`;
  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
});

// Admin strobe button
strobeBtn.addEventListener('click', () => {
  socket.emit('adminStrobe', { duration: 5 });
});

// Admin clear chat button
clearChatBtn.addEventListener('click', () => {
  socket.emit('adminClearChat');
});

// Admin play audio
playAudioBtn.addEventListener('click', () => {
  const url = audioUrlInput.value;
  if (url) {
    socket.emit('adminPlayAudio', { url });
  }
});

// Listen for clear chat from server
socket.on('clearChat', () => {
  chat.innerHTML = '';
});
