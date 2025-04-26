const socket = io();
const messages = document.getElementById('messages');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-button');
const pImage = document.getElementById('p-image');

let pImageVisible = false;
let cooldown = false;

// Send Message
sendBtn.onclick = () => {
  sendMessage();
};
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
  if (e.key.toLowerCase() === 'p' && document.activeElement !== input) {
    togglePImage();
  }
});

function sendMessage() {
  if (cooldown) return;
  const text = input.value.trim();
  if (text) {
    socket.emit('chat message', text);
    input.value = '';
    cooldown = true;
    setTimeout(() => cooldown = false, 3000);
  }
}

// Receive Messages
socket.on('chat message', data => {
  const div = document.createElement('div');
  div.innerHTML = `<strong>${data.username}:</strong> ${linkify(data.message)}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
}

// Toggle P Image
function togglePImage() {
  if (pImageVisible) {
    pImage.style.display = 'none';
  } else {
    pImage.style.display = 'flex';
  }
  pImageVisible = !pImageVisible;
}

// Admin Stuff
function jumpscare() {
  const imgUrl = document.getElementById('image-url').value;
  const audioUrl = document.getElementById('audio-url').value;
  socket.emit('jumpscare', { imgUrl, audioUrl });
}

function kickUser() {
  const username = document.getElementById('kick-username').value;
  socket.emit('kick user', username);
}

function changeOtherPfp() {
  const target = document.getElementById('target-username').value;
  const newPfp = document.getElementById('new-pfp-url').value;
  socket.emit('change pfp', { target, newPfp });
}

// Jumpscare Action
socket.on('do jumpscare', data => {
  const jumpscareDiv = document.createElement('div');
  jumpscareDiv.style.position = 'fixed';
  jumpscareDiv.style.top = 0;
  jumpscareDiv.style.left = 0;
  jumpscareDiv.style.width = '100vw';
  jumpscareDiv.style.height = '100vh';
  jumpscareDiv.style.backgroundColor = 'black';
  jumpscareDiv.style.display = 'flex';
  jumpscareDiv.style.justifyContent = 'center';
  jumpscareDiv.style.alignItems = 'center';
  jumpscareDiv.style.zIndex = 10000;
  jumpscareDiv.innerHTML = `<img src="${data.imgUrl}" style="max-width:90%; max-height:90%;">`;
  document.body.appendChild(jumpscareDiv);

  const audio = new Audio(data.audioUrl);
  audio.play();

  setTimeout(() => {
    document.body.removeChild(jumpscareDiv);
  }, 5000);
});
