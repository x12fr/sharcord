const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const users = {};
const timeouts = {};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

io.on('connection', socket => {
  socket.on('new-user', (username) => {
    socket.username = username;
    users[socket.id] = { username, pfp: '/defaultpfp.png' };
    io.emit('user-connected', users[socket.id]);
  });

  socket.on('send-chat-message', message => {
    if (timeouts[socket.username]) return;
    io.emit('chat-message', { message, user: users[socket.id] });
  });

  socket.on('send-image', url => {
    if (timeouts[socket.username]) return;
    io.emit('chat-image', { url, user: users[socket.id] });
  });

  socket.on('private-message', ({ to, message }) => {
    if (timeouts[socket.username]) return;
    for (const id in users) {
      if (users[id].username === to) {
        io.to(id).emit('private-message', { from: users[socket.id].username, message });
      }
    }
  });

  socket.on('change-pfp', url => {
    users[socket.id].pfp = url;
    io.emit('pfp-changed', { username: users[socket.id].username, url });
  });

  socket.on('force-change-pfp', ({ username, url }) => {
    for (const id in users) {
      if (users[id].username === username) {
        users[id].pfp = url;
        io.emit('pfp-changed', { username, url });
      }
    }
  });

  socket.on('timeout-user', username => {
    timeouts[username] = true;
    setTimeout(() => {
      delete timeouts[username];
    }, 10000);
  });

  socket.on('redirect-user', ({ username, url }) => {
    for (const id in users) {
      if (users[id].username === username) {
        io.to(id).emit('redirect', url);
      }
    }
  });

  socket.on('strobe-all', () => {
    io.emit('strobe');
  });

  socket.on('play-audio', url => {
    io.emit('play-audio', url);
  });

  socket.on('jumpscare', ({ img, audio }) => {
    io.emit('jumpscare', { img, audio });
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('user-disconnected', socket.username);
  });
});

http.listen(PORT, () => console.log('Sharcord running on port', PORT));
