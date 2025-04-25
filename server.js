const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

const users = {}; // username -> { password, profilePic }
const timeouts = {}; // username -> timeout end timestamp

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login.html', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register.html', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/chat.html', (req, res) => res.sendFile(__dirname + '/public/chat.html'));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(401).send('Invalid login');
  }
  res.redirect(`/chat.html?username=${username}`);
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(409).send('Username taken');
  }
  users[username] = { password, profilePic: '' };
  res.redirect(`/chat.html?username=${username}`);
});

io.on('connection', socket => {
  let username = '';

  socket.on('login', user => {
    username = user;
    socket.username = user;
    socket.broadcast.emit('user-joined', username);
  });

  socket.on('message', data => {
    if (timeouts[username] && Date.now() < timeouts[username]) return;
    io.emit('message', {
      username,
      text: data.text,
      image: data.image || null,
      profilePic: users[username]?.profilePic || '',
    });
  });

  socket.on('setProfilePic', url => {
    if (users[username]) users[username].profilePic = url;
  });

  socket.on('admin-command', data => {
    if (username !== 'X12') return; // Admin only

    switch (data.type) {
      case 'jumpscare':
        io.emit('jumpscare', { image: data.image, audio: data.audio });
        break;

      case 'strobe':
        io.emit('strobe', { duration: data.duration });
        break;

      case 'kick':
        io.sockets.sockets.forEach(s => {
          if (s.username === data.target) s.disconnect();
        });
        break;

      case 'timeout':
        timeouts[data.target] = Date.now() + data.duration * 1000;
        io.emit('user-timeout', { username: data.target, duration: data.duration });
        break;

      case 'redirect':
        io.sockets.sockets.forEach(s => {
          if (s.username === data.target) s.emit('redirect', data.url);
        });
        break;

      default:
        console.log('Unknown admin command');
    }
  });

  socket.on('disconnect', () => {
    if (username) {
      socket.broadcast.emit('user-left', username);
    }
  });
});

http.listen(3000, () => {
  console.log('Sharcord is running at http://localhost:3000');
});
