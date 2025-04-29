const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

const messages = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.emit('init', messages);

  socket.on('chat message', (data) => {
    const msg = {
      user: data.user,
      text: data.text,
      isAdmin: data.isAdmin,
      profilePic: data.profilePic
    };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit('chat message', msg);
  });

  socket.on('image message', (data) => {
    const msg = {
      user: data.user,
      text: data.text,
      isAdmin: data.isAdmin,
      profilePic: data.profilePic
    };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit('image message', msg);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
