const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let messages = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('A user connected');

  socket.on('join', ({ username, isAdmin }) => {
    socket.username = username;
    socket.isAdmin = isAdmin;
    console.log(`${username} joined. Admin: ${isAdmin}`);

    // Send message history
    socket.emit('loadMessages', messages);
  });

  socket.on('sendMessage', data => {
    const message = {
      username: data.username,
      text: data.text,
      profilePicture: data.profilePicture,
      isAdmin: data.isAdmin,
      type: 'text'
    };

    messages.push(message);
    io.emit('message', message);
  });

  socket.on('sendImage', data => {
    const message = {
      username: data.username,
      image: data.image,
      profilePicture: data.profilePicture,
      isAdmin: data.isAdmin,
      type: 'image'
    };

    messages.push(message);
    io.emit('message', message);
  });

  socket.on('changeBackground', url => {
    if (socket.isAdmin) {
      io.emit('changeBackground', url);
    }
  });

  socket.on('playAudio', url => {
    if (socket.isAdmin) {
      io.emit('playAudio', url);
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.username} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Sharcord server running on http://localhost:${PORT}`);
});
