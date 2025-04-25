const socket = io();
let username = '';
let profilePic = '';

// Login/Register
document.getElementById('loginBtn').onclick = () => loginOrRegister(false);
document.getElementById('registerBtn').onclick = () => loginOrRegister(true);

function loginOrRegister(isRegister) {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  socket.emit(isRegister ? 'register' : 'login', { user, pass });
}

socket.on('loginSuccess', (data) => {
  username = data.username;
  profilePic = data.profilePic || '';
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('chatPage').style.display = 'block';
  if (username === 'X12') document.getElementById('adminPanel').style.display = 'block';
});

socket.on('loginError', msg => alert(msg));

// Send message
document.getElementById('messageInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const msg = document.getElementById('messageInput').value;
  if (msg.trim()) socket.emit('message', { username, msg, profilePic });
  document.getElementById('messageInput').value = '';
}

// Image upload
document.getElementById('imageUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('image', { username, data: reader.result, profilePic });
  };
  reader.readAsDataURL(file);
});

// Strobe effect
function sendStrobe() {
  const duration = parseInt(document.getElementById('strobeDuration').value) || 3000;
  socket.emit('adminStrobe', duration);
}

// YouTube Audio
function playYouTubeAudio() {
  const url = document.getElementById('youtubeURL').value;
  socket.emit('adminAudio', url);
}

// Display messages
socket.on('message', ({ username, msg, profilePic }) => {
  const div = document.createElement('div');
  div.innerHTML = `<img src="${profilePic}" width="30" style="vertical-align:middle;"> <strong>${username}:</strong> ${msg}`;
  document.getElementById('messages').appendChild(div);
});

socket.on('image', ({ username, data, profilePic }) => {
  const div = document.createElement('div');
  div.innerHTML = `<img src="${profilePic}" width="30" style="vertical-align:middle;"> <strong>${username}:</strong><br><img src="${data}" width="200">`;
  document.getElementById('messages').appendChild(div);
});

socket.on('strobe', (duration) => {
  const colors = ['red', 'blue', 'green', 'purple', 'yellow'];
  let count = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[count % colors.length];
    count++;
  }, 100);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = 'black';
  }, duration);
});

socket.on('playAudio', (url) => {
  const audio = new Audio(`https://corsproxy.io/?${encodeURIComponent(url)}`);
  audio.play();
});
