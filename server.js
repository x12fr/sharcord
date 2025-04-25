const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const registeredUsers = {};
const timeouts = {};
let temporaryAdmins = {};

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/chat.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/public/admin.html'));

app.post('/register', upload.single('profilePic'), (req, res) => {
  const { username, password } = req.body;
  const profilePic = req.file ? '/uploads/' + req.file.filename : '';
  if (registeredUsers[username]) return res.status(400).send('Username taken');
  registeredUsers[username] = { password, profilePic };
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = registeredUsers[username];
  if (!user || user.password !== password) return res.status(400).send('Invalid');
  res.send(`
    <script>
      sessionStorage.setItem('username', "${username}");
      window.location.href = "${username === 'X12' ? '/admin' : '/chat'}";
    </script>
  `);
});

io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('chat message', (msgData) => {
    const user = msgData.username;
    if (timeouts[user]) return;
    io.emit('chat message', msgData);
  });

  socket.on('image upload', (imgData) => io.emit('image upload', imgData));
  socket.on('audio upload', (audData) => io.emit('audio upload', audData));
  socket.on('announcement', (text) => io.emit('announcement', text));
  socket.on('strobe', (duration) => io.emit('strobe', duration));
  socket.on('timeout', ({ username, duration }) => {
    timeouts[username] = Date.now() + duration * 1000;
    io.emit('timeout', { username, duration });
    setTimeout(() => delete timeouts[username], duration * 1000);
  });
  socket.on('kick', (username) => io.emit('kick', username));
  socket.on('redirect', ({ username, url }) => io.emit('redirect', { username, url }));
  socket.on('spam', (username) => io.emit('spam', username));
  socket.on('clear chat', () => io.emit('clear chat'));
  socket.on('jumpscare', (data) => io.emit('jumpscare', data));
  socket.on('grant admin', ({ username, duration }) => {
    temporaryAdmins[username] = Date.now() + duration * 1000;
    io.emit('grant admin', { username, duration });
    setTimeout(() => delete temporaryAdmins[username], duration * 1000);
  });

  socket.on('disconnect', () => console.log('User disconnected.'));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Sharcord running on ${PORT}`));
