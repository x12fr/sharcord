const socket = io();

let username = sessionStorage.getItem('username');
if (!username) {
  window.location.href = '/login';
}

socket.emit('new-user', username);

const messages = document.getElementById('messages');
const form = document.getElementById('send-form');
const input = document.getElementById('send-input');
const adminPanel = document.getElementById('admin-panel');
const profileInput = document.getElementById('profile-input');
const profileButton = document.getElementById('set-pfp-btn');

let cooldown = false;
let adminVisible = true;

form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value.trim() === '' || cooldown) return;
  socket.emit('send-chat-message', input.value);
  input.value = '';
  cooldown = true;
  setTimeout(() => cooldown = false, 3000);
});

socket.on('chat-message', data => {
  const msg = document.createElement('div');
  msg.innerHTML = `<img src="${data.user.pfp}" class="pfp"> <b>${data.user.username}</b>: ${data.message}`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('chat-image', data => {
  const msg = document.createElement('div');
  msg.innerHTML = `<img src="${data.user.pfp}" class="pfp"> <b>${data.user.username}</b>: <br><img src="${data.url}" class="chat-image">`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('private-message', data => {
  alert(`Private message from ${data.from}: ${data.message}`);
});

socket.on('pfp-changed', data => {
  const all = document.querySelectorAll('.pfp');
  all.forEach(img => {
    if (img.alt === data.username) {
      img.src = data.url;
    }
  });
});

socket.on('redirect', url => {
  window.location.href = url;
});

socket.on('strobe', () => {
  let colors = ['red', 'blue', 'green', 'purple', 'yellow'];
  let i = 0;
  let interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = '';
  }, 3000);
});

socket.on('play-audio', url => {
  new Audio(url).play();
});

socket.on('jumpscare', ({ img, audio }) => {
  const scare = document.createElement('div');
  scare.id = 'scare';
  scare.style.position = 'fixed';
  scare.style.top = 0;
  scare.style.left = 0;
  scare.style.width = '100%';
  scare.style.height = '100%';
  scare.style.background = `url(${img}) center center / cover no-repeat`;
  scare.style.zIndex = 9999;
  document.body.appendChild(scare);
  new Audio(audio).play();
  setTimeout(() => {
    document.getElementById('scare')?.remove();
  }, 5000);
});

// ADMIN TOGGLES
document.addEventListener('keydown', e => {
  if (username === "X12" && e.key === "]") {
    adminPanel.style.display = adminVisible ? 'none' : 'block';
    adminVisible = !adminVisible;
  }
  if (username === "X12" && e.key.toLowerCase() === 'p') {
    togglePImage();
  }
});

let pActive = false;
function togglePImage() {
  if (pActive) {
    document.getElementById('p-img')?.remove();
    pActive = false;
  } else {
    const img = document.createElement('img');
    img.src = "https://files.catbox.moe/5pz8os.png";
    img.id = "p-img";
    img.style.position = 'fixed';
    img.style.top = 0;
    img.style.left = 0;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.zIndex = 9999;
    document.body.appendChild(img);
    pActive = true;
  }
}

// ADMIN BUTTON FUNCTIONS
function strobeAll() {
  socket.emit('strobe-all');
}

function playAudio() {
  const url = prompt('YouTube Audio URL:');
  socket.emit('play-audio', url);
}

function timeoutUser() {
  const user = prompt('Username to timeout:');
  socket.emit('timeout-user', user);
}

function redirectUser() {
  const user = prompt('Username to redirect:');
  const url = prompt('Redirect URL:');
  socket.emit('redirect-user', { username: user, url });
}

function changeUserPfp() {
  const user = prompt('Username to change PFP:');
  const url = prompt('New PFP URL:');
  socket.emit('force-change-pfp', { username: user, url });
}

function doJumpscare() {
  const img = prompt('Image URL for jumpscare:');
  const audio = prompt('Audio URL for jumpscare:');
  socket.emit('jumpscare', { img, audio });
}

profileButton.onclick = () => {
  const url = profileInput.value;
  if (url) {
    socket.emit('change-pfp', url);
    profileInput.value = '';
  }
};
