const socket = io();

// === HANDLE LOGIN ===
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-button');
  const registerBtn = document.getElementById('register-button');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('username', username);
          window.location.href = '/chat.html';
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // === HANDLE REGISTER ===
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
          alert('Registration successful! Please log in.');
          window.location.href = '/login.html';
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

// === CHAT PAGE FUNCTIONALITY ===
if (window.location.pathname === '/chat.html') {
  const username = localStorage.getItem('username');
  if (!username) {
    window.location.href = '/login.html';
  }
  socket.emit('set username', username);

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('messages');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  socket.on('chat message', (data) => {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });

  // === Admin Listening ===
  socket.on('strobe', () => {
    document.body.style.backgroundColor = 'black';
    setTimeout(() => {
      document.body.style.backgroundColor = 'white';
    }, 100);
  });

  socket.on('announcement', (text) => {
    alert(`📢 Announcement: ${text}`);
  });

  socket.on('kicked', () => {
    alert('You have been kicked!');
    window.location.href = '/login.html';
  });

  socket.on('timeout', (seconds) => {
    alert(`You are timed out for ${seconds} seconds.`);
    input.disabled = true;
    setTimeout(() => {
      input.disabled = false;
    }, seconds * 1000);
  });

  socket.on('showMedia', ({ imageUrl, audioUrl }) => {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.position = 'fixed';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transform = 'translate(-50%, -50%)';
    img.style.width = '50%';
    img.style.zIndex = 9999;
    document.body.appendChild(img);

    const audio = new Audio(audioUrl);
    audio.play();

    setTimeout(() => {
      img.remove();
    }, 10000); // 10 seconds
  });
}
