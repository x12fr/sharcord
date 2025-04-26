const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

let users = {};

app.use(express.static(path.join(__dirname, '/')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.sendFile(__dirname + '/login.html'));
app.get('/register.html', (req, res) => res.sendFile(__dirname + '/register.html'));
app.get('/login.html', (req, res) => res.sendFile(__dirname + '/login.html'));
app.get('/chat.html', (req, res) => res.sendFile(__dirname + '/chat.html'));
app.get('/secret.html', (req, res) => res.sendFile(__dirname + '/secret.html'));

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).send('Username already taken');
  }
  users[username] = { password, profilePic: '/default.png' };
  res.redirect('/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(400).send('Invalid login');
  }
  res.redirect('/chat.html');
});

io.on('connection', socket => {
  socket.on('chat message', data => {
    io.emit('chat message', data);
  });

  socket.on('check admin', username => {
    if (username === 'X12') {
      socket.emit('enable admin');
    }
  });

  socket.on('admin strobe', duration => {
    io.emit('strobe', duration);
  });

  socket.on('admin timeout', data => {
    io.emit('timeout', data.duration);
  });

  socket.on('admin redirect', user => {
    io.emit('redirect');
  });

  socket.on('admin announcement', text => {
    io.emit('announcement', text);
  });

  socket.on('admin jumpscare', data => {
    io.emit('jumpscare', data);
  });
});

http.listen(3000, () => console.log('Sharcord running on port 3000'));
