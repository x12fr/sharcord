const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Fake Database
const usersDB = {
  'X12': '331256444' // Owner account
};
const admins = new Set(['X12']);

// Serve Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Handle Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (usersDB[username] && usersDB[username] === password) {
    return res.redirect(`/chat?user=${username}`);
  } else {
    return res.send('Invalid username or password. <a href="/login">Try again</a>.');
  }
});

// Handle Register
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (usersDB[username]) {
    return res.send('Username already exists. <a href="/register">Try again</a>.');
  }
  usersDB[username] = password;
  return res.redirect(`/chat?user=${username}`);
});

// WebSocket Stuff
const users = {}; 
const userSockets = {};

io.on('connection', (socket) => {
  let currentUser = '';

  socket.on('check admin', ({ username }, cb) => {
    cb({ isAdmin: admins.has(username) });
  });

  socket.on('chat message', ({ user, message }) => {
    currentUser = user;
    users[socket.id] = user;
    userSockets[user] = socket.id;
    io.emit('chat message', { user, message });
  });

  socket.on('private message', ({ to, from, message }) => {
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('private message', { from, message });
    }
  });

  socket.on('announcement', (msg) => {
    io.emit('announcement', msg);
  });

  socket.on('flash', (targetUsername) => {
    const targetSocket = userSockets[targetUsername];
    if (targetSocket) {
      io.to(targetSocket).emit('flash');
    }
  });

  socket.on('jumpscare', () => {
    for (let id in users) {
      io.to(id).emit('jumpscare');
    }
  });

  socket.on('redirect', ({ user, url }) => {
    const socketId = userSockets[user];
    if (socketId) {
      io.to(socketId).emit('redirect', url);
    }
  });

  socket.on('timeout', ({ user, seconds }) => {
    const socketId = userSockets[user];
    if (socketId) {
      io.to(socketId).emit('timeout', seconds);
    }
  });

  socket.on('kick', (user) => {
    const socketId = userSockets[user];
    if (socketId) {
      io.to(socketId).emit('kick');
      io.sockets.sockets.get(socketId)?.disconnect();
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    delete userSockets[user];
    delete users[socket.id];
  });
});

server.listen(3000, () => {
  console.log('Sharcord server running on http://localhost:3000');
});
