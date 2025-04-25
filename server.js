const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

const users = {};
const admins = ['X12']; // Add more usernames to this array for multiple admins
const owner = 'X12';

io.on('connection', socket => {
  let user;

  socket.on('chat message', data => {
    if (!users[data.username]) return;
    io.emit('chat message', data);
  });

  socket.on('file upload', data => {
    io.emit('file upload', data);
  });

  socket.on('check admin', ({ username }, callback) => {
    user = username;
    users[username] = socket.id;
    callback(admins.includes(username));
  });

  socket.on('announcement', ({ username, announcement }) => {
    if (admins.includes(username)) {
      io.emit('announcement', { username, announcement });
    }
  });

  socket.on('kick user', ({ username }) => {
    const id = users[username];
    if (id) io.to(id).emit('kick');
  });

  socket.on('jumpscare everyone', () => {
    if (user === owner) {
      io.emit('jumpscare');
    }
  });

  socket.on('disconnect', () => {
    delete users[user];
  });
});

http.listen(3000, () => {
  console.log('Sharcord server running on port 3000');
});
