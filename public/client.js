const socket = io();
const username = localStorage.getItem('username');
const profilePic = localStorage.getItem('profilePic') || 'default.png';

if (!username) {
  window.location.href = '/login.html';
}

document.getElementById('messageInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const input = document.getElementById('messageInput');
  if (input.value.trim() !== '') {
    socket.emit('chat message', { username, text: input.value, profilePic });
    input.value = '';
  }
}

socket.on('chat message', data => {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.innerHTML = `<img src="${data.profilePic}" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;"> <b style="color:#0ff;">${data.username}</b>: ${data.text}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

socket.emit('check admin', username);

socket.on('enable admin', () => {
  document.getElementById('adminPanel').style.display = 'block';
});

function strobe() {
  const duration = parseInt(document.getElementById('strobeDuration').value) || 3;
  socket.emit('admin strobe', duration);
}

function timeout() {
  const user = document.getElementById('timeoutUser').value;
  const duration = parseInt(document.getElementById('timeoutDuration').value) || 5;
  socket.emit('admin timeout', { user, duration });
}

function redirect() {
  const user = document.getElementById('redirectUser').value;
  socket.emit('admin redirect', user);
}

function sendAnnouncement() {
  const text = document.getElementById('announcementText').value;
  socket.emit('admin announcement', text);
}

function jumpscare() {
  const image = document.getElementById('jumpscareImage').value;
  const audio = document.getElementById('jumpscareAudio').value;
  socket.emit('admin jumpscare', { image, audio });
}

socket.on('strobe', duration => {
  let colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#fff'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.background = colors[i % colors.length];
    i++;
  }, 100);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.background = '#000'; // Reset to black
  }, duration * 1000);
});

socket.on('timeout', seconds => {
  document.body.innerHTML = `<h1 style="color:red;">You are timed out for ${seconds} seconds!</h1>`;
  setTimeout(() => {
    location.reload();
  }, seconds * 1000);
});

socket.on('redirect', () => {
  window.location.href = '/secret.html';
});

socket.on('announcement', text => {
  const announcement = document.getElementById('announcement');
  announcement.style.display = 'block';
  announcement.innerText = text;
  setTimeout(() => {
    announcement.style.display = 'none';
  }, 10000);
});

socket.on('jumpscare', data => {
  const img = document.createElement('img');
  img.src = data.image;
  img.style.position = 'fixed';
  img.style.top = 0;
  img.style.left = 0;
  img.style.width = '100vw';
  img.style.height = '100vh';
  img.style.objectFit = 'cover';
  img.style.zIndex = 9999;
  document.body.appendChild(img);

  const audio = new Audio(data.audio);
  audio.play();

  setTimeout(() => {
    img.remove();
  }, 5000); // Image disappears after 5 seconds but audio keeps playing
});
