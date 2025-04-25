const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

const users = {}; // { username: { password, socketId, isAdmin } }
const messages = []; // Store messages

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.send('Username already exists.');
  }
  users[username] = { password, socketId: null, isAdmin: false };
  res.redirect('/');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.send('Invalid login.');
  }
  res.redirect(`/chat.html?username=${username}`);
});

io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('login', (username) => {
    if (users[username]) {
      users[username].socketId = socket.id;
      socket.username = username;
      socket.isAdmin = users[username].isAdmin || (username === 'X12');

      socket.emit('chat history', messages);
      io.emit('user list', Object.keys(users));
    }
  });

  socket.on('chat message', (msg) => {
    const message = { username: socket.username, text: msg, type: 'text' };
    messages.push(message);
    io.emit('chat message', message);
  });

  socket.on('send image', (imgUrl) => {
    const message = { username: socket.username, text: imgUrl, type: 'image' };
    messages.push(message);
    io.emit('chat message', message);
  });

  socket.on('send audio', (audioUrl) => {
    const message = { username: socket.username, text: audioUrl, type: 'audio' };
    messages.push(message);
    io.emit('chat message', message);
  });

  // Admin Functions
  socket.on('flash', (target) => {
    if (socket.isAdmin) {
      const user = users[target];
      if (user && user.socketId) {
        io.to(user.socketId).emit('flash');
      }
    }
  });

  socket.on('announce', (announcement) => {
    if (socket.isAdmin) {
      io.emit('announcement', announcement);
    }
  });

  socket.on('redirect', ({ target, url }) => {
    if (socket.isAdmin) {
      const user = users[target];
      if (user && user.socketId) {
        io.to(user.socketId).emit('redirect', url);
      }
    }
  });

  socket.on('timeout', ({ target, duration }) => {
    if (socket.isAdmin) {
      const user = users[target];
      if (user && user.socketId) {
        io.to(user.socketId).emit('timeout', duration);
      }
    }
  });

  socket.on('kick', (target) => {
    if (socket.isAdmin) {
      const user = users[target];
      if (user && user.socketId) {
        io.to(user.socketId).emit('kick');
      }
    }
  });

  // Owner Special
  socket.on('jumpscare', () => {
    if (socket.username === 'X12') {
      io.emit('jumpscare');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected.');
    if (socket.username) {
      users[socket.username].socketId = null;
    }
    io.emit('user list', Object.keys(users));
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
