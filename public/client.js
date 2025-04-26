const socket = io();

const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  if (messageInput.value.trim() !== '') {
    socket.emit('chat message', messageInput.value.trim());
    messageInput.value = '';
  }
}

socket.on('chat message', data => {
  const msg = document.createElement('div');
  msg.className = 'message';
  msg.innerHTML = `<img src="${data.profilePic}" class="pfp"> <b>${data.username}:</b> ${data.text}`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('admin-panel', () => {
  document.getElementById('admin-panel').style.display = 'block';
});

function startStrobe() {
  const duration = parseInt(document.getElementById('strobeDuration').value) || 3;
  socket.emit('admin-strobe', duration);
}

function timeoutUser() {
  const user = document.getElementById('timeoutUser').value;
  const seconds = parseInt(document.getElementById('timeoutDuration').value) || 5;
  socket.emit('admin-timeout', { user, seconds });
}

function redirectUser() {
  const user = document.getElementById('redirectUser').value;
  socket.emit('admin-redirect', { user });
}

function sendAnnouncement() {
  const text = document.getElementById('announcementText').value;
  socket.emit('admin-announcement', text);
}

function triggerJumpscare() {
  const img = document.getElementById('jumpscareImage').value;
  const audio = document.getElementById('jumpscareAudio').value;
  socket.emit('admin-jumpscare', { img, audio });
}

function changeProfilePicture() {
  const newPic = document.getElementById('profilePicUrl').value;
  socket.emit('change-profile-pic', newPic);
}
