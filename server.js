const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Data storage
let servers = []; // [{ name: "Server1", channels: [{ name: "general", messages: [] }] }]

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Socket.io Logic ---
io.on('connection', (socket) => {
  console.log('A user connected.');

  // Request for all servers
  socket.on('requestServers', () => {
    socket.emit('serverList', servers);
  });

  // Create server
  socket.on('createServer', (serverName) => {
    if (!servers.find(s => s.name === serverName)) {
      servers.push({ name: serverName, channels: [] });
      io.emit('serverList', servers);
      console.log(`Server created: ${serverName}`);
    }
  });

  // Join server
  socket.on('joinServer', (serverName) => {
    const server = servers.find(s => s.name === serverName);
    if (server) {
      socket.emit('channelList', server.channels);
    }
  });

  // Create channel
  socket.on('createChannel', ({ server, channel }) => {
    const foundServer = servers.find(s => s.name === server);
    if (foundServer && !foundServer.channels.find(c => c.name === channel)) {
      foundServer.channels.push({ name: channel, messages: [] });
      io.emit('channelList', foundServer.channels);
      console.log(`Channel created: ${channel} in server ${server}`);
    }
  });

  // Join channel
  socket.on('joinChannel', ({ server, channel }) => {
    const foundServer = servers.find(s => s.name === server);
    if (foundServer) {
      const foundChannel = foundServer.channels.find(c => c.name === channel);
      if (foundChannel) {
        // Send previous messages
        foundChannel.messages.forEach((msg) => {
          socket.emit('message', msg);
        });
      }
    }
  });

  // Chat message
  socket.on('chatMessage', ({ server, channel, content }) => {
    const foundServer = servers.find(s => s.name === server);
    if (foundServer) {
      const foundChannel = foundServer.channels.find(c => c.name === channel);
      if (foundChannel) {
        const msg = {
          username: socket.username || "Anonymous",
          content: content
        };
        foundChannel.messages.push(msg);
        io.emit('message', msg);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Start the server
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
