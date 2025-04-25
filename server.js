const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

app.use(express.static('.'));
app.use(bodyParser.json());

let users = {};
let messages = [];
let timeouts = {};

app.post('/register', (req, res) => {
  const { username, password, profilePic } = req.body;
  if (users[username]) return res.sendStatus(409);
  users[username] = { password, profilePic };
  res.sendStatus(200);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username]?.password === password) {
    res.json({ success: true, user: { username, profilePic: users[username].profilePic } });
  } else {
    res.json({ success: false });
  }
});

io.on('connection', socket => {
  let currentUser = null;

  socket.on('join', user => {
    currentUser = user;
    socket.emit('init', { messages, timeouts });
  });

  socket.on('message', data => {
    if (timeouts[currentUser.username] && timeouts[currentUser.username] > Date.now()) return;
    const msg = {
      username: currentUser.username,
      text: data.text,
      image: data.image,
      profilePic: users[currentUser.username].profilePic
    };
    messages.push(msg);
    io.emit('message', msg);
  });

  socket.on('flash', () => {
    if (currentUser.username === 'X12') io.emit('flash');
  });

  socket.on('timeout', ({ target, minutes }) => {
    if (currentUser.username === 'X12') {
      const end = Date.now() + minutes * 60000;
      timeouts[target] = end;
      io.emit('timeout', { target, end });
    }
  });
});

http.listen(3000, () => console.log('Sharcord running on http://localhost:3000'));
