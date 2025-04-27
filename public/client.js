const socket = io();
let myUsername = localStorage.getItem('username') || '';
let myProfilePic = localStorage.getItem('profilePic') || '';
let isAdmin = myUsername === 'X12';
let canSend = true;

// Update PFP
document.getElementById('set-pfp-btn')?.addEventListener('click', () => {
  const newPic = document.getElementById('profile-input').value;
  if (newPic) {
    myProfilePic = newPic;
    localStorage.setItem('profilePic', myProfilePic);
    alert('Profile picture updated!');
  }
});

// Admin panel toggle with "]"
document.addEventListener('keydown', (e) => {
  if (e.key === ']' && isAdmin) {
    const panel = document.getElementById('admin-panel');
    if (panel.style.display === 'none') panel.style.display = 'block';
    else panel.style.display = 'none';
  }
});

// "P" image toggle (admin only)
let pImageVisible = false;
document.addEventListener('keydown', (e) => {
  if (e.key === 'p' && isAdmin && !document.activeElement.matches('input')) {
    pImageVisible = !pImageVisible;
    if (pImageVisible) {
      const img = document.createElement('img');
      img.src = 'https://files.catbox.moe/5pz8os.png';
      img.style.position = 'fixed';
      img.style.top = 0;
      img.style.left = 0;
      img.style.width = '100vw';
      img.style.height = '100vh';
      img.style.zIndex = 9999;
      img.id = 'pImage';
      document.body.appendChild(img);
    } else {
      document.getElementById('pImage')?.remove();
    }
  }
});

// Sending messages
document.getElementById('send-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('send-input');
  if (input.value.trim() && canSend) {
    socket.emit('chatMessage', {
      username: myUsername,
      text: input.value.trim(),
      pfp: myProfilePic
    });
    input.value = '';
    canSend = false;
    setTimeout(() => canSend = true, 3000); // 3 second cooldown
  }
});

// Receiving messages
socket.on('chatMessage', (data) => {
  const msgBox = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.innerHTML = `<img class="pfp" src="${data.pfp || 'https://via.placeholder.com/32'}"> <strong>${data.username}:</strong> ${linkify(data.text)}`;
  msgBox.appendChild(msg);
  msgBox.scrollTop = msgBox.scrollHeight;
});

// Receiving images
socket.on('imageMessage', (data) => {
  const msgBox = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.innerHTML = `<img class="pfp" src="${data.pfp || 'https://via.placeholder.com/32'}"> <strong>${data.username}:</strong><br><img class="chat-image" src="${data.imageUrl}">`;
  msgBox.appendChild(msg);
  msgBox.scrollTop = msgBox.scrollHeight;
});

// Jumpscare
socket.on('jumpscare', (data) => {
  const img = document.createElement('img');
  img.src = data.imageUrl;
  img.style.position = 'fixed';
  img.style.top = 0;
  img.style.left = 0;
  img.style.width = '100vw';
  img.style.height = '100vh';
  img.style.zIndex = 9999;
  img.id = 'jumpImage';
  document.body.appendChild(img);

  const audio = new Audio(data.audioUrl);
  audio.play();

  setTimeout(() => {
    document.getElementById('jumpImage')?.remove();
  }, 5000);
});

// Helper: Make links clickable
function linkify(text) {
  return text.replace(/(https?:\/\/[^\s]+)/g, `<a href="$1" target="_blank" style="color: red;">$1</a>`);
}

// ADMIN COMMANDS:

function strobeAll() {
  socket.emit('strobeAll');
}

function playAudio() {
  const url = prompt('YouTube Audio URL?');
  if (url) socket.emit('playAudio', url);
}

function timeoutUser() {
  const user = prompt('Username to timeout?');
  const secs = prompt('How many seconds?');
  if (user && secs) socket.emit('timeoutUser', { user, seconds: parseInt(secs) });
}

function redirectUser() {
  const user = prompt('Username to redirect?');
  const url = prompt('URL to redirect to?');
  if (user && url) socket.emit('redirectUser', { user, url });
}

function changeUserPfp() {
  const user = prompt('Username to change PFP?');
  const newPfp = prompt('New PFP URL?');
  if (user && newPfp) socket.emit('changeUserPfp', { user, newPfp });
}

function doJumpscare() {
  const imageUrl = prompt('Image URL for jumpscare?');
  const audioUrl = prompt('Audio URL for jumpscare?');
  if (imageUrl && audioUrl) {
    socket.emit('jumpscare', { imageUrl, audioUrl });
  }
}
