const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware
app.use(express.static('public')); // Serve static files from /public
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Handle / route (the problem you had)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Create uploads directory if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Users
const users = {};
const timeouts = {};

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', ({ username, password }) => {
    if (users[username]) {
      socket.emit('registerFail', 'Username already taken.');
    } else {
      users[username] = { password, profilePic: '/default.png' };
      socket.emit('registerSuccess');
    }
  });

  socket.on('login', ({ username, password }) => {
    const user = users[username];
    if (user && user.password === password) {
      socket.username = username;
      socket.emit('loginSuccess', { username, profilePic: user.profilePic });
    } else {
      socket.emit('loginFail', 'Invalid username or password.');
    }
  });

  socket.on('sendMessage', (message) => {
    if (socket.username) {
      io.emit('newMessage', {
        username: socket.username,
        message,
        profilePic: users[socket.username].profilePic,
        timeout: timeouts[socket.username] || 0
      });
    }
  });

  socket.on('sendImage', (fileData) => {
    io.emit('newImage', {
      username: socket.username,
      fileData,
      profilePic: users[socket.username].profilePic,
      timeout: timeouts[socket.username] || 0
    });
  });

  socket.on('adminFlash', (duration) => {
    io.emit('flashScreen', duration);
  });

  socket.on('adminTimeout', ({ username, seconds }) => {
    timeouts[username] = seconds;
    io.emit('updateTimeout', { username, seconds });
  });

  socket.on('adminRedirect', ({ username, link }) => {
    io.emit('forceRedirect', { username, link });
  });

  socket.on('adminPlayAudio', (audioData) => {
    io.emit('playAudio', audioData);
  });

  socket.on('adminDisplayImage', (imageData) => {
    io.emit('displayImage', imageData);
  });

  socket.on('updateProfilePic', (picUrl) => {
    if (socket.username) {
      users[socket.username].profilePic = picUrl;
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Server start
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
