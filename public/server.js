const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));
app.use(express.json());

const users = {};
const messages = [];
const timeouts = {};

app.post('/register', (req, res) => {
  const { username, password, profilePic } = req.body;
  if (users[username]) return res.sendStatus(409);
  users[username] = { password, profilePic };
  res.sendStatus(200);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) return res.sendStatus(401);
  res.sendStatus(200);
});

io.on('connection', (socket) => {
  socket.on('join', (username) => {
    socket.username = username;
    socket.emit('init', { messages, timeouts });
  });

  socket.on('message', (msg) => {
    if (timeouts[msg.username] && Date.now() < timeouts[msg.username]) return;
    messages.push(msg);
    io.emit('message', msg);
  });

  socket.on('flash', () => {
    if (socket.username === 'X12') {
      io.emit('flash');
    }
  });

  socket.on('timeout', ({ target, minutes }) => {
    if (socket.username === 'X12') {
      const end = Date.now() + minutes * 60000;
      timeouts[target] = end;
      io.emit('timeout', { target, end });
    }
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log('Sharcord running!');
});
