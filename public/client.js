const socket = io();
let username = "";

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  fetch('/api/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => res.json()).then(data => {
    if (!data.success) {
      window.location.href = '/login.html';
      return;
    }

    username = data.username;
    if (username === "X12") {
      document.getElementById('adminMenu').classList.remove('hidden');
    }

    socket.emit('join', { username });
  });

  document.getElementById('messageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('messageInput').value;
    if (msg.trim() !== "") {
      socket.emit('chat message', { username, msg });
      document.getElementById('messageInput').value = "";
    }
  });

  socket.on('chat message', (data) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.innerHTML = `<strong>${data.username}:</strong> ${data.msg}`;
    document.getElementById('messages').appendChild(msgDiv);
    msgDiv.scrollIntoView();
  });

  socket.on('announcement', (msg) => {
    alert(`📢 Admin Announcement: ${msg}`);
  });

  socket.on('strobe', () => {
    let colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    let i = 0;
    const interval = setInterval(() => {
      document.body.style.backgroundColor = colors[i % colors.length];
      i++;
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    }, 3000);
  });

  socket.on('kick', () => {
    alert("You have been kicked by admin!");
    window.location.href = '/login.html';
  });

  socket.on('timeout', (duration) => {
    alert(`You've been timed out for ${duration} seconds.`);
    document.getElementById('messageInput').disabled = true;
    setTimeout(() => {
      document.getElementById('messageInput').disabled = false;
    }, duration * 1000);
  });

  socket.on('broadcastMedia', (fileUrl, type) => {
    if (type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = fileUrl;
      img.classList.add('broadcast-img');
      document.body.appendChild(img);
      setTimeout(() => img.remove(), 10000);
    } else if (type.startsWith('audio/')) {
      const audio = new Audio(fileUrl);
      audio.play();
    }
  });
});

function strobeScreens() {
  socket.emit('admin strobe');
}

function sendAnnouncement() {
  const msg = prompt("Enter announcement message:");
  if (msg) socket.emit('admin announcement', msg);
}

function kickUser() {
  const user = prompt("Enter username to kick:");
  if (user) socket.emit('admin kick', user);
}

function timeoutUser() {
  const user = prompt("Enter username to timeout:");
  const duration = prompt("Enter duration (seconds):");
  if (user && duration) socket.emit('admin timeout', { user, duration });
}

function uploadAndSend() {
  const fileInput = document.getElementById('uploadFile');
  const file = fileInput.files[0];
  if (!file) return alert("No file selected!");

  const formData = new FormData();
  formData.append('file', file);

  fetch('/api/upload', {
    method: 'POST',
    body: formData
  }).then(res => res.json()).then(data => {
    if (data.success) {
      socket.emit('admin broadcast', { fileUrl: data.url, type: file.type });
    }
  });
}

function createServer() {
  alert("Feature coming soon: Create servers!");
}
