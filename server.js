const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

const users = {};
const messages = [];

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.json({ success: false, message: 'Username taken' });
  users[username] = { password, profilePic: '' };
  res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password)
    return res.json({ success: false, message: 'Invalid login' });
  res.json({ success: true });
});

io.on('connection', socket => {
  socket.on('message', data => {
    messages.push(data);
    io.emit('message', data);
  });

  socket.on('admin-jumpscare', data => {
    io.emit('admin-jumpscare', data);
  });

  socket.on('admin-redirect', data => {
    for (const id in io.sockets.sockets) {
      const s = io.sockets.sockets[id];
      if (s.username === data.user) s.emit('admin-redirect', data.link);
    }
  });

  socket.on('admin-timeout', data => {
    for (const id in io.sockets.sockets) {
      const s = io.sockets.sockets[id];
      if (s.username === data.user) s.emit('admin-timeout', data.seconds);
    }
  });

  socket.on('admin-strobe', duration => {
    io.emit('admin-strobe', duration);
  });

  socket.on('admin-clear', () => {
    io.emit('admin-clear');
  });

  socket.on('set-username', name => {
    socket.username = name;
  });
});

http.listen(3000, () => console.log('Sharcord server running on http://localhost:3000'));
