const socket = io();

const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesDiv = document.getElementById('messages');
const usernameInput = document.getElementById('usernameInput');
const claimBtn = document.getElementById('claimBtn');
const imageURLInput = document.getElementById('imageURL');
const imageSendBtn = document.getElementById('imageSendBtn');
const profilePicInput = document.getElementById('profilePicInput');
const setPicBtn = document.getElementById('setPicBtn');
const chatSection = document.getElementById('chatSection');
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');

// Admin controls
const strobeBtn = document.getElementById('strobeBtn');
const strobeDuration = document.getElementById('strobeDuration');
const audioURLInput = document.getElementById('audioURL');
const playAudioBtn = document.getElementById('playAudioBtn');
const timeoutUsername = document.getElementById('timeoutUsername');
const timeoutDuration = document.getElementById('timeoutDuration');
const timeoutBtn = document.getElementById('timeoutBtn');
const redirectUsername = document.getElementById('redirectUsername');
const redirectURL = document.getElementById('redirectURL');
const redirectBtn = document.getElementById('redirectBtn');

let profilePicture = '';
let username = '';
let isAdmin = false;

// Save session
if (localStorage.getItem('username')) {
  username = localStorage.getItem('username');
  profilePicture = localStorage.getItem('profilePicture') || '';
  const adminKey = localStorage.getItem('adminKey') || '';
  joinChat(username, adminKey, profilePicture);
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';
}

// Claim username
claimBtn.onclick = () => {
  const user = usernameInput.value.trim();
  const key = document.getElementById('adminKeyInput').value.trim();

  if (!user) return alert("Enter a username!");

  username = user;
  localStorage.setItem('username', username);
  localStorage.setItem('adminKey', key);
  profilePicture = '';

  joinChat(username, key, profilePicture);
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';
};

// Send message
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

sendBtn.onclick = sendMessage;

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;
  socket.emit('message', msg);
  messageInput.value = '';
}

// Send image
imageSendBtn.onclick = () => {
  const imgURL = imageURLInput.value.trim();
  if (!imgURL) return;
  socket.emit('image', imgURL);
  imageURLInput.value = '';
};

// Set profile picture
setPicBtn.onclick = () => {
  const newPic = profilePicInput.value.trim();
  if (!newPic) return;
  profilePicture = newPic;
  localStorage.setItem('profilePicture', newPic);
  socket.emit('updateProfilePicture', newPic);
};

// Join chat with data
function joinChat(user, key, pic) {
  socket.emit('join', {
    username: user,
    adminKey: key,
    profilePicture: pic
  });
}

// Receive chat history
socket.on('chatHistory', (history) => {
  messagesDiv.innerHTML = '';
  history.forEach((msg) => {
    if (msg.message) showMessage(msg);
    else if (msg.imageURL) showImage(msg);
  });
});

// Show new chat messages
socket.on('chatMessage', showMessage);
function showMessage(data) {
  const div = document.createElement('div');
  div.innerHTML = `
    <img src="${data.profilePicture}" class="chat-pfp">
    <strong style="color: ${data.isAdmin ? 'red' : 'white'}">
      ${data.username} ${data.isAdmin ? '[administrator]' : ''}:
    </strong> ${data.message}
  `;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Show new images
socket.on('chatImage', (data) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <img src="${data.profilePicture}" class="chat-pfp">
    <strong style="color: ${data.isAdmin ? 'red' : 'white'}">
      ${data.username} ${data.isAdmin ? '[administrator]' : ''}:
    </strong><br>
    <img src="${data.imageURL}" class="chat-img">
  `;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Admin unlock
socket.on('adminStatus', () => {
  isAdmin = true;
  adminPanel.style.display = 'block';
});

// Admin features
playAudioBtn.onclick = () => {
  const url = audioURLInput.value.trim();
  if (url) socket.emit('playAudio', url);
};

strobeBtn.onclick = () => {
  const duration = parseInt(strobeDuration.value);
  if (!isNaN(duration)) socket.emit('strobe', duration);
};

timeoutBtn.onclick = () => {
  const user = timeoutUsername.value.trim();
  const dur = parseInt(timeoutDuration.value);
  if (user && !isNaN(dur)) {
    socket.emit('timeoutUser', { user, duration: dur });
  }
};

redirectBtn.onclick = () => {
  const user = redirectUsername.value.trim();
  const url = redirectURL.value.trim();
  if (user && url) {
    socket.emit('redirectUser', { user, url });
  }
};

// Admin effects
socket.on('strobe', (duration) => {
  let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];
  let i = 0;
  const original = document.body.style.backgroundColor;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 200);

  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = original;
  }, duration * 1000);
});

socket.on('playAudio', (url) => {
  const audio = new Audio(url);
  audio.play();
});

socket.on('timeout', (duration) => {
  alert(`You are timed out for ${duration} seconds.`);
  messageInput.disabled = true;
  setTimeout(() => {
    messageInput.disabled = false;
  }, duration * 1000);
});

socket.on('redirect', (url) => {
  window.location.href = url;
});

socket.on('announcement', (msg) => {
  const div = document.createElement('div');
  div.innerHTML = `<em style="color: orange;">${msg}</em>`;
  messagesDiv.appendChild(div);
});
