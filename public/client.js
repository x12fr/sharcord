const socket = io();

const chatInput = document.getElementById('chat-input');
const dmUser = document.getElementById('dm-user');
const messagesDiv = document.getElementById('messages');
const fileInput = document.getElementById('file-input');
const sendFileBtn = document.getElementById('send-file-btn');
const pfpUpload = document.getElementById('pfp-upload');
const uploadPfpBtn = document.getElementById('upload-pfp-btn');
const fullscreenImg = document.getElementById('fullscreen-img');
const fullscreenImgContent = document.getElementById('fullscreen-img-content');
const audioPlayer = document.getElementById('audio-player');

// Admin panel toggling
const collapseBtn = document.getElementById('collapse-btn');
const adminControls = document.getElementById('admin-controls');
collapseBtn.onclick = () => {
  adminControls.classList.toggle('hidden');
};

// Cooldown
let canSend = true;

// Message sending
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && canSend) {
    sendMessage();
    canSend = false;
    setTimeout(() => { canSend = true; }, 3000);
  }
});

// File sending
sendFileBtn.onclick = () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      socket.emit('image', evt.target.result);
    };
    reader.readAsDataURL(file);
  }
};

// Profile picture changing
uploadPfpBtn.onclick = () => {
  const file = pfpUpload.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      socket.emit('changePFP', evt.target.result);
    };
    reader.readAsDataURL(file);
  }
};

// Send message
function sendMessage() {
  const text = chatInput.value;
  const dm = dmUser.value;
  if (text.trim() !== '') {
    socket.emit('chatMessage', { text, to: dm });
    chatInput.value = '';
  }
}

// Listen for new messages
socket.on('chatMessage', (data) => {
  const div = document.createElement('div');
  div.innerHTML = `<strong>${data.username}</strong> ${data.tags || ''}: ${data.message}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Listen for images
socket.on('image', (data) => {
  const div = document.createElement('div');
  div.innerHTML = `<strong>${data.username}</strong> <img src="${data.img}" style="max-width: 200px;">`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Jumpscare
socket.on('jumpscare', (data) => {
  fullscreenImgContent.src = data.img;
  fullscreenImg.classList.remove('hidden');
  audioPlayer.src = data.audio;
  audioPlayer.play();
  setTimeout(() => {
    fullscreenImg.classList.add('hidden');
  }, 5000);
});

// P toggle
let pActive = false;
document.addEventListener('keydown', (e) => {
  if (e.key === 'p' && document.activeElement !== chatInput && document.activeElement !== dmUser) {
    if (pActive) {
      fullscreenImg.classList.add('hidden');
      pActive = false;
    } else {
      fullscreenImgContent.src = 'https://files.catbox.moe/5pz8os.png';
      fullscreenImg.classList.remove('hidden');
      pActive = true;
    }
  }
});

// Admin controls
document.getElementById('redirect-btn').onclick = () => {
  socket.emit('adminRedirect', {
    user: document.getElementById('redirect-username').value,
    url: document.getElementById('redirect-url').value
  });
};

document.getElementById('kick-btn').onclick = () => {
  socket.emit('adminKick', document.getElementById('kick-username').value);
};

document.getElementById('timeout-btn').onclick = () => {
  socket.emit('adminTimeout', {
    user: document.getElementById('timeout-username').value,
    time: document.getElementById('timeout-time').value
  });
};

document.getElementById('play-audio-btn').onclick = () => {
  socket.emit('adminPlayAudio', document.getElementById('yt-url').value);
};

document.getElementById('strobe-btn').onclick = () => {
  socket.emit('adminStrobe', {
    duration: document.getElementById('strobe-duration').value
  });
};

document.getElementById('strobe-all-btn').onclick = () => {
  socket.emit('adminStrobeAll', {});
};

document.getElementById('change-pfp-btn').onclick = () => {
  socket.emit('adminChangePFP', {
    user: document.getElementById('pfp-target').value,
    pfp: document.getElementById('pfp-url').value
  });
};

document.getElementById('jumpscare-btn').onclick = () => {
  socket.emit('adminJumpscare', {
    img: document.getElementById('jumpscare-img').value,
    audio: document.getElementById('jumpscare-audio').value
  });
};

