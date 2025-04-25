const socket = io();
const username = localStorage.getItem('username');
let profilePic = '';

if (!username) window.location.href = '/login.html';

document.getElementById('message-input').focus();

function handleEnter(e) {
  if (e.key === 'Enter') sendMessage();
}

function sendMessage() {
  const input = document.getElementById('message-input');
  if (!input.value.trim()) return;
  socket.emit('message', { username, text: input.value, profilePic });
  input.value = '';
}

socket.on('message', data => {
  const chatBox = document.getElementById('chat-box');
  const msg = document.createElement('div');
  msg.className = 'message';
  msg.innerHTML = `
    <img src="${data.profilePic}" class="avatar">
    <strong>${data.username}</strong>: ${data.text}
  `;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

function toggleSettings() {
  const settings = document.getElementById('settings');
  settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
}

function updateProfilePic() {
  const file = document.getElementById('profilePic').files[0];
  const reader = new FileReader();
  reader.onload = e => {
    profilePic = e.target.result;
    alert("Profile picture updated.");
  };
  if (file) reader.readAsDataURL(file);
}

function toggleAdminPanel() {
  const panel = document.getElementById('admin-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'a') toggleAdminPanel();
});

function sendJumpscare() {
  const img = document.getElementById('jumpscare-image').files[0];
  const audio = document.getElementById('jumpscare-audio').files[0];

  const readerImg = new FileReader();
  const readerAudio = new FileReader();

  readerImg.onload = e1 => {
    readerAudio.onload = e2 => {
      socket.emit('admin-jumpscare', {
        image: e1.target.result,
        audio: e2.target.result
      });
    };
    if (audio) readerAudio.readAsDataURL(audio);
  };

  if (img) readerImg.readAsDataURL(img);
}

socket.on('admin-jumpscare', data => {
  const img = document.createElement('img');
  img.src = data.image;
  img.style.position = 'fixed';
  img.style.top = 0;
  img.style.left = 0;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.zIndex = 9999;
  img.style.objectFit = 'cover';

  document.body.appendChild(img);

  const audio = new Audio(data.audio);
  audio.play();

  setTimeout(() => {
    document.body.removeChild(img);
  }, 5000);
});

function redirectUser() {
  socket.emit('admin-redirect', {
    user: document.getElementById('redirect-user').value,
    link: document.getElementById('redirect-link').value
  });
}

function timeoutUser() {
  socket.emit('admin-timeout', {
    user: document.getElementById('timeout-user').value,
    seconds: parseInt(document.getElementById('timeout-duration').value)
  });
}

function startStrobe() {
  const duration = parseInt(document.getElementById('strobe-duration').value);
  socket.emit('admin-strobe', duration);
}

function clearChat() {
  socket.emit('admin-clear');
}

socket.on('admin-redirect', url => window.location.href = url);
socket.on('admin-timeout', seconds => {
  const input = document.getElementById('message-input');
  input.disabled = true;
  setTimeout(() => input.disabled = false, seconds * 1000);
});
socket.on('admin-strobe', duration => {
  let interval = setInterval(() => {
    document.body.style.backgroundColor = getRandomColor();
  }, 100);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = '';
  }, duration * 1000);
});
socket.on('admin-clear', () => {
  document.getElementById('chat-box').innerHTML = '';
});

function getRandomColor() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  return colors[Math.floor(Math.random() * colors.length)];
}
