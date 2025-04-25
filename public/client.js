const socket = io();
const username = sessionStorage.getItem('username');
let cooldown = false;

function sendMessage() {
  if (cooldown) return alert("Please wait 3 seconds before sending another message.");
  const msgInput = document.getElementById('messageInput');
  const msg = msgInput.value.trim();
  if (!msg) return;
  socket.emit('chat message', { username, text: msg, profilePic: sessionStorage.getItem('profilePic') || '' });
  msgInput.value = '';
  cooldown = true;
  setTimeout(() => cooldown = false, 3000);
}

document.getElementById('messageForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

socket.on('chat message', (msg) => {
  const box = document.getElementById('chatBox');
  const msgElem = document.createElement('div');
  msgElem.className = 'message';
  msgElem.innerHTML = `<img src="${msg.profilePic}" class="pfp"> <strong>${msg.username}</strong>: ${msg.text}`;
  box.appendChild(msgElem);
});

socket.on('image upload', (img) => {
  const box = document.getElementById('chatBox');
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${img.username}</strong>: <img src="${img.url}" class="chat-img">`;
  box.appendChild(msg);
});

socket.on('announcement', (text) => {
  const ann = document.getElementById('announcement');
  ann.innerText = text;
  ann.style.display = 'block';
});

socket.on('strobe', (duration) => {
  let colors = ['red', 'green', 'blue', 'purple', 'yellow'];
  let i = 0;
  const int = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 200);
  setTimeout(() => {
    clearInterval(int);
    document.body.style.backgroundColor = '';
  }, duration * 1000);
});

socket.on('timeout', ({ username: u, duration }) => {
  if (username === u) {
    alert(`You've been timed out for ${duration} seconds.`);
  }
});

socket.on('kick', (u) => {
  if (username === u) window.location.href = 'https://google.com';
});

socket.on('redirect', ({ username: u, url }) => {
  if (username === u) window.location.href = url;
});

socket.on('spam', (u) => {
  if (username === u) for (let i = 0; i < 10; i++) window.open("https://example.com", "_blank");
});

socket.on('clear chat', () => {
  document.getElementById('chatBox').innerHTML = '';
});

socket.on('jumpscare', ({ image, audio }) => {
  const scare = document.createElement('div');
  scare.className = 'jumpscare';
  scare.innerHTML = `<img src="${image}" class="scare-img"><audio autoplay src="${audio}"></audio>`;
  document.body.appendChild(scare);
  setTimeout(() => scare.remove(), 5000);
});
