const socket = io();

// Globals
let currentServer = null;
let currentChannel = null;

// --- Handle creating a server ---
document.getElementById('create-server-btn').addEventListener('click', () => {
  const serverName = prompt('Enter server name:');
  if (serverName) {
    socket.emit('createServer', serverName);
  }
});

// --- Handle creating a channel ---
document.getElementById('create-channel-btn').addEventListener('click', () => {
  const channelName = prompt('Enter channel name:');
  if (channelName && currentServer) {
    socket.emit('createChannel', { server: currentServer, channel: channelName });
  }
});

// --- Handle selecting a server ---
socket.on('serverList', (servers) => {
  const serverList = document.getElementById('server-list');
  serverList.innerHTML = '';

  servers.forEach((server) => {
    const li = document.createElement('li');
    li.textContent = server.name;
    li.addEventListener('click', () => {
      currentServer = server.name;
      currentChannel = null;
      socket.emit('joinServer', server.name);
      document.getElementById('server-name').innerText = server.name;
    });
    serverList.appendChild(li);
  });
});

// --- Handle selecting a channel ---
socket.on('channelList', (channels) => {
  const channelList = document.getElementById('channel-list');
  channelList.innerHTML = '';

  channels.forEach((channel) => {
    const li = document.createElement('li');
    li.textContent = `#${channel.name}`;
    li.addEventListener('click', () => {
      currentChannel = channel.name;
      socket.emit('joinChannel', { server: currentServer, channel: channel.name });
      document.getElementById('chat-input').placeholder = `Message #${channel.name}...`;
      document.getElementById('messages').innerHTML = '';
    });
    channelList.appendChild(li);
  });
});

// --- Handle receiving messages ---
socket.on('message', (msg) => {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.classList.add('message');
  div.textContent = `${msg.username}: ${msg.content}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

// --- Send a chat message ---
document.getElementById('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const message = input.value.trim();

  if (message && currentServer && currentChannel) {
    socket.emit('chatMessage', {
      server: currentServer,
      channel: currentChannel,
      content: message
    });
    input.value = '';
  }
});

// --- On connect, request server list ---
socket.emit('requestServers');
