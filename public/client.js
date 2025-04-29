const socket = io();
const username = localStorage.getItem('username') || 'Guest';
const isAdmin = localStorage.getItem('isAdmin') === 'true';
let profilePic = '';

const chatBox = document.getElementById('chatBox');
const input = document.getElementById('messageInput');

function appendMessage(data, isImage = false) {
  const msg = document.createElement('div');
  const nameColor = data.isAdmin ? 'red' : 'white';
  const label = data.isAdmin ? '[staff] ' : '';
  const imgTag = data.profilePic ? `<img src="${data.profilePic}" style="width: 25px; height: 25px; border-radius: 50%; vertical-align: middle;"> ` : '';

  msg.innerHTML = `${imgTag}<span style="color: ${nameColor}; font-weight: bold;">${label}${data.user}</span>: ${
    isImage ? `<img src="${data.text}" style="max-height: 200px;">` : `<span style="color: white;">${data.text}</span>`
  }`;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const msg = input.value.trim();
    if (msg) {
      socket.emit('chat message', {
        user: username,
        text: msg,
        isAdmin,
        profilePic
      });
      input.value = '';
    }
  }
});

socket.on('init', (messages) => {
  messages.forEach(m => appendMessage(m, m.text.startsWith('data:image')));
});

socket.on('chat message', (data) => {
  appendMessage(data);
});

socket.on('image message', (data) => {
  appendMessage(data, true);
});

document.getElementById('imageInput').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    socket.emit('image message', {
      user: username,
      text: reader.result,
      isAdmin,
      profilePic
    });
  };
  reader.readAsDataURL(file);
});

document.getElementById('profileInput').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    profilePic = reader.result;
  };
  reader.readAsDataURL(file);
});
