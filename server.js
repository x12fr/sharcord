const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: 'uploads/' });
const users = {};
const admins = {};

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/chat.html'));

app.post('/register', upload.none(), (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).send('Username taken.');
  users[username] = { password };
  res.redirect('/login');
});

app.post('/login', upload.none(), (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(400).send('Invalid credentials.');
  }
  res.send(`<script>sessionStorage.setItem("username", "${username}"); window.location.href="/chat";</script>`);
});

// socket.io
io.on('connection', (socket) => {
  socket.on('chat message', (data) => io.emit('chat message', data));
  socket.on('admin action', (action) => io.emit('admin action', action));
});

http.listen(process.env.PORT || 3000, () => {
  console.log('Sharcord running');
});
