const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Load users from users.json
let users = {};
const usersFile = path.join(__dirname, 'users.json');

if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile));
}

// Save users to users.json
function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/public/chat.html');
});
app.get('/secret', (req, res) => {
  res.sendFile(__dirname + '/public/secret.html');
});

// Handle registration
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.send('Username taken!');
  }
  users[username] = {
    password,
    profilePicture: '/defaultpfp.png'
  };
  saveUsers();
  res.redirect('/login');
});

// Handle login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    res.redirect(`/chat?username=${username}`);
  } else {
    res.send('Invalid login!');
  }
});

// Real-time chat
let announcements = '';
let timeouts = {};

io.on('connection', socket => {
  let currentUser = '';

  socket.on('join', username => {
    currentUser = username;
    socket.username = username;
    socket.emit('loadProfilePicture', users[username]?.profilePicture || '/defaultpfp.png');
  });

  socket.on('chat message', msg => {
    io.emit('chat message', { username: socket.username, msg });
  });

  socket.on('sendImage', imgData => {
    io.emit('sendImage', { username: socket.username, imgData });
  });

  socket.on('setProfilePicture', imgUrl => {
    if (users[socket.username]) {
      users[socket.username].profilePicture = imgUrl;
      saveUsers();
      io.emit('updateProfilePicture', { username: socket.username, imgUrl });
    }
  });

  socket.on('admin_announcement', announcement => {
    announcements = announcement;
    io.emit('announcement', announcement);
    setTimeout(() => {
      io.emit('announcement', '');
    }, 10000);
  });

  socket.on('admin_strobe', duration => {
    io.emit('strobe', duration);
  });

  socket.on('admin_playAudio', url => {
    io.emit('playAudio', url);
  });

  socket.on('admin_timeout', (username, duration) => {
    timeouts[username] = Date.now() + duration * 1000;
    io.emit('timeout', { username, duration });
  });

  socket.on('admin_redirect', username => {
    io.to([...io.sockets.sockets.values()].find(s => s.username === username)?.id || '').emit('redirect', '/secret.html');
    setTimeout(() => {
      io.to([...io.sockets.sockets.values()].find(s => s.username === username)?.id || '').emit('redirect', '/chat.html');
    }, 5000);
  });
});

// Start server
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
