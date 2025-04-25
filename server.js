const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup storage for profile pics and uploads
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory user database
const registeredUsers = {};

// Serve your main pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/public/chat.html');
});

// POST: Register new user
app.post('/register', upload.single('profilePic'), (req, res) => {
  const { username, password } = req.body;
  const profilePic = req.file ? '/uploads/' + req.file.filename : '';

  if (registeredUsers[username]) {
    return res.status(400).send('Username already taken.');
  }

  registeredUsers[username] = { password, profilePic };
  console.log('Registered users:', registeredUsers);
  res.redirect('/login');
});

// POST: Login existing user
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = registeredUsers[username];

  if (!user || user.password !== password) {
    return res.status(400).send('Invalid username or password.');
  }

  res.redirect('/chat');
});

// SOCKET.IO
io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('chat message', (msgData) => {
    io.emit('chat message', msgData);
  });

  socket.on('image upload', (imgData) => {
    io.emit('image upload', imgData);
  });

  socket.on('admin action', (action) => {
    io.emit('admin action', action);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
