const socket = io();
const messageBox = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('message');
const profilePic = sessionStorage.getItem('profilePic');
const username = sessionStorage.getItem('username');
let cooldown = false;

// Scroll to bottom
function scrollToBottom() {
  messageBox.scrollTop = messageBox.scrollHeight;
}

// Append message
function appendMessage(data) {
  const item = document.createElement('div');
  item.className = 'message';
  item.innerHTML = `
    <img src="${data.profilePic}" class="pfp">
    <strong>${data.username}</strong>: ${data.text}
  `;
  messageBox.appendChild(item);
  scrollToBottom();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (cooldown || !input.value.trim()) return;

  socket.emit('chat message', {
    username,
    profilePic,
    text: input.value.trim()
  });

  input.value = '';
  cooldown = true;
  setTimeout(() => cooldown = false, 3000);
});

socket.on('chat message', appendMessage);

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = '/login';
});

// Admin Panel Features
if (username === 'X12') {
  document.getElementById('admin-panel').style.display = 'block';

  // Handle strobe
  document.getElementById('strobe-btn').onclick = () => {
    const duration = parseInt(document.getElementById('strobe-duration').value);
    socket.emit('admin action', { type: 'strobe', duration });
  };

  // Timeout
  document.getElementById('timeout-btn').onclick = () => {
    const user = document.getElementById('timeout-user').value;
    const duration = parseInt(document.getElementById('timeout-duration').value);
    socket.emit('admin action', { type: 'timeout', user, duration });
  };

  // Redirect
  document.getElementById('redirect-btn').onclick = () => {
    const user = document.getElementById('redirect-user').value;
    const url = document.getElementById('redirect-url').value;
    socket.emit('admin action', { type: 'redirect', user, url });
  };

  // Spam Tabs
  document.getElementById('spam-btn').onclick = () => {
    const user = document.getElementById('spam-user').value;
    const amount = parseInt(document.getElementById('spam-amount').value);
    socket.emit('admin action', { type: 'spam', user, amount });
  };

  // Clear Chat
  document.getElementById('clear-btn').onclick = () => {
    socket.emit('admin action', { type: 'clear' });
  };

  // Announcement
  document.getElementById('announce-btn').onclick = () => {
    const msg = document.getElementById('announcement').value;
    socket.emit('admin action', { type: 'announce', msg });
  };

  // Grant Admin
  document.getElementById('grant-admin-btn').onclick = () => {
    const user = document.getElementById('grant-user').value;
    const time = parseInt(document.getElementById('grant-duration').value);
    socket.emit('admin action', { type: 'grant', user, time });
  };

  // Jumpscare
  document.getElementById('jumpscare-btn').onclick = () => {
    const image = document.getElementById('jumpscare-img').value;
    const audio = document.getElementById('jumpscare-audio').value;
    socket.emit('admin action', { type: 'jumpscare', image, audio });
  };
}

// Admin events received
socket.on('admin action', (action) => {
  switch (action.type) {
    case 'strobe':
      const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
      let count = 0;
      const strobe = setInterval(() => {
        document.body.style.background = colors[count % colors.length];
        count++;
      }, 200);
      setTimeout(() => {
        clearInterval(strobe);
        document.body.style.background = '';
      }, action.duration * 1000);
      break;

    case 'timeout':
      if (username === action.user) {
        alert('You have been timed out.');
        document.body.innerHTML = '<h1>Timed Out</h1>';
      }
      break;

    case 'redirect':
      if (username === action.user) {
        window.location.href = action.url;
      }
      break;

    case 'spam':
      if (username === action.user) {
        for (let i = 0; i < action.amount; i++) {
          window.open(window.location.href, '_blank');
        }
      }
      break;

    case 'clear':
      messageBox.innerHTML = '';
      break;

    case 'announce':
      const banner = document.createElement('div');
      banner.className = 'announcement';
      banner.innerText = action.msg;
      document.body.prepend(banner);
      setTimeout(() => banner.remove(), 5000);
      break;

    case 'grant':
      if (username === action.user) {
        document.getElementById('admin-panel').style.display = 'block';
        setTimeout(() => {
          alert('Your temporary admin access has ended.');
          document.getElementById('admin-panel').style.display = 'none';
        }, action.time * 1000);
      }
      break;

    case 'jumpscare':
      const scare = document.createElement('div');
      scare.style.position = 'fixed';
      scare.style.top = 0;
      scare.style.left = 0;
      scare.style.width = '100vw';
      scare.style.height = '100vh';
      scare.style.background = `url(${action.image}) center center / cover no-repeat`;
      scare.style.zIndex = 9999;
      document.body.appendChild(scare);
      const audio = new Audio(action.audio);
      audio.play();
      setTimeout(() => {
        scare.remove();
      }, 3000);
      break;
  }
});
