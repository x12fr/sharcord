const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const users = {};
const timeouts = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).send('Username taken');
  users[username] = { password, profilePic: null };
  res.status(200).send('Registered');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) return res.status(400).send('Invalid');
  res.status(200).send('Success');
});

io.on('connection', (socket) => {
  socket.on('join', ({ username, profilePic }) => {
    socket.username = username;
    socket.profilePic = profilePic;
    socket.broadcast.emit('user joined', { username });

    if (timeouts[username]) {
      socket.emit('timeout', timeouts[username]);
    }
  });

  socket.on('chat message', (msg) => {
    if (!timeouts[socket.username]) {
      io.emit('chat message', {
        username: socket.username,
        text: msg,
        profilePic: socket.profilePic
      });
    }
  });

  socket.on('image', (dataUrl) => {
    io.emit('image', {
      username: socket.username,
      dataUrl,
      profilePic: socket.profilePic
    });
  });

  socket.on('strobe', (duration) => {
    io.emit('strobe', duration);
  });

  socket.on('play audio', (url) => {
    io.emit('play audio', url);
  });

  socket.on('timeout user', ({ username, duration }) => {
    timeouts[username] = duration;
    io.emit('timeout', { username, duration });
  });

  socket.on('redirect user', ({ username, url }) => {
    io.emit('redirect user', { username, url });
  });
});

http.listen(3000, () => {
  console.log('Sharcord server running on port 3000');
});
