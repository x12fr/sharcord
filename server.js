const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};
const timeouts = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', ({ username, profilePic }) => {
    users[socket.id] = { username, profilePic };
    io.emit('updateUsers', users);
  });

  socket.on('chatMessage', (msg) => {
    const user = users[socket.id];
    if (user && !timeouts[socket.id]) {
      io.emit('chatMessage', {
        username: user.username,
        profilePic: user.profilePic,
        text: msg
      });
    }
  });

  socket.on('image', (data) => {
    const user = users[socket.id];
    if (user && !timeouts[socket.id]) {
      io.emit('image', {
        username: user.username,
        profilePic: user.profilePic,
        image: data
      });
    }
  });

  socket.on('admin:strobe', (duration) => {
    io.emit('strobe', duration);
  });

  socket.on('admin:timeout', ({ targetUsername, duration }) => {
    for (const [id, user] of Object.entries(users)) {
      if (user.username === targetUsername) {
        timeouts[id] = true;
        io.to(id).emit('timeout', duration);
        setTimeout(() => {
          delete timeouts[id];
        }, duration * 1000);
      }
    }
  });

  socket.on('admin:playAudio', (url) => {
    io.emit('playAudio', url);
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    delete timeouts[socket.id];
    io.emit('updateUsers', users);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
