const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Server and channel structure
let servers = [
  { name: 'Main Server', channels: [{ name: 'general' }, { name: 'memes' }] }
];

let users = {}; // { socketId: { username, profilePic } }
let timeouts = {}; // { username: timeoutEndTimestamp }

// Socket.io
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('user_connected', ({ username, profilePic }) => {
    users[socket.id] = { username, profilePic };
    io.to(socket.id).emit('server_list', servers);
  });

  socket.on('create_server', serverName => {
    if (serverName.length > 0) {
      servers.push({ name: serverName, channels: [{ name: 'general' }] });
      io.emit('server_list', servers);
    }
  });

  socket.on('create_channel', ({ server, channel }) => {
    const srv = servers.find(s => s.name === server);
    if (srv && channel.length > 0) {
      srv.channels.push({ name: channel });
      io.emit('channel_list', srv.channels);
    }
  });

  socket.on('get_channels', serverName => {
    const srv = servers.find(s => s.name === serverName);
    if (srv) {
      io.to(socket.id).emit('channel_list', srv.channels);
    }
  });

  socket.on('join_channel', ({ server, channel }) => {
    socket.join(server + '-' + channel);
  });

  socket.on('chat_message', ({ server, channel, username, profilePic, message }) => {
    const now = Date.now();
    if (timeouts[username] && timeouts[username] > now) {
      return; // User is timed out
    }
    io.to(server + '-' + channel).emit('chat_message', { username, profilePic, message });
  });

  // ADMIN EVENTS
  socket.on('admin_strobe', () => {
    if (users[socket.id]?.username === 'X12') {
      io.emit('admin_strobe');
    }
  });

  socket.on('admin_announcement', msg => {
    if (users[socket.id]?.username === 'X12') {
      io.emit('admin_announcement', msg);
    }
  });

  socket.on('admin_kick', userToKick => {
    if (users[socket.id]?.username === 'X12') {
      const socketId = Object.keys(users).find(id => users[id].username === userToKick);
      if (socketId) {
        io.to(socketId).emit('kick');
        io.sockets.sockets.get(socketId)?.disconnect();
      }
    }
  });

  socket.on('admin_timeout', ({ user, time }) => {
    if (users[socket.id]?.username === 'X12') {
      const targetSocketId = Object.keys(users).find(id => users[id].username === user);
      if (targetSocketId) {
        timeouts[user] = Date.now() + time * 1000;
        io.to(targetSocketId).emit('timeout', time);
      }
    }
  });

  socket.on('admin_media', ({ imageUrl, audioUrl }) => {
    if (users[socket.id]?.username === 'X12') {
      io.emit('admin_media', { imageUrl, audioUrl });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete users[socket.id];
  });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
