const socket = io();
const messages = document.getElementById('messages');
const input = document.getElementById('messageInput');
let lastSent = 0;

document.getElementById('toggle-admin').onclick = () => {
  const panel = document.getElementById('admin-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const now = Date.now();
  if (now - lastSent < 3000) return alert('Wait 3 seconds!');
  if (input.value.trim() !== '') {
    socket.emit('message', input.value);
    input.value = '';
    lastSent = now;
  }
}

socket.on('message', data => {
  const div = document.createElement('div');
  div.textContent = `${data.user}: ${data.text}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('jumpscare', ({ image, audio }) => {
  const img = new Image();
  img.src = image;
  img.style.position = 'fixed';
  img.style.top = 0;
  img.style.left = 0;
  img.style.width = '100vw';
  img.style.height = '100vh';
  img.style.zIndex = 9999;
  document.body.appendChild(img);
  const snd = new Audio(audio);
  snd.play();
  setTimeout(() => document.body.removeChild(img), 3000);
});

socket.on('strobe', duration => {
  let colors = ['red', 'blue', 'green', 'yellow'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.background = colors[i++ % colors.length];
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.background = '';
  }, duration * 1000);
});

socket.on('kick', () => {
  alert('You have been kicked.');
  location.href = '/';
});

socket.on('redirect', url => {
  window.location.href = url;
});

socket.on('clear', () => {
  messages.innerHTML = '';
});

// ADMIN FUNCTIONS
function triggerJumpscare() {
  const img = document.getElementById('jumpscareImage').files[0];
  const aud = document.getElementById('jumpscareAudio').files[0];
  if (!img || !aud) return alert("Choose both files.");

  const readerImg = new FileReader();
  const readerAud = new FileReader();

  readerImg.onload = () => {
    readerAud.onload = () => {
      socket.emit('jumpscare', { image: readerImg.result, audio: readerAud.result });
    };
    readerAud.readAsDataURL(aud);
  };
  readerImg.readAsDataURL(img);
}

function startStrobe() {
  const seconds = parseInt(document.getElementById('strobeDuration').value);
  socket.emit('strobe', seconds);
}

function timeoutUser() {
  const user = document.getElementById('timeoutUser').value;
  socket.emit('timeout', user);
}

function kickUser() {
  const user = document.getElementById('kickUser').value;
  socket.emit('kick', user);
}

function redirectUser() {
  const user = document.getElementById('redirectUser').value;
  const link = document.getElementById('redirectLink').value;
  socket.emit('redirect', { user, link });
}

function clearChat() {
  socket.emit('clear');
}
