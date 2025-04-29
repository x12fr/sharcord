const socket = io();

// DOM elements
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');
const imageForm = document.getElementById('image-form');
const imageInput = document.getElementById('image-url');
const profilePicInput = document.getElementById('profile-pic');
const usernameClaimForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username');
const adminKeyInput = document.getElementById('admin-key');
const claimButton = document.getElementById('claim-button');

let myUsername = localStorage.getItem('sharcord_username');
let myProfilePic = localStorage.getItem('sharcord_profilePic');
let isAdmin = localStorage.getItem('sharcord_isAdmin') === 'true';

// Claim username logic
if (!myUsername) {
  document.getElementById('claim-section').style.display = 'block';
}

claimButton.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const adminKey = adminKeyInput.value.trim();
  const profilePic = profilePicInput.value.trim() || 'https://via.placeholder.com/30';
  if (!username) return;

  myUsername = username;
  myProfilePic = profilePic;
  isAdmin = adminKey === 'your-admin-key-here';

  localStorage.setItem('sharcord_username', myUsername);
  localStorage.setItem('sharcord_profilePic', myProfilePic);
  localStorage.setItem('sharcord_isAdmin', isAdmin);

  socket.emit('set-username', {
    name: myUsername,
    profilePic: myProfilePic,
    isAdmin
  });

  document.getElementById('claim-section').style.display = 'none';
  document.getElementById('chat-section').style.display = 'block';
});

// Submit message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('send-message', message);
    messageInput.value = '';
  }
});

// Submit image
imageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const imageUrl = imageInput.value.trim();
  if (imageUrl) {
    socket.emit('send-image', imageUrl);
    imageInput.value = '';
  }
});

// Enter key to send
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    messageForm.dispatchEvent(new Event('submit'));
  }
});

// Receive chat history
socket.on('chat-history', (messages) => {
  messages.forEach(displayMessage);
});

// Receive live messages
socket.on('chat-message', displayMessage);

// Username already taken
socket.on('username-taken', () => {
  alert('Username is already taken.');
  localStorage.removeItem('sharcord_username');
  location.reload();
});

// Function to display messages or images
function displayMessage(msg) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.marginBottom = '10px';
  wrapper.style.color = 'white';

  const pic = document.createElement('img');
  pic.src = msg.profilePic || 'https://via.placeholder.com/30';
  pic.style.width = '30px';
  pic.style.height = '30px';
  pic.style.border = '2px solid red';
  pic.style.borderRadius = '50%';
  pic.style.marginRight = '10px';

  const text = document.createElement('div');
  const nameTag = document.createElement('strong');
  nameTag.textContent = msg.name;
  nameTag.style.color = msg.isAdmin ? 'red' : 'white';

  if (msg.isAdmin) {
    const adminTag = document.createElement('span');
    adminTag.textContent = ' [administrator]';
    adminTag.style.color = 'red';
    nameTag.appendChild(adminTag);
  }

  text.appendChild(nameTag);
  text.appendChild(document.createElement('br'));

  if (msg.type === 'text') {
    text.appendChild(document.createTextNode(msg.content));
  } else if (msg.type === 'image') {
    const image = document.createElement('img');
    image.src = msg.content;
    image.style.maxWidth = '200px';
    image.style.maxHeight = '200px';
    image.style.border = '2px solid red';
    text.appendChild(image);
  }

  wrapper.appendChild(pic);
  wrapper.appendChild(text);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}
