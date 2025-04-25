const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('.'));
app.use(bodyParser.json());

const users = {};
const messages = [];
const timeouts = {};

app.post('/register', (req, res) => {
  const { username, password, profilePic } = req.body;
  if (users[username]) return res.status(400).end();
  users[username] = { password, profilePic };
  res.end();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && user.password === password) {
    res.json({ success: true, profilePic: user.profilePic });
  } else {
    res.json({ success: false });
  }
});

io.on('connection', socket => {
  let user;

  socket.on('join', username => {
    user = username;
    socket.emit('init', { messages, timeouts });
  });

  socket.on('message', msg => {
    const now = Date.now();
    const isTimedOut = timeouts[msg.username] && timeouts[msg.username] > now;
    if (!isTimedOut) {
      messages.push(msg);
      io.emit('message', msg);
    }
  });

  socket.on('flash', duration => {
    io.emit('flash', duration);
  });

  socket.on('timeout', ({ target, minutes }) => {
    const end = Date.now() + minutes * 60000;
    timeouts[target] = end;
    io.emit('timeout', { target, end });
  });

  socket.on('playAudio', url => {
    io.emit('playAudio', url);
  });
});

server.listen(3000, () => {
  console.log('Sharcord server running on port 3000');
});
