const socket = io();
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');
const imageInput = document.getElementById('imageInput');
const profilePicInput = document.getElementById('profilePicInput');
const bgInput = document.getElementById('bgInput');
const bgSubmit = document.getElementById('bgSubmit');
const adminPanel = document.getElementById('admin-panel');
const adminToggle = document.getElementById('admin-toggle');
const bgPanel = document.getElementById('bg-panel');
const bgButton = document.getElementById('set-bg-btn');
const soundboardPanel = document.getElementById('soundboard-panel');
const soundboardToggle = document.getElementById('soundboard-toggle');

let username = localStorage.getItem('username');
let isAdmin = localStorage.getItem('isAdmin') === 'true';
let profilePic = localStorage.getItem('profilePic') || '';

// Show admin tools if user is admin
if (isAdmin) {
  adminToggle.style.display = 'block';
}

adminToggle.addEventListener('click', () => {
  adminPanel.classList.toggle('open');
});

bgButton.addEventListener('click', () => {
  bgPanel.style.display = bgPanel.style.display === 'none' ? 'block' : 'none';
});

bgSubmit.addEventListener('click', () => {
  const url = bgInput.value.trim();
  if (url) {
    document.body.style.backgroundImage = `url(${url})`;
    socket.emit('adminSetBackground', url);
    bgPanel.style.display = 'none';
  }
});

soundboardToggle.addEventListener('click', () => {
  soundboardPanel.style.display = soundboardPanel.style.display === 'none' ? 'block' : 'none';
});

document.querySelectorAll('.sound-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const soundUrl = btn.dataset.url;
    socket.emit('adminPlaySound', soundUrl);
  });
});

socket.on('setBackground', url => {
  document.body.style.backgroundImage = `url(${url})`;
});

socket.on('playSound', url => {
  const audio = new Audio(url);
  audio.play();
});

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chatMessage', {
      username,
      message,
      isAdmin,
      profilePic
    });
    messageInput.value = '';
  }
});

socket.on('chatMessage', data => {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message';
  const nameColor = data.isAdmin ? 'red' : 'white';
  const staffTag = data.isAdmin ? '[staff] ' : '';
  msgDiv.innerHTML = `
    <img class="pfp" src="${data.profilePic || 'default.png'}">
    <span style="color: ${nameColor};">${staffTag}${data.username}</span>: <span style="color: white;">${data.message}</span>
  `;
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on('imageMessage', data => {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message';
  const staffTag = data.isAdmin ? '[staff] ' : '';
  msgDiv.innerHTML = `
    <img class="pfp" src="${data.profilePic || 'default.png'}">
    <span style="color: ${data.isAdmin ? 'red' : 'white'};">${staffTag}${data.username}</span>:<br>
    <img src="${data.url}" class="chat-image">
  `;
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('imageMessage', {
      username,
      url: reader.result,
      isAdmin,
      profilePic
    });
  };
  if (file) reader.readAsDataURL(file);
});

profilePicInput.addEventListener('change', () => {
  const file = profilePicInput.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    profilePic = reader.result;
    localStorage.setItem('profilePic', profilePic);
  };
  if (file) reader.readAsDataURL(file);
});
