const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const users = {}; // { username: password }
const sessions = {}; // { sessionId: username }

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/register.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/chat.html'));
});

// Handle POST /register
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).send('Username already taken');
  }
  users[username] = password;
  res.redirect('/login');
});

// Handle POST /login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    sessions[req.ip] = username;
    return res.redirect('/chat');
  } else {
    return res.status(400).send('Invalid username or password');
  }
});

const connectedUsers = {}; // { socket.id: username }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('chat message', (data) => {
    io.emit('chat message', data);
  });

  socket.on('strobe', (duration) => {
    io.emit('strobe', duration);
  });

  socket.on('timeout', ({ user, duration }) => {
    io.emit('timeout', { user, duration });
  });

  socket.on('redirect', ({ user, link }) => {
    io.emit('redirect', { user, link });
  });

  socket.on('announce', (text) => {
    io.emit('announcement', text);
  });

  socket.on('jumpscare', ({ img, audio }) => {
    io.emit('jumpscare', { img, audio });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete connectedUsers[socket.id];
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
