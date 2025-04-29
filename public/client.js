const socket = io();

const username = localStorage.getItem('username');
const adminKey = localStorage.getItem('adminKey');

// Profile Picture
let profilePicture = localStorage.getItem('profilePicture') || '';

// Join chat
if (!username) {
  window.location.href = '/';
} else {
  socket.emit('join', { username, adminKey, profilePicture });
}

// Admin panel: show if adminKey is correct
socket.on('adminStatus', (isAdmin) => {
  if (isAdmin) {
    document.getElementById('admin-panel').style.display = 'block';
  }
});

// Message sending
const messageInput = document.getElementById('messageInput');
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('message', message);
    messageInput.value = '';
  }
}

// Sending Image
const sendImageBtn = document.getElementById('sendImageBtn');
sendImageBtn.addEventListener('click', () => {
  const imageURL = document.getElementById('imageURLInput').value.trim();
  if (imageURL) {
    socket.emit('image', imageURL);
    document.getElementById('imageURLInput').value = '';
  }
});

// Set Profile Picture
document.getElementById('setProfilePictureBtn').addEventListener('click', () => {
  const newPic = document.getElementById('profilePictureUrl').value.trim();
  if (newPic) {
    profilePicture = newPic;
    localStorage.setItem('profilePicture', profilePicture);
    socket.emit('updateProfilePicture', profilePicture);
  }
});

// Display messages
socket.on('chatMessage', (data) => {
  addMessage(data);
});

// Display images
socket.on('chatImage', (data) => {
  addImage(data);
});

// Announcement (for redirect, timeout, audio)
socket.on('announcement', (text) => {
  const announcement = document.getElementById('announcement');
  announcement.innerText = text;
  announcement.style.display = 'block';
  setTimeout(() => {
    announcement.style.display = 'none';
  }, 3000);
});

// Play audio
socket.on('playAudio', (url) => {
  const audio = document.getElementById('globalAudio');
  audio.src = url;
});

// Strobe screen
socket.on('strobe', (duration) => {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'white'];
  let count = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[count % colors.length];
    count++;
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = '';
  }, duration * 1000);
});

// Redirect user
socket.on('redirect', (url) => {
  window.location.href = url;
});

// Timeout user
socket.on('timeout', (seconds) => {
  messageInput.disabled = true;
  setTimeout(() => {
    messageInput.disabled = false;
  }, seconds * 1000);
});

// Admin controls
document.getElementById('playAudioBtn').addEventListener('click', () => {
  const url = document.getElementById('youtubeUrl').value.trim();
  if (url) {
    socket.emit('playAudio', url);
  }
});

document.getElementById('strobeBtn').addEventListener('click', () => {
  const duration = parseInt(document.getElementById('strobeDuration').value);
  if (duration) {
    socket.emit('strobe', duration);
  }
});

document.getElementById('redirectBtn').addEventListener('click', () => {
  const user = document.getElementById('targetUser').value.trim();
  const url = document.getElementById('redirectUrl').value.trim();
  if (user && url) {
    socket.emit('redirectUser', { user, url });
  }
});

document.getElementById('timeoutBtn').addEventListener('click', () => {
  const user = document.getElementById('timeoutUser').value.trim();
  const duration = parseInt(document.getElementById('timeoutDuration').value);
  if (user && duration) {
    socket.emit('timeoutUser', { user, duration });
  }
});

// Render message
function addMessage(data) {
  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  const profilePic = document.createElement('img');
  profilePic.src = data.profilePicture || '';
  profilePic.style.width = '40px';
  profilePic.style.height = '40px';
  profilePic.style.border = '2px solid red';
  profilePic.style.borderRadius = '5px';
  profilePic.style.marginRight = '10px';

  const nameSpan = document.createElement('span');
  nameSpan.textContent = data.username;
  nameSpan.style.color = data.isAdmin ? 'red' : 'white';
  if (data.isAdmin) {
    nameSpan.innerHTML += ' <strong>[administrator]</strong>';
  }

  const textSpan = document.createElement('span');
  textSpan.textContent = `: ${data.message}`;
  textSpan.style.color = 'white';

  messageElement.appendChild(profilePic);
  messageElement.appendChild(nameSpan);
  messageElement.appendChild(textSpan);

  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Render image
function addImage(data) {
  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  const profilePic = document.createElement('img');
  profilePic.src = data.profilePicture || '';
  profilePic.style.width = '40px';
  profilePic.style.height = '40px';
  profilePic.style.border = '2px solid red';
  profilePic.style.borderRadius = '5px';
  profilePic.style.marginRight = '10px';

  const nameSpan = document.createElement('span');
  nameSpan.textContent = data.username;
  nameSpan.style.color = data.isAdmin ? 'red' : 'white';
  if (data.isAdmin) {
    nameSpan.innerHTML += ' <strong>[administrator]</strong>';
  }

  const img = document.createElement('img');
  img.src = data.imageURL;
  img.style.maxWidth = '200px';
  img.style.marginLeft = '10px';

  messageElement.appendChild(profilePic);
  messageElement.appendChild(nameSpan);
  messageElement.appendChild(img);

  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
