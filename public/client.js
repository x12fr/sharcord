// ======== LOGIN FORM ========
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      window.location.href = '/chat.html';
    } else {
      alert('Invalid login. Please try again.');
    }
  });
}

// ======== REGISTER FORM ========
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      window.location.href = '/chat.html';
    } else {
      alert('Registration failed. Try a different username.');
    }
  });
}

// ======== CHAT PAGE ========
const socket = io();

// Chat sending
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

if (messageForm) {
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message !== '') {
      socket.emit('chat message', message);
      messageInput.value = '';
    }
  });

  // Receiving chat messages
  socket.on('chat message', (data) => {
    const msgElement = document.createElement('div');
    msgElement.classList.add('message');
    msgElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    messagesContainer.appendChild(msgElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// ======== ADMIN FEATURES (ONLY FOR X12) ========
socket.on('strobe', () => {
  let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];
  let i = 0;
  const strobeInterval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 100);

  setTimeout(() => {
    clearInterval(strobeInterval);
    document.body.style.backgroundColor = '';
  }, 3000); // stop after 3 seconds
});

socket.on('announcement', (text) => {
  const announcement = document.createElement('div');
  announcement.className = 'announcement';
  announcement.innerText = `📢 Announcement: ${text}`;
  document.body.prepend(announcement);

  setTimeout(() => {
    announcement.remove();
  }, 5000);
});

socket.on('kicked', () => {
  alert('You have been kicked.');
  window.location.href = '/';
});

socket.on('timeout', (time) => {
  alert(`You have been timed out for ${time} seconds.`);
  messageInput.disabled = true;
  setTimeout(() => {
    messageInput.disabled = false;
  }, time * 1000);
});

socket.on('showMedia', (data) => {
  const img = document.createElement('img');
  img.src = data.imageUrl;
  img.style.position = 'fixed';
  img.style.top = '20%';
  img.style.left = '50%';
  img.style.transform = 'translateX(-50%)';
  img.style.zIndex = '9999';
  img.style.maxWidth = '500px';
  img.style.maxHeight = '300px';
  document.body.appendChild(img);

  const audio = new Audio(data.audioUrl);
  audio.play();

  setTimeout(() => {
    img.remove();
  }, 10000); // remove image after 10 seconds
});
