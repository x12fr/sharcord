const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory storage
const users = {};
const sockets = {};
const timeouts = {};

const ADMIN_USER = 'X12';
const ADMIN_PASS = '331256444';

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).json({ message: 'Username taken' });
  users[username] = { password, profilePic: '', nickname: username };
  res.json({ message: 'Registered successfully' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ admin: true });
  }
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(400).json({ message: 'Login failed' });
  }
  res.json({ message: 'Login successful' });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('login', (username) => {
    sockets[username] = socket;
    io.emit('userList', Object.keys(sockets));
  });

  socket.on('chatMessage', (msgData) => {
    io.emit('chatMessage', msgData);
  });

  socket.on('imageUpload', (imgData) => {
    io.emit('imageUpload', imgData);
  });

  socket.on('admin:strobe', (duration) => {
    io.emit('admin:strobe', duration);
  });

  socket.on('admin:playAudio', (url) => {
    io.emit('admin:playAudio', url);
  });

  socket.on('admin:timeout', ({ user, duration }) => {
    timeouts[user] = duration;
    io.emit('admin:timeout', { user, duration });
  });

  socket.on('admin:redirect', ({ user, link }) => {
    const target = sockets[user];
    if (target) target.emit('admin:redirect', link);
  });

  socket.on('disconnect', () => {
    for (let user in sockets) {
      if (sockets[user] === socket) {
        delete sockets[user];
        break;
      }
    }
    io.emit('userList', Object.keys(sockets));
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
