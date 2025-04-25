const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
socket.emit('login', username);

// DOM
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const profilePicInput = document.getElementById('profile-pic');
const imageUpload = document.getElementById('image-upload');

// Admin elements
const isAdmin = username === 'X12';
const strobeBtn = document.getElementById('strobe-btn');
const kickBtn = document.getElementById('kick-btn');
const timeoutBtn = document.getElementById('timeout-btn');
const redirectBtn = document.getElementById('redirect-btn');
const jumpscareImage = document.getElementById('jumpscare-image');
const jumpscareAudio = document.getElementById('jumpscare-audio');
const jumpscareBtn = document.getElementById('jumpscare-btn');

// Send message
sendBtn.addEventListener('click', () => {
  const text = messageInput.value.trim();
  if (!text && !imageUpload.files[0]) return;

  const reader = new FileReader();
  if (imageUpload.files[0]) {
    reader.onload = () => {
      socket.emit('message', { text, image: reader.result });
    };
    reader.readAsDataURL(imageUpload.files[0]);
  } else {
    socket.emit('message', { text });
  }

  messageInput.value = '';
  imageUpload.value = '';
});

socket.on('message', msg => {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message';

  if (msg.profilePic) {
    const img = document.createElement('img');
    img.src = msg.profilePic;
    img.className = 'pfp';
    msgDiv.appendChild(img);
  }

  msgDiv.innerHTML += `<strong>${msg.username}:</strong> ${msg.text || ''}`;
  if (msg.image) {
    const img = document.createElement('img');
    img.src = msg.image;
    img.className = 'chat-image';
    msgDiv.appendChild(img);
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Profile pic
profilePicInput.addEventListener('change', () => {
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('setProfilePic', reader.result);
  };
  reader.readAsDataURL(profilePicInput.files[0]);
});

// Admin: strobe
if (isAdmin) {
  strobeBtn.onclick = () => {
    const duration = prompt("Enter strobe duration in seconds:");
    socket.emit('admin-command', { type: 'strobe', duration: parseInt(duration) });
  };

  kickBtn.onclick = () => {
    const target = prompt("Enter username to kick:");
    socket.emit('admin-command', { type: 'kick', target });
  };

  timeoutBtn.onclick = () => {
    const target = prompt("Enter username to timeout:");
    const duration = prompt("Enter duration in seconds:");
    socket.emit('admin-command', { type: 'timeout', target, duration: parseInt(duration) });
  };

  redirectBtn.onclick = () => {
    const target = prompt("Enter username to redirect:");
    const url = prompt("Enter URL to redirect them to:");
    socket.emit('admin-command', { type: 'redirect', target, url });
  };

  jumpscareBtn.onclick = () => {
    const imageFile = document.getElementById('jumpscare-img-upload').files[0];
    const audioFile = document.getElementById('jumpscare-audio-upload').files[0];
    if (!imageFile || !audioFile) return;

    const readerImg = new FileReader();
    const readerAud = new FileReader();

    readerImg.onload = () => {
      const imgData = readerImg.result;
      readerAud.onload = () => {
        const audioData = readerAud.result;
        socket.emit('admin-command', { type: 'jumpscare', image: imgData, audio: audioData });
      };
      readerAud.readAsDataURL(audioFile);
    };
    readerImg.readAsDataURL(imageFile);
  };
}

// Effects
socket.on('strobe', data => {
  const interval = setInterval(() => {
    document.body.style.backgroundColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  }, 100);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = '';
  }, data.duration * 1000);
});

socket.on('redirect', url => {
  window.location.href = url;
});

socket.on('jumpscare', data => {
  const jumpscare = document.createElement('div');
  jumpscare.style.position = 'fixed';
  jumpscare.style.top = 0;
  jumpscare.style.left = 0;
  jumpscare.style.width = '100vw';
  jumpscare.style.height = '100vh';
  jumpscare.style.zIndex = 9999;
  jumpscare.style.background = `url(${data.image}) no-repeat center center / cover`;
  document.body.appendChild(jumpscare);

  const audio = new Audio(data.audio);
  audio.play();

  setTimeout(() => {
    jumpscare.remove();
  }, 3000);
});
