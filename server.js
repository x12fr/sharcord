const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

const ADMIN_KEY = "your_admin_key_here"; // Change this

let users = {}; // username -> socket.id
let admins = new Set();
let messages = []; // stored messages for chat history

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', ({ username, adminKey }) => {
    if (Object.values(users).includes(username)) {
      socket.emit('usernameTaken');
      socket.disconnect();
      return;
    }
    socket.username = username;
    users[socket.id] = username;
    
    if (adminKey === ADMIN_KEY) {
      socket.isAdmin = true;
      admins.add(socket.id);
      socket.emit('adminStatus');
    } else {
      socket.isAdmin = false;
    }

    socket.emit('chatHistory', messages);
  });

  socket.on('chatMessage', ({ username, message, profilePic }) => {
    const data = { username, message, profilePic, isAdmin: socket.isAdmin, type: 'text' };
    messages.push(data);
    io.emit('chatMessage', data);
  });

  socket.on('chatImage', ({ username, imgUrl, profilePic }) => {
    const data = { username, imgUrl, profilePic, isAdmin: socket.isAdmin, type: 'image' };
    messages.push(data);
    io.emit('chatImage', data);
  });

  socket.on('playAudio', (url) => {
    if (socket.isAdmin) {
      io.emit('playAudio', url);
    }
  });

  socket.on('strobeScreen', (duration) => {
    if (socket.isAdmin) {
      io.emit('strobeScreen', duration);
    }
  });

  socket.on('timeoutUser', ({ targetUsername, duration }) => {
    if (socket.isAdmin) {
      for (let id in users) {
        if (users[id] === targetUsername) {
          io.to(id).emit('timeoutUser', duration);
        }
      }
    }
  });

  socket.on('redirectUser', ({ targetUsername, redirectURL }) => {
    if (socket.isAdmin) {
      for (let id in users) {
        if (users[id] === targetUsername) {
          io.to(id).emit('redirectUser', redirectURL);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    admins.delete(socket.id);
    console.log('A user disconnected');
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
