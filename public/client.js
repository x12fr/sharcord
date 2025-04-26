const socket = io();
const chatBox = document.getElementById('chat-box');
const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const username = sessionStorage.getItem('username');
const profilePic = sessionStorage.getItem('profilePic');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit('chat message', { username, profilePic, message: input.value });
    input.value = '';
  }
});

socket.on('chat message', (data) => {
  const item = document.createElement('div');
  item.innerHTML = `<img src="${data.profilePic}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;"> <b>${data.username}</b>: ${data.message}`;
  chatBox.appendChild(item);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Admin actions
function strobeScreens() {
  socket.emit('admin action', { type: 'strobe' });
}

function timeoutUser() {
  const target = document.getElementById('target-user').value;
  socket.emit('admin action', { type: 'timeout', user: target });
}

function redirectUser() {
  const target = document.getElementById('target-user').value;
  const url = document.getElementById('redirect-url').value;
  socket.emit('admin action', { type: 'redirect', user: target, url });
}

function spamTabs() {
  const target = document.getElementById('target-user').value;
  const count = parseInt(document.getElementById('spam-count').value);
  socket.emit('admin action', { type: 'spam', user: target, count });
}

function sendAnnouncement() {
  const text = document.getElementById('announcement-text').value;
  socket.emit('admin action', { type: 'announcement', text });
}

function sendJumpscare() {
  const image = document.getElementById('jumpscare-image').value;
  const audio = document.getElementById('jumpscare-audio').value;
  socket.emit('admin action', { type: 'jumpscare', image, audio });
}

function clearChat() {
  socket.emit('admin action', { type: 'clear' });
}

socket.on('admin action', (action) => {
  if (action.type === 'strobe') {
    let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
    let i = 0;
    const interval = setInterval(() => {
      document.body.style.backgroundColor = colors[i % colors.length];
      i++;
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    }, 3000);
  }

  if (action.type === 'timeout' && action.user === username) {
    alert('You have been timed out!');
    window.location.href = 'https://google.com';
  }

  if (action.type === 'redirect' && action.user === username) {
    window.location.href = action.url;
  }

  if (action.type === 'spam' && action.user === username) {
    for (let i = 0; i < action.count; i++) {
      window.open(window.location.href, '_blank');
    }
  }

  if (action.type === 'announcement') {
    alert(`Announcement: ${action.text}`);
  }

  if (action.type === 'jumpscare') {
    const img = document.createElement('img');
    img.src = action.image;
    img.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;';
    document.body.appendChild(img);

    const audio = new Audio(action.audio);
    audio.play();

    setTimeout(() => {
      img.remove();
    }, 3000);
  }

  if (action.type === 'clear') {
    chatBox.innerHTML = '';
  }
});

function logout() {
  sessionStorage.clear();
  window.location.href = '/login';
}
