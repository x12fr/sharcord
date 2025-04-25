const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

const users = {}; // Stores { username: { password, profilePic, socketId, timeoutUntil } }

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/chat.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(400).send('Invalid username or password');
  }
  res.status(200).send('Login successful');
});

// Register route (NEW)
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }
  if (users[username]) {
    return res.status(400).send('Username already exists');
  }
  users[username] = { password: password, profilePic: '/default.png' };
  console.log(`Registered new user: ${username}`);
  res.status(200).send('User registered successfully');
});

// Socket.io stuff
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('setUserData', ({ username, profilePic }) => {
    users[username].socketId = socket.id;
    users[username].profilePic = profilePic || '/default.png';
    socket.username = username;
    console.log(`${username} joined with profile picture ${profilePic}`);
  });

  socket.on('chatMessage', (data) => {
    const { username, message, imageUrl } = data;
    if (users[username]?.timeoutUntil && users[username].timeoutUntil > Date.now()) {
      socket.emit('errorMessage', 'You are timed out!');
      return;
    }
    io.emit('chatMessage', { username, message, profilePic: users[username]?.profilePic, imageUrl });
  });

  socket.on('adminStrobe', (duration) => {
    io.emit('strobe', duration);
  });

  socket.on('adminPlayAudio', (youtubeUrl) => {
    io.emit('playAudio', youtubeUrl);
  });

  socket.on('adminTimeoutUser', ({ targetUsername, duration }) => {
    const user = users[targetUsername];
    if (user && user.socketId) {
      user.timeoutUntil = Date.now() + duration * 1000;
      io.to(user.socketId).emit('timedOut', duration);
    }
  });

  socket.on('adminRedirectUser', ({ targetUsername, link }) => {
    const user = users[targetUsername];
    if (user && user.socketId) {
      io.to(user.socketId).emit('redirect', link);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
