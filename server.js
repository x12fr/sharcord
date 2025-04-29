const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const users = new Map();
const ADMIN_KEY = 'supersecretkey'; // <- CHANGE THIS to your real secret admin key

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('claim-username', ({ username, profilePic, adminKey, isAdmin }, callback) => {
    if (!username) return callback({ success: false, message: 'Username required' });
    if ([...users.values()].find(u => u.username === username)) {
      return callback({ success: false, message: 'Username already taken' });
    }

    const adminStatus = (adminKey && adminKey === ADMIN_KEY) || isAdmin === true;

    users.set(socket.id, { username, profilePic, isAdmin: adminStatus });
    callback({ success: true, isAdmin: adminStatus });
  });

  socket.on('send-message', ({ message, profilePic, isAdmin }) => {
    const user = users.get(socket.id);
    if (!user) return;

    io.emit('new-message', {
      username: user.username,
      profilePic: user.profilePic,
      message,
      isAdmin: user.isAdmin
    });
  });

  socket.on('send-image', ({ imageUrl, profilePic, isAdmin }) => {
    const user = users.get(socket.id);
    if (!user) return;

    io.emit('new-message', {
      username: user.username,
      profilePic: user.profilePic,
      image: imageUrl,
      isAdmin: user.isAdmin
    });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
