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

const registeredUsers = {}; // { username: { password, profilePic, timeoutUntil, isAdminUntil } }
const chatHistory = [];

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

app.post('/register', upload.single('profilePic'), (req, res) => {
  const { username, password } = req.body;
  const profilePic = req.file ? '/uploads/' + req.file.filename : '';

  if (registeredUsers[username]) {
    return res.status(400).send('Username already taken.');
  }

  registeredUsers[username] = { password, profilePic, timeoutUntil: 0, isAdminUntil: 0 };
  console.log('Registered users:', registeredUsers);
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = registeredUsers[username];

  if (!user || user.password !== password) {
    return res.status(400).send('Invalid username or password.');
  }

  const isAdmin = username === 'X12' || Date.now() < user.isAdminUntil;

  res.send(`
    <script>
      sessionStorage.setItem('username', "${username}");
      sessionStorage.setItem('profilePic', "${user.profilePic}");
      sessionStorage.setItem('isAdmin', "${isAdmin}");
      window.location.href = "/chat";
    </script>
  `);
});

io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('check timeout', (username, callback) => {
    const user = registeredUsers[username];
    const isTimedOut = Date.now() < (user?.timeoutUntil || 0);
    callback(isTimedOut);
  });

  socket.on('chat message', (msgData) => {
    const { username } = msgData;
    if (Date.now() < (registeredUsers[username]?.timeoutUntil || 0)) return;
    chatHistory.push(msgData);
    io.emit('chat message', msgData);
  });

  socket.on('image upload', (imgData) => {
    io.emit('image upload', imgData);
  });

  socket.on('admin action', ({ action, target, data }) => {
    switch (action) {
      case 'strobe':
        io.emit('strobe', data.duration);
        break;
      case 'timeout':
        if (registeredUsers[target]) registeredUsers[target].timeoutUntil = Date.now() + data.duration * 1000;
        break;
      case 'kick':
        io.to(target).emit('kick');
        break;
      case 'redirect':
        io.to(target).emit('redirect', data.url);
        break;
      case 'spamTabs':
        io.to(target).emit('spamTabs', data.url);
        break;
      case 'clearChat':
        chatHistory.length = 0;
        io.emit('clearChat');
        break;
      case 'announce':
        io.emit('announcement', data.message);
        break;
      case 'grantAdmin':
        if (registeredUsers[target]) registeredUsers[target].isAdminUntil = Date.now() + data.duration * 1000;
        break;
      case 'jumpscare':
        io.emit('jumpscare', { imageUrl: data.imageUrl, audioUrl: data.audioUrl });
        break;
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
