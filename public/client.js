// ===== Variables =====
let currentUser = null;
let servers = {};
let currentServer = null;
let currentChannel = null;
let messages = {};
let users = {}; 
let timeouts = {};

// ===== Login =====
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const storedUser = JSON.parse(localStorage.getItem(`user_${username}`));

  if (storedUser && storedUser.password === password) {
    localStorage.setItem('loggedInUser', username);
    window.location.href = 'chat.html';
  } else {
    alert('Invalid username or password.');
  }
}

// ===== Register =====
function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const existingUser = localStorage.getItem(`user_${username}`);

  if (existingUser) {
    alert('Username already exists.');
    return;
  }

  const user = { username, password, friends: [], about: "", avatar: "", status: "Online" };
  localStorage.setItem(`user_${username}`, JSON.stringify(user));
  alert('Registration successful!');
  window.location.href = 'login.html';
}

// ===== When chat.html loads =====
window.onload = function() {
  const user = localStorage.getItem('loggedInUser');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;

  if (currentUser === 'X12') {
    document.getElementById('admin-panel').style.display = 'block';
  }

  loadServers();
  loadProfile();
};

// ===== Profile =====
function loadProfile() {
  const user = JSON.parse(localStorage.getItem(`user_${currentUser}`));
  if (user) {
    document.getElementById('profile-name').innerText = user.username;
    if (user.avatar) {
      document.getElementById('profile-avatar').src = user.avatar;
    }
  }
}

// ===== Servers =====
function loadServers() {
  servers = JSON.parse(localStorage.getItem('servers')) || {};
  const serverList = document.getElementById('server-list');
  serverList.innerHTML = '';

  for (const serverName in servers) {
    const serverButton = document.createElement('button');
    serverButton.innerText = serverName;
    serverButton.onclick = () => loadChannels(serverName);
    serverList.appendChild(serverButton);
  }
}

function createServer() {
  const serverName = prompt('Enter server name:');
  if (!serverName) return;
  servers[serverName] = { channels: { general: [] } };
  localStorage.setItem('servers', JSON.stringify(servers));
  loadServers();
}

// ===== Channels =====
function loadChannels(serverName) {
  currentServer = serverName;
  const channelList = document.getElementById('channel-list');
  channelList.innerHTML = '';

  const server = servers[serverName];
  for (const channelName in server.channels) {
    const channelButton = document.createElement('button');
    channelButton.innerText = `#${channelName}`;
    channelButton.onclick = () => loadMessages(channelName);
    channelList.appendChild(channelButton);
  }
}

function createChannel() {
  const channelName = prompt('Enter channel name:');
  if (!channelName) return;
  if (!currentServer) return alert('Select a server first.');

  servers[currentServer].channels[channelName] = [];
  localStorage.setItem('servers', JSON.stringify(servers));
  loadChannels(currentServer);
}

// ===== Messages =====
function loadMessages(channelName) {
  currentChannel = channelName;
  const messageArea = document.getElementById('messages');
  messageArea.innerHTML = '';

  const server = servers[currentServer];
  const channel = server.channels[channelName];
  for (const message of channel) {
    displayMessage(message.user, message.text);
  }
}

function sendMessage() {
  const text = document.getElementById('message-input').value;
  if (!text.trim()) return;
  if (!currentChannel) return alert('Select a channel first.');

  const message = { user: currentUser, text };
  servers[currentServer].channels[currentChannel].push(message);
  localStorage.setItem('servers', JSON.stringify(servers));

  displayMessage(currentUser, text);
  document.getElementById('message-input').value = '';
}

function displayMessage(user, text) {
  const messageArea = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = `<strong>${user}:</strong> ${text}`;
  messageArea.appendChild(messageDiv);
  messageArea.scrollTop = messageArea.scrollHeight;
}

// ===== Admin Panel =====
function strobeScreen() {
  let colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  let i = 0;
  const strobe = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 100);

  setTimeout(() => {
    clearInterval(strobe);
    document.body.style.backgroundColor = '';
  }, 3000);
}

function sendAnnouncement() {
  const announcement = prompt('Enter announcement:');
  if (!announcement) return;
  alert(`ANNOUNCEMENT: ${announcement}`);
}

function kickUser() {
  const userToKick = prompt('Enter username to kick:');
  if (!userToKick) return;
  if (userToKick === 'X12') return alert('You cannot kick yourself.');

  localStorage.removeItem(`user_${userToKick}`);
  alert(`${userToKick} has been kicked.`);
}

function timeoutUser() {
  const userToTimeout = prompt('Enter username to timeout:');
  if (!userToTimeout) return;
  const duration = parseInt(prompt('Enter duration (seconds):'), 10);

  if (isNaN(duration)) return;

  timeouts[userToTimeout] = Date.now() + duration * 1000;
  alert(`${userToTimeout} is timed out for ${duration} seconds.`);
}

function uploadMedia() {
  const imageUrl = prompt('Enter image URL:');
  const audioUrl = prompt('Enter audio URL:');

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = '300px';
    img.style.position = 'fixed';
    img.style.top = '10px';
    img.style.left = '50%';
    img.style.transform = 'translateX(-50%)';
    document.body.appendChild(img);

    setTimeout(() => {
      img.remove();
    }, 10000);
  }

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
  }
}
