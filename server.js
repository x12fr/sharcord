const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let users = {};
let messages = [];
let timeouts = {};

app.post('/register', (req, res) => {
  const { username, password, profilePic } = req.body;
  if (users[username]) return res.status(409).end();
  users[username] = { password, profilePic };
  res.status(200).end();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username]?.password === password) return res.status(200).end();
  res.status(401).end();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', socket => {
  let user;

  socket.on('join', u => {
    user = u;
    socket.emit('init', { messages, timeouts });
  });

  socket.on('message', msg => {
    if (timeouts[msg.username] && timeouts[msg.username] > Date.now()) return;
    messages.push(msg);
    io.emit('message', msg);
  });

  socket.on('flash', () => {
    if (user === 'X12') io.emit('flash');
  });

  socket.on('timeout', ({ target, minutes }) => {
    if (user === 'X12') {
      const end = Date.now() + minutes * 60000;
      timeouts[target] = end;
      io.emit('timeout', { target, end });
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
