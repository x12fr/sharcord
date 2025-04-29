const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};
const timeouts = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('register', ({ username, password, profilePic }) => {
    if (Object.values(users).find(u => u.username === username)) {
      socket.emit('registerFail', 'Username taken');
    } else {
      users[socket.id] = { username, password, profilePic, socket };
      socket.emit('registerSuccess', { username, profilePic });
      io.emit('userJoined', { username, profilePic });
    }
  });

  socket.on('login', ({ username, password }) => {
    const user = Object.values(users).find(u => u.username === username && u.password === password);
    if (user) {
      users[socket.id] = { ...user, socket };
      socket.emit('loginSuccess', { username: user.username, profilePic: user.profilePic });
    } else {
      socket.emit('loginFail', 'Invalid credentials');
    }
  });

  socket.on('chatMessage', (data) => {
    const user = users[socket.id];
    if (!user || timeouts[user.username]) return;

    if (data.type === 'text') {
      io.emit('chatMessage', {
        username: user.username,
        profilePic: user.profilePic,
        message: data.message,
        type: 'text'
      });
    } else if (data.type === 'image') {
      io.emit('chatMessage', {
        username: user.username,
        profilePic: user.profilePic,
        imageUrl: data.imageUrl,
        type: 'image'
      });
    }
  });

  socket.on('adminCommand', (cmd) => {
    const user = users[socket.id];
    if (!user || user.username !== 'X12') return;

    if (cmd.action === 'strobe') {
      io.emit('strobeScreen', { duration: cmd.duration });
    } else if (cmd.action === 'playAudio') {
      io.emit('playAudio', { url: cmd.url });
    } else if (cmd.action === 'timeout') {
      const { target, duration } = cmd;
      timeouts[target] = Date.now() + duration * 1000;
      io.emit('timeoutApplied', { target, duration });
      setTimeout(() => {
        delete timeouts[target];
        io.emit('timeoutLifted', { target });
      }, duration * 1000);
    } else if (cmd.action === 'redirect') {
      io.to(cmd.targetSocketId).emit('redirect', cmd.url);
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      io.emit('userLeft', user.username);
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
