const socket = io();
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const imageInput = document.getElementById('imageInput');
const profileInput = document.getElementById('profileInput');

const username = localStorage.getItem('username') || 'Guest';
const isAdmin = localStorage.getItem('isAdmin') === 'true';
let profilePic = localStorage.getItem('profilePic') || '';

function appendMessage(msg) {
  const msgContainer = document.createElement('div');
  msgContainer.classList.add('message');
  if (msg.isAdmin) msgContainer.classList.add('admin');

  const profileImg = document.createElement('img');
  profileImg.src = msg.profilePic || '';
  profileImg.classList.add('pfp');

  const msgText = document.createElement('span');
  msgText.innerHTML = `${msg.isAdmin ? '<span class="staff-tag">[staff]</span> ' : ''}<strong>${msg.user}</strong>: ${msg.text}`;

  msgContainer.appendChild(profileImg);
  msgContainer.appendChild(msgText);
  chatBox.appendChild(msgContainer);
  chatBox.scrollTop = chatBox.scrollHeight;
}

socket.on('init', history => {
  chatBox.innerHTML = '';
  history.forEach(msg => appendMessage(msg));
});

socket.on('chat message', msg => {
  appendMessage(msg);
});

socket.on('image message', msg => {
  const msgContainer = document.createElement('div');
  msgContainer.classList.add('message');
  if (msg.isAdmin) msgContainer.classList.add('admin');

  const profileImg = document.createElement('img');
  profileImg.src = msg.profilePic || '';
  profileImg.classList.add('pfp');

  const msgText = document.createElement('div');
  msgText.innerHTML = `${msg.isAdmin ? '<span class="staff-tag">[staff]</span> ' : ''}<strong>${msg.user}</strong>:`;

  const image = document.createElement('img');
  image.src = msg.text;
  image.classList.add('chat-image');

  msgContainer.appendChild(profileImg);
  msgContainer.appendChild(msgText);
  msgContainer.appendChild(image);
  chatBox.appendChild(msgContainer);
  chatBox.scrollTop = chatBox.scrollHeight;
});

messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && messageInput.value.trim()) {
    socket.emit('chat message', {
      user: username,
      text: messageInput.value.trim(),
      isAdmin: isAdmin,
      profilePic: profilePic
    });
    messageInput.value = '';
  }
});

function sendImage(imgData) {
  socket.emit('image message', {
    user: username,
    text: imgData,
    isAdmin: isAdmin,
    profilePic: profilePic
  });
}

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => sendImage(reader.result);
  reader.readAsDataURL(file);
});

profileInput.addEventListener('change', () => {
  const file = profileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    profilePic = reader.result;
    localStorage.setItem('profilePic', profilePic);
    alert('Profile picture set!');
  };
  reader.readAsDataURL(file);
});
