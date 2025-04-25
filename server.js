const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const users = {}; // username: { password, profilePic, socketId }
const timeouts = {}; // username: timeoutEnd timestamp
let messages = [];

app.post('/register', (req, res) => {
  const { username, password, profilePic } = req.body;
  if (users[username]) return res.status(400).send('Username already exists');
  users[username] = { password, profilePic, socketId: null };
  res.sendStatus(200);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) return res.status(401).send('Invalid');
  res.sendStatus(200);
});

io.on('connection', socket => {
  socket.on('join', username => {
    if (users[username]) users[username].socketId = socket.id;

    socket.emit('init', { messages, users, timeouts });

    socket.on('message', data => {
      if (timeouts[data.username] && Date.now() < timeouts[data.username]) return;
      const msg = { username: data.username, text: data.text, image: data.image || null };
      messages.push(msg);
      io.emit('message', msg);
    });

    socket.on('dm', ({ from, to, text }) => {
      const target = users[to];
      if (target?.socketId) {
        io.to(target.socketId).emit('dm', { from, text });
      }
    });

    socket.on('flash', () => io.emit('flash'));

    socket.on('timeout', ({ target, minutes }) => {
      const end = Date.now() + minutes * 60000;
      timeouts[target] = end;
      io.emit('timeout', { target, end });
    });
  });
});

http.listen(PORT, () => console.log(`Sharcord running on port ${PORT}`));
