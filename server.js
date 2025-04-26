const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

// ====== User Database (Temporary In-Memory) ======
const users = {}; // { username: password }
const sessions = {}; // { sessionId: username }

// ====== Admin Setup ======
const ADMIN_USERNAME = 'X12';
const ADMIN_PASSWORD = '331256444';

// ====== Middleware ======
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ====== Login API ======
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (users[username] && users[username] === password) {
    res.status(200).json({ message: 'Login successful' });
  } else if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.status(200).json({ message: 'Admin login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// ====== Register API ======
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!users[username] && username !== ADMIN_USERNAME) {
    users[username] = password;
    res.status(200).json({ message: 'Registration successful' });
  } else {
    res.status(409).json({ message: 'Username already taken' });
  }
});

// ====== Sockets ======
io.on('connection', (socket) => {
  console.log('A user connected.');

  // ====== Chat Messages ======
  socket.on('chat message', (msg) => {
    socket.username = socket.username || 'Guest';
    io.emit('chat message', { username: socket.username, message: msg });
  });

  // ====== Assign Username ======
  socket.on('set username', (username) => {
    socket.username = username;
  });

  // ====== Admin Features ======
  socket.on('admin strobe', () => {
    if (socket.username === ADMIN_USERNAME) {
      io.emit('strobe');
    }
  });

  socket.on('admin announcement', (text) => {
    if (socket.username === ADMIN_USERNAME) {
      io.emit('announcement', text);
    }
  });

  socket.on('admin kick', (targetUsername) => {
    if (socket.username === ADMIN_USERNAME) {
      for (let [id, s] of io.of('/').sockets) {
        if (s.username === targetUsername) {
          s.emit('kicked');
          s.disconnect();
        }
      }
    }
  });

  socket.on('admin timeout', ({ targetUsername, seconds }) => {
    if (socket.username === ADMIN_USERNAME) {
      for (let [id, s] of io.of('/').sockets) {
        if (s.username === targetUsername) {
          s.emit('timeout', seconds);
        }
      }
    }
  });

  socket.on('admin showMedia', ({ imageUrl, audioUrl }) => {
    if (socket.username === ADMIN_USERNAME) {
      io.emit('showMedia', { imageUrl, audioUrl });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected.');
  });
});

// ====== Start Server ======
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
