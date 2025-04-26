const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, '/')));

const users = {};

io.on('connection', (socket) => {
  socket.on('user-joined', (username) => {
    users[socket.id] = { username, profilePic: '' };
    io.emit('userList', Object.values(users));
  });

  socket.on('chat-message', (data) => {
    io.emit('chat-message', { user: data.user, text: data.text, profilePic: users[socket.id].profilePic });
  });

  socket.on('private-message', ({ to, from, message }) => {
    for (let id in users) {
      if (users[id].username === to) {
        io.to(id).emit('private-message', { from, message });
        break;
      }
    }
  });

  socket.on('chat-image', (data) => {
    io.emit('chat-image', { user: data.user, imageUrl: data.imageUrl, profilePic: users[socket.id].profilePic });
  });

  socket.on('update-profile-pic', (data) => {
    if (users[socket.id]) {
      users[socket.id].profilePic = data.profilePic;
    }
  });

  socket.on('kick-user', (username) => {
    for (let id in users) {
      if (users[id].username === username) {
        io.to(id).emit('kicked');
        io.sockets.sockets.get(id).disconnect();
        delete users[id];
        break;
      }
    }
  });

  socket.on('jumpscare-all', (data) => {
    io.emit('jumpscare', { image: data.image, audio: data.audio });
  });

  socket.on('strobe-all', (duration) => {
    io.emit('strobe', duration);
  });

  socket.on('redirect-user', ({ username, url }) => {
    for (let id in users) {
      if (users[id].username === username) {
        io.to(id).emit('redirect', url);
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('userList', Object.values(users));
  });
});

http.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
