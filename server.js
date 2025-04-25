const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

let users = {};
let messages = [];
let timeouts = {};

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/register', (req, res) => {
  const { username, password, profilePic } = req.body;
  if (users[username]) return res.sendStatus(409);
  users[username] = { password, profilePic };
  res.sendStatus(200);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

io.on('connection', socket => {
  let user;

  socket.on('join', username => {
    user = username;
    socket.username = username;
    io.emit('init', { messages, timeouts });
  });

  socket.on('message', data => {
    if (timeouts[user] && Date.now() < timeouts[user]) return;
    messages.push(data);
    io.emit('message', data);
  });

  socket.on('flash', ({ duration }) => {
    io.emit('flash', duration);
  });

  socket.on('timeout', ({ target, minutes }) => {
    const end = Date.now() + minutes * 60000;
    timeouts[target] = end;
    io.emit('timeout', { target, end });
  });

  socket.on('redirect', ({ user, url }) => {
    io.emit('redirect', { user, url });
  });

  socket.on('youtube', ({ url }) => {
    io.emit('youtube', url);
  });
});

http.listen(3000, () => {
  console.log('Sharcord server running on port 3000');
});
