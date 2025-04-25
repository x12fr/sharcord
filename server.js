const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const sessions = require('express-session');

const users = {};
let messages = [];

app.use(express.static('.'));
app.use(bodyParser.json());
app.use(sessions({ secret: 'sharcord', resave: false, saveUninitialized: true }));

function auth(req, res, next) {
  if (req.session.user) next();
  else res.redirect('/');
}

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.send('Username taken');
  users[username] = { password };
  req.session.user = username;
  res.send('success');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) return res.send('Invalid');
  req.session.user = username;
  res.send('success');
});

io.on('connection', socket => {
  let username = '';

  socket.on('login-user', user => {
    username = user;
    socket.username = user;
    messages.forEach(msg => socket.emit('message', msg));
  });

  socket.on('message', text => {
    if (!username) return;
    const msg = { user: username, text };
    messages.push(msg);
    io.emit('message', msg);
  });

  socket.on('jumpscare', ({ image, audio }) => {
    if (socket.username === 'X12') {
      io.emit('jumpscare', { image, audio });
    }
  });

  socket.on('strobe', seconds => {
    if (socket.username === 'X12') {
      io.emit('strobe', seconds);
    }
  });

  socket.on('timeout', user => {
    if (socket.username === 'X12') {
      const target = [...io.sockets.sockets.values()].find(s => s.username === user);
      if (target) target.emit('kick');
    }
  });

  socket.on('kick', user => {
    if (socket.username === 'X12') {
      const target = [...io.sockets.sockets.values()].find(s => s.username === user);
      if (target) target.emit('kick');
    }
  });

  socket.on('redirect', ({ user, link }) => {
    if (socket.username === 'X12') {
      const target = [...io.sockets.sockets.values()].find(s => s.username === user);
      if (target) target.emit('redirect', link);
    }
  });

  socket.on('clear', () => {
    if (socket.username === 'X12') {
      messages = [];
      io.emit('clear');
    }
  });
});

http.listen(3000, () => console.log('Sharcord live on http://localhost:3000'));
