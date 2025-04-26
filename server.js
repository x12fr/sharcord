const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// HOME
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// REGISTER
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  let users = {};
  if (fs.existsSync('./users.json')) {
    users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
  }

  if (users[username]) {
    res.send('Username taken!');
  } else {
    users[username] = { password: password, pfp: '' };
    fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
    res.redirect('/login.html');
  }
});

// LOGIN (Fixed!)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  let users = {};
  if (fs.existsSync('./users.json')) {
    users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
  }

  if (users[username] && users[username].password === password) {
    res.redirect(`/chat.html?username=${encodeURIComponent(username)}`);
  } else {
    res.send('Invalid login!');
  }
});

// SECRET PAGE for redirection
app.get('/secret.html', (req, res) => {
  res.sendFile(__dirname + '/public/secret.html');
});

// SOCKET.IO CONNECTION
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('announcement', (msg) => {
    io.emit('announcement', msg);
  });

  socket.on('redirectUser', (data) => {
    io.to(data.targetId).emit('redirect', '/secret.html');
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// START SERVER
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
