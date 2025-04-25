const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.json());
app.use(express.static(__dirname));
const users = {};

app.post('/register', (req, res) => {
  const { username, password, profilePic } = req.body;
  if (users[username]) return res.status(400).send('Username taken');
  users[username] = { password, profilePic };
  res.sendStatus(200);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    return res.json({ success: true });
  }
  res.json({ success: false });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/chat.html', (req, res) => res.sendFile(path.join(__dirname, 'chat.html')));

io.on('connection', socket => {
  socket.on('join', username => {
    socket.username = username;
  });

  socket.on('message', msg => {
    io.emit('message', msg);
  });

  socket.on('admin-flash', duration => {
    io.emit('flash');
  });

  socket.on('admin-timeout', ({ target, minutes }) => {
    io.emit('message', {
      username: 'SYSTEM',
      text: `${target} has been timed out for ${minutes} minutes.`
    });
  });

  socket.on('admin-redirect', ({ target, link }) => {
    io.emit('redirect', link);
  });

  socket.on('admin-audio', url => {
    io.emit('audio', url);
  });
});

http.listen(3000, () => {
  console.log('Sharcord is running on http://localhost:3000');
});
