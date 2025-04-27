const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const path = require('path');
const bodyParser = require('body-parser');

let users = {}; // username -> socketId
let pfps = {}; // username -> profilePic

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
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

// Login system (very simple for now)
const registeredUsers = {};

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (registeredUsers[username] && registeredUsers[username] === password) {
    res.redirect('/chat');
  } else {
    res.send('Invalid login.');
  }
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!registeredUsers[username]) {
    registeredUsers[username] = password;
    res.redirect('/login');
  } else {
    res.send('Username already taken.');
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('setUsername', ({ username, profilePic }) => {
    users[username] = socket.id;
    pfps[username] = profilePic;
    socket.username = username;
    socket.profilePic = profilePic;
  });

  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', {
      username: data.username,
      text: data.text,
      pfp: data.pfp || pfps[data.username] || ''
    });
  });

  socket.on('sendImage', (data) => {
    io.emit('imageMessage', {
      username: data.username,
      imageUrl: data.imageUrl,
      pfp: data.pfp || pfps[data.username] || ''
    });
  });

  socket.on('strobeAll', () => {
    io.emit('strobeAll');
  });

  socket.on('playAudio', (url) => {
    io.emit('playAudio', url);
  });

  socket.on('timeoutUser', ({ user, seconds }) => {
    if (users[user]) {
      io.to(users[user]).emit('timeout', seconds);
    }
  });

  socket.on('redirectUser', ({ user, url }) => {
    if (users[user]) {
      io.to(users[user]).emit('redirect', url);
    }
  });

  socket.on('changeUserPfp', ({ user, newPfp }) => {
    if (users[user]) {
      pfps[user] = newPfp;
      io.to(users[user]).emit('changePfp', newPfp);
    }
  });

  socket.on('jumpscare', ({ imageUrl, audioUrl }) => {
    io.emit('jumpscare', { imageUrl, audioUrl });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
    for (const user in users) {
      if (users[user] === socket.id) {
        delete users[user];
        delete pfps[user];
        break;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
