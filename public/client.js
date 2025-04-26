const socket = io();

const messages = document.getElementById('messages');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (text !== '') {
    socket.emit('chat message', text);
    input.value = '';
  }
}

socket.on('chat message', (data) => {
  const item = document.createElement('div');
  item.textContent = `${data.username}: ${data.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

/// ADMIN STUFF
socket.on('announcement', (text) => {
  const announce = document.createElement('div');
  announce.className = 'announcement';
  announce.innerText = text;
  document.body.appendChild(announce);

  setTimeout(() => {
    announce.remove();
  }, 10000); // 10 seconds
});

socket.on('strobe', (duration) => {
  let colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
  let index = 0;
  const original = document.body.style.backgroundColor;

  const strobeInterval = setInterval(() => {
    document.body.style.backgroundColor = colors[index];
    index = (index + 1) % colors.length;
  }, 100);

  setTimeout(() => {
    clearInterval(strobeInterval);
    document.body.style.backgroundColor = original;
  }, duration);
});

socket.on('timeout', (time) => {
  alert(`You are timed out for ${time} seconds`);
});

socket.on('redirect', (link) => {
  window.location.href = link;
});

socket.on('jumpscare', (data) => {
  const img = document.createElement('img');
  img.src = data.img;
  img.style.position = 'fixed';
  img.style.top = 0;
  img.style.left = 0;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.zIndex = 1000;
  img.style.objectFit = 'cover';
  document.body.appendChild(img);

  const audio = new Audio(data.audio);
  audio.play();

  setTimeout(() => {
    img.remove();
  }, 5000); // Remove image after 5 seconds
});

// Admin buttons
if (document.getElementById('admin-panel')) {
  document.getElementById('announce-btn').onclick = () => {
    const text = document.getElementById('announce-text').value;
    socket.emit('announce', text);
  };

  document.getElementById('strobe-btn').onclick = () => {
    const duration = parseInt(document.getElementById('strobe-duration').value) || 3000;
    socket.emit('strobe', duration);
  };

  document.getElementById('timeout-btn').onclick = () => {
    const user = document.getElementById('timeout-user').value;
    const duration = parseInt(document.getElementById('timeout-duration').value) || 5;
    socket.emit('timeout', { user, duration });
  };

  document.getElementById('redirect-btn').onclick = () => {
    const user = document.getElementById('redirect-user').value;
    const link = document.getElementById('redirect-link').value;
    socket.emit('redirect', { user, link });
  };

  document.getElementById('jumpscare-btn').onclick = () => {
    const img = document.getElementById('jumpscare-img').value;
    const audio = document.getElementById('jumpscare-audio').value;
    socket.emit('jumpscare', { img, audio });
  };
}

// "P" Key Image Pop
let pToggled = false;
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p') {
    if (!pToggled) {
      const overlay = document.createElement('img');
      overlay.src = 'YOUR_IMAGE_LINK_HERE'; // <-- replace with your image
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '1000';
      overlay.id = 'p-overlay';
      overlay.style.objectFit = 'cover';
      document.body.appendChild(overlay);
      pToggled = true;
    } else {
      const overlay = document.getElementById('p-overlay');
      if (overlay) overlay.remove();
      pToggled = false;
    }
  }
});
