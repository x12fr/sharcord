const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Memory storage for users
const users = {}; // { username: { password, profilePic, socketId, timeoutUntil } }
const timeouts = {}; // { socketId: timeoutEndTime }

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.json({ success: false, message: 'Username already taken.' });
  }
  users[username] = { password, profilePic: null, socketId: null, timeoutUntil: 0 };
  res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username]) {
    return res.json({ success: false, message: 'User not found.' });
  }
  if (users[username].password !== password) {
    return res.json({ success: false, message: 'Incorrect password.' });
  }
  res.json({ success: true });
});

// Real-time socket.io communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('setUsername', (username) => {
    if (users[username]) {
      users[username].socketId = socket.id;
      socket.username = username;
      console.log(`Username ${username} associated with socket ${socket.id}`);
    }
  });

  socket.on('sendMessage', (data) => {
    const now = Date.now();
    if (timeouts[socket.id] && timeouts[socket.id] > now) {
      socket.emit('errorMessage', 'You are timed out!');
      return;
    }
    io.emit('chatMessage', {
      username: data.username,
      message: data.message,
      profilePic: users[data.username]?.profilePic || null
    });
  });

  socket.on('sendImage', (data) => {
    io.emit('imageMessage', {
      username: data.username,
      imageUrl: data.imageUrl,
      profilePic: users[data.username]?.profilePic || null
    });
  });

  socket.on('setProfilePic', (data) => {
    if (users[data.username]) {
      users[data.username].profilePic = data.profilePic;
    }
  });

  socket.on('adminStrobe', (duration) => {
    io.emit('strobeEffect', duration);
  });

  socket.on('adminPlayAudio', (youtubeUrl) => {
    io.emit('playAudio', youtubeUrl);
  });

  socket.on('adminTimeoutUser', ({ username, duration }) => {
    const user = users[username];
    if (user && user.socketId) {
      const timeoutEnd = Date.now() + duration * 1000;
      timeouts[user.socketId] = timeoutEnd;
      io.to(user.socketId).emit('timeoutSet', duration);
    }
  });

  socket.on('adminRedirectUser', ({ username, link }) => {
    const user = users[username];
    if (user && user.socketId) {
      io.to(user.socketId).emit('redirectUser', link);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
