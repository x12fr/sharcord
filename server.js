const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let users = {};
let timeouts = {};

io.on('connection', (socket) => {
  socket.on('login', ({ username, password, pic }, cb) => {
    if (users[username]) return cb({ error: 'Username taken' });

    if (username === 'X12' && password === '331256444') {
      socket.isAdmin = true;
    }

    users[username] = { socket, pic };
    socket.username = username;
    socket.pic = pic;

    cb({ success: true, isAdmin: socket.isAdmin });
    io.emit('userlist', Object.keys(users));
  });

  socket.on('sendMessage', (msg) => {
    if (!timeout[socket.username]) {
      io.emit('chatMessage', {
        username: socket.username,
        pic: socket.pic,
        message: msg,
      });
    }
  });

  socket.on('sendImage', (imgData) => {
    io.emit('imageMessage', {
      username: socket.username,
      pic: socket.pic,
      image: imgData,
    });
  });

  socket.on('adminStrobe', (duration) => {
    if (socket.isAdmin) io.emit('strobeScreen', duration);
  });

  socket.on('adminAudio', (ytUrl) => {
    if (socket.isAdmin) io.emit('playAudio', ytUrl);
  });

  socket.on('adminTimeout', ({ user, duration }) => {
    if (socket.isAdmin && users[user]) {
      timeouts[user] = true;
      users[user].socket.emit('timeout', duration);
      setTimeout(() => {
        delete timeouts[user];
      }, duration * 1000);
    }
  });

  socket.on('adminRedirect', ({ user, url }) => {
    if (socket.isAdmin && users[user]) {
      users[user].socket.emit('redirect', url);
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.username];
    io.emit('userlist', Object.keys(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
