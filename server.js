const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

const users = {}; // username -> password
const profilePictures = {}; // username -> profile pic url

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.send('Username already taken.');
  }
  users[username] = password;
  profilePictures[username] = '/defaultpfp.png'; // set a default profile picture
  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    return res.redirect(`/chat.html?username=${encodeURIComponent(username)}`);
  }
  return res.send('Invalid login.');
});

app.get('/chat.html', (req, res) => {
  res.sendFile(__dirname + '/public/chat.html');
});

io.on('connection', (socket) => {
  let user = null;

  socket.on('set username', (username) => {
    user = username;
    console.log(`${user} connected`);
  });

  socket.on('chat message', (msg) => {
    if (user) {
      io.emit('chat message', { username: user, message: msg });
    }
  });

  // admin commands
  socket.on('announce', (text) => {
    io.emit('announcement', text);
  });

  socket.on('strobe', (duration) => {
    io.emit('strobe', duration);
  });

  socket.on('timeout', (data) => {
    io.emit('timeout', data.duration);
  });

  socket.on('redirect', (data) => {
    io.emit('redirect', data.link);
  });

  socket.on('jumpscare', (data) => {
    io.emit('jumpscare', data);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
