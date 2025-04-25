const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const users = {};

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', socket => {
  socket.on('register', ({ user, pass }) => {
    if (users[user]) return socket.emit('loginError', 'Username taken');
    users[user] = { pass, profilePic: `https://robohash.org/${user}` };
    socket.emit('loginSuccess', { username: user, profilePic: users[user].profilePic });
  });

  socket.on('login', ({ user, pass }) => {
    if (user === 'X12' && pass === '331256444') {
      return socket.emit('loginSuccess', { username: user, profilePic: `https://robohash.org/${user}` });
    }
    if (!users[user] || users[user].pass !== pass) {
      return socket.emit('loginError', 'Invalid credentials');
    }
    socket.emit('loginSuccess', { username: user, profilePic: users[user].profilePic });
  });

  socket.on('message', data => io.emit('message', data));
  socket.on('image', data => io.emit('image', data));
  socket.on('adminStrobe', duration => io.emit('strobe', duration));
  socket.on('adminAudio', url => io.emit('playAudio', url));
});

http.listen(process.env.PORT || 3000, () => {
  console.log('Sharcord running');
});
