const socket = io();

// User data
let username = localStorage.getItem('username');
let profilePic = localStorage.getItem('profilePic') || '/defaultpfp.png';
let currentServer = null;
let currentChannel = null;
let isAdmin = username === 'X12';

// On connect, send user data
socket.emit('user_connected', { username, profilePic });

// DOM Elements
const serversDiv = document.getElementById('servers');
const channelsDiv = document.getElementById('channels');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Load servers
socket.on('server_list', servers => {
  serversDiv.innerHTML = '';
  servers.forEach(server => {
    const btn = document.createElement('button');
    btn.textContent = server.name;
    btn.onclick = () => selectServer(server.name);
    serversDiv.appendChild(btn);
  });
});

// Load channels
socket.on('channel_list', channels => {
  channelsDiv.innerHTML = '';
  channels.forEach(channel => {
    const btn = document.createElement('button');
    btn.textContent = channel.name;
    btn.onclick = () => selectChannel(channel.name);
    channelsDiv.appendChild(btn);
  });
});

// New message
socket.on('chat_message', ({ username, profilePic, message }) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<img src="${profilePic}" class="pfp"> <b>${username}:</b> ${message}`;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Admin actions
socket.on('admin_strobe', () => {
  let colors = ['red', 'blue', 'green', 'purple', 'yellow'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.background = colors[i % colors.length];
    i++;
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.background = '';
  }, 3000);
});

socket.on('admin_announcement', message => {
  alert(`Announcement: ${message}`);
});

socket.on('kick', () => {
  alert('You were kicked!');
  window.location.href = '/';
});

socket.on('timeout', time => {
  alert(`You have been timed out for ${time} seconds`);
  messageInput.disabled = true;
  setTimeout(() => {
    messageInput.disabled = false;
  }, time * 1000);
});

socket.on('admin_media', ({ imageUrl, audioUrl }) => {
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.position = 'fixed';
  img.style.top = '20%';
  img.style.left = '50%';
  img.style.transform = 'translate(-50%, -50%)';
  img.style.width = '300px';
  document.body.appendChild(img);

  const audio = new Audio(audioUrl);
  audio.play();

  setTimeout(() => {
    img.remove();
  }, 10000);
});

// Functions
function sendMessage() {
  const message = messageInput.value.trim();
  if (message && currentServer && currentChannel) {
    socket.emit('chat_message', {
      server: currentServer,
      channel: currentChannel,
      username,
      profilePic,
      message
    });
    messageInput.value = '';
  }
}

function createServer() {
  const name = document.getElementById('serverNameInput').value.trim();
  if (name) {
    socket.emit('create_server', name);
    document.getElementById('serverNameInput').value = '';
  }
}

function createChannel() {
  const name = document.getElementById('channelNameInput').value.trim();
  if (name && currentServer) {
    socket.emit('create_channel', { server: currentServer, channel: name });
    document.getElementById('channelNameInput').value = '';
  }
}

function selectServer(serverName) {
  currentServer = serverName;
  socket.emit('get_channels', serverName);
  messagesDiv.innerHTML = '';
}

function selectChannel(channelName) {
  currentChannel = channelName;
  messagesDiv.innerHTML = '';
  socket.emit('join_channel', { server: currentServer, channel: currentChannel });
}

// Admin Panel (only for X12)
if (isAdmin) {
  const adminPanel = document.createElement('div');
  adminPanel.innerHTML = `
    <h2>Admin Panel</h2>
    <button onclick="adminStrobe()">Strobe All</button>
    <input id="announcementInput" placeholder="Announcement Message">
    <button onclick="adminAnnounce()">Send Announcement</button>
    <input id="kickUserInput" placeholder="Username to kick">
    <button onclick="adminKick()">Kick User</button>
    <input id="timeoutUserInput" placeholder="Username to timeout">
    <input id="timeoutDurationInput" placeholder="Duration (sec)">
    <button onclick="adminTimeout()">Timeout User</button>
    <input id="imageUrlInput" placeholder="Image URL">
    <input id="audioUrlInput" placeholder="Audio URL">
    <button onclick="adminSendMedia()">Send Media</button>
  `;
  document.body.appendChild(adminPanel);
}

function adminStrobe() {
  socket.emit('admin_strobe');
}

function adminAnnounce() {
  const msg = document.getElementById('announcementInput').value;
  socket.emit('admin_announcement', msg);
}

function adminKick() {
  const user = document.getElementById('kickUserInput').value;
  socket.emit('admin_kick', user);
}

function adminTimeout() {
  const user = document.getElementById('timeoutUserInput').value;
  const time = parseInt(document.getElementById('timeoutDurationInput').value);
  socket.emit('admin_timeout', { user, time });
}

function adminSendMedia() {
  const imageUrl = document.getElementById('imageUrlInput').value;
  const audioUrl = document.getElementById('audioUrlInput').value;
  socket.emit('admin_media', { imageUrl, audioUrl });
}
