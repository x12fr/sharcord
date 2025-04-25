const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

app.use(bodyParser.json());
app.use(express.static('public'));

const users = {}; // Format: { username: { password, profilePic, timeoutUntil } }

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).json({ message: 'Username taken' });
  }
  users[username] = { password, profilePic: '', timeoutUntil: 0 };
  res.json({ message: 'Registered successfully' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Admin login
  if (username === 'X12' && password === '331256444') {
    return res.json({ admin: true, username });
  }

  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(400).json({ message: 'Login failed' });
  }

  res.json({ message: 'Login successful', username });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', data);
  });

  socket.on('adminCommand', (data) => {
    io.emit('adminCommand', data);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
