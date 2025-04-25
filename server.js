const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

let users = {};

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('login', ({ username, password }) => {
    if (users[username]) {
      socket.emit('login-failed', 'Username already taken');
    } else {
      socket.username = username;
      socket.profilePic = 'default.png';
      users[username] = socket;

      socket.emit('login-success', username);
      if (username === 'X12' && password === '331256444') {
        socket.emit('admin-authenticated');
      }
    }
  });

  socket.on('chat-message', (text) => {
    io.emit('chat-message', {
      username: socket.username,
      text,
      profilePic: socket.profilePic || 'default.png'
    });
  });

  // === Admin Events ===
  socket.on('admin-strobe', (duration) => {
    if (socket.username === 'X12') {
      io.emit('strobe', duration);
    }
  });

  socket.on('admin-timeout', ({ user, seconds }) => {
    if (socket.username === 'X12' && users[user]) {
      users[user].emit('timeout', seconds);
    }
  });

  socket.on('admin-redirect', ({ user, link }) => {
    if (socket.username === 'X12' && users[user]) {
      users[user].emit('redirect', link);
    }
  });

  socket.on('admin-jumpscare', ({ image, audio }) => {
    if (socket.username === 'X12') {
      io.emit('run-jumpscare', { image, audio });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username && users[socket.username]) {
      delete users[socket.username];
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
