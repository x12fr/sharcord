const socket = io();
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const imageInput = document.getElementById('imageInput');
const profilePicInput = document.getElementById('profilePicInput');
const updatePicBtn = document.getElementById('updatePicBtn');
const overlay = document.getElementById('overlay');
const overlayImage = document.getElementById('overlayImage');
const audioPlayer = document.getElementById('audioPlayer');
const logoutBtn = document.getElementById('logoutBtn');

let loggedInUser = localStorage.getItem('loggedInUser');

if (!loggedInUser) {
  window.location.href = 'login.html';
}

socket.emit('user-joined', loggedInUser);

sendBtn.addEventListener('click', () => {
  sendMessage();
});

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// P key fullscreen image
let pImageActive = false;
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p' && document.activeElement !== messageInput) {
    if (!pImageActive) {
      overlayImage.src = 'https://files.catbox.moe/5pz8os.png';
      overlay.style.display = 'flex';
      pImageActive = true;
    } else {
      overlay.style.display = 'none';
      pImageActive = false;
    }
  }
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (text !== '') {
    if (text.startsWith('/dm')) {
      const parts = text.split(' ');
      const to = parts[1];
      const dmMessage = parts.slice(2).join(' ');
      socket.emit('private-message', { to, from: loggedInUser, message: dmMessage });
    } else {
      socket.emit('chat-message', { user: loggedInUser, text });
    }
    messageInput.value = '';
  }
}

uploadImageBtn.addEventListener('click', () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      socket.emit('chat-image', { user: loggedInUser, imageUrl: e.target.result });
    };
    reader.readAsDataURL(file);
  }
});

updatePicBtn.addEventListener('click', () => {
  const picUrl = profilePicInput.value.trim();
  if (picUrl !== '') {
    socket.emit('update-profile-pic', { user: loggedInUser, profilePic: picUrl });
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
});

socket.on('chat-message', (data) => {
  addMessage(data.user, data.text, data.profilePic);
});

socket.on('chat-image', (data) => {
  addImage(data.user, data.imageUrl, data.profilePic);
});

socket.on('private-message', (data) => {
  alert(`DM from ${data.from}: ${data.message}`);
});

socket.on('kicked', () => {
  alert('You were kicked by an admin.');
  window.location.href = 'login.html';
});

socket.on('jumpscare', (data) => {
  overlayImage.src = data.image;
  overlay.style.display = 'flex';
  audioPlayer.src = data.audio;
  audioPlayer.style.display = 'block';
  audioPlayer.play();
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 5000);
});

socket.on('strobe', (duration) => {
  let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'white'];
  let index = 0;
  const strobeInterval = setInterval(() => {
    document.body.style.backgroundColor = colors[index++ % colors.length];
  }, 100);
  setTimeout(() => {
    clearInterval(strobeInterval);
    document.body.style.background = 'linear-gradient(to right, #000000, #4b0000)';
  }, duration);
});

socket.on('redirect', (url) => {
  window.location.href = url;
});

function addMessage(user, text, profilePic) {
  const message = document.createElement('div');
  message.innerHTML = `<img src="${profilePic}" style="width:30px; height:30px; border-radius:50%; margin-right:5px;"> <strong>${user}:</strong> ${text}`;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

function addImage(user, imageUrl, profilePic) {
  const message = document.createElement('div');
  message.innerHTML = `<img src="${profilePic}" style="width:30px; height:30px; border-radius:50%; margin-right:5px;"> <strong>${user}:</strong> <br><img src="${imageUrl}" style="max-width:300px;">`;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}
