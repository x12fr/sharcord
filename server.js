const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

const users = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/register.html', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.get('/chat.html', (req, res) => {
  res.sendFile(__dirname + '/public/chat.html');
});

// Register
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.send('Username already exists.');
  }
  users.push({ username, password });
  res.redirect('/login.html');
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.redirect('/chat.html?username=' + encodeURIComponent(username));
  } else {
    res.send('Invalid login!');
  }
});

// Socket.io (basic real-time chat example)
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
