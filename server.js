const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.json());

const users = {}; // username -> { password, socketId }
const admins = ['G0THANGELZ', 'X12', 'Joel']; // Add your admin usernames here

let messages = [];

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.json({ success: false, message: 'Username already taken' });
  }
  users[username] = { password };
  res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.json({ success: false, message: 'Invalid login' });
  }
  const isAdmin = admins.includes(username);
  res.json({ success: true, username, isAdmin });
});

io.on('connection', socket => {
  console.log('User connected');

  socket.on('join', ({ username }) => {
    users[username].socketId = socket.id;
    socket.username = username;
    socket.emit('chat history', messages);
    io.emit('user joined', username);
  });

  socket.on('chat message', data => {
    const message = { user: data.user, text: data.text };
    messages.push(message);
    io.emit('chat message', message);
  });

  socket.on('private message', ({ toUser, fromUser, text }) => {
    const target = users[toUser];
    if (target && target.socketId) {
      io.to(target.socketId).emit('private message', { fromUser, text });
    }
  });

  // Admin actions
  socket.on('admin:flash', targetUser => {
    const target = users[targetUser];
    if (target?.socketId) {
      io.to(target.socketId).emit('flash');
    }
  });

  socket.on('admin:announce', msg => {
    io.emit('admin announcement', msg);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('user left', socket.username);
    }
  });
});

http.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
