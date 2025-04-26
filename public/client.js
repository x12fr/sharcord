const socket = io();
let username = new URLSearchParams(window.location.search).get('username');
let lastMessageTime = 0;
let pImageVisible = false;

document.getElementById('welcome-user').innerText = `Welcome, ${username}!`;

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
document.getElementById('file-button').addEventListener('click', () => {
  document.getElementById('file-input').click();
});
document.getElementById('file-input').addEventListener('change', sendImage);
document.getElementById('logout-button').addEventListener('click', () => {
  window.location.href = '/logout';
});

document.getElementById('send-dm-button').addEventListener('click', () => {
  const target = document.getElementById('dm-username').value.trim();
  const message = document.getElementById('dm-message').value.trim();
  if (target && message) {
    socket.emit('private_message', { target, message, from: username });
    document.getElementById('dm-message').value = '';
  }
});

document.getElementById('change-pfp-button').addEventListener('click', () => {
  const file = document.getElementById('pfp-input').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('change_pfp', { username, pfp: reader.result });
    };
    reader.readAsDataURL(file);
  }
});

// ADMIN ONLY BUTTONS
if (username === 'X12') {
  document.getElementById('admin-panel').style.display = 'block';

  document.getElementById('kick-button').addEventListener('click', () => {
    const target = document.getElementById('kick-username').value.trim();
    if (target) socket.emit('kick_user', target);
  });

  document.getElementById('jumpscare-button').addEventListener('click', () => {
    const imageUrl = document.getElementById('jumpscare-image').value.trim();
    const audioUrl = document.getElementById('jumpscare-audio').value.trim();
    socket.emit('jumpscare', { imageUrl, audioUrl });
  });

  document.getElementById('prank-pfp-button').addEventListener('click', () => {
    const target = document.getElementById('change-pfp-username').value.trim();
    const newPfp = document.getElementById('new-pfp-url').value.trim();
    if (target && newPfp) {
      socket.emit('prank_pfp', { target, newPfp });
    }
  });

  document.getElementById('collapse-admin').addEventListener('click', () => {
    const panel = document.getElementById('admin-controls');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
}

// Send a normal chat message
function sendMessage() {
  const now = Date.now();
  if (now - lastMessageTime < 3000) {
    alert('Wait 3 seconds between messages.');
    return;
  }

  const input = document.getElementById('message-input');
  const message = input.value.trim();
  if (message) {
    socket.emit('chat_message', { username, message });
    input.value = '';
    lastMessageTime = now;
  }
}

// Send an uploaded image
function sendImage() {
  const file = document.getElementById('file-input').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('image_message', { username, image: reader.result });
    };
    reader.readAsDataURL(file);
  }
}

// Show incoming messages
socket.on('chat_message', ({ username, message, pfp }) => {
  addMessage(username, message, pfp);
});

// Show incoming image
socket.on('image_message', ({ username, image, pfp }) => {
  addImage(username, image, pfp);
});

// Receive private message
socket.on('private_message', ({ from, message }) => {
  alert(`DM from ${from}: ${message}`);
});

// Update someone's profile picture
socket.on('update_pfp', ({ username, pfp }) => {
  document.querySelectorAll(`.pfp-${username}`).forEach(img => {
    img.src = pfp;
  });
});

// Handle jumpscare
socket.on('jumpscare', ({ imageUrl, audioUrl }) => {
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.position = 'fixed';
  img.style.top = '0';
  img.style.left = '0';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.zIndex = '9999';
  img.style.objectFit = 'cover';
  document.body.appendChild(img);

  const audio = new Audio(audioUrl);
  audio.play();

  setTimeout(() => {
    img.remove();
  }, 5000);
});

// Handle being kicked
socket.on('kicked', () => {
  alert('You were kicked.');
  window.location.href = '/logout';
});

// Press P to toggle full screen image
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p' && document.activeElement.id !== 'message-input') {
    if (!pImageVisible) {
      const img = document.createElement('img');
      img.id = 'pImage';
      img.src = 'https://files.catbox.moe/5pz8os.png';
      img.style.position = 'fixed';
      img.style.top = '0';
      img.style.left = '0';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.zIndex = '9999';
      img.style.objectFit = 'cover';
      document.body.appendChild(img);
      pImageVisible = true;
    } else {
      document.getElementById('pImage')?.remove();
      pImageVisible = false;
    }
  }
});

// Add chat message
function addMessage(username, message, pfp) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<img src="${pfp || '/default-pfp.png'}" class="pfp-${username}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;margin-right:5px;">
    <strong>${username}</strong>: ${linkify(message)}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Add image message
function addImage(username, image, pfp) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<img src="${pfp || '/default-pfp.png'}" class="pfp-${username}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;margin-right:5px;">
    <strong>${username}</strong>: <br><img src="${image}" style="max-width:200px;max-height:200px;border-radius:8px;">`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Convert links inside messages
function linkify(text) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}
