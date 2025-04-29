const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const messages = []; // store up to 100 messages

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('A user connected');

  // Send existing messages
  socket.emit('init', messages);

  // Receive and broadcast new messages
  socket.on('chat message', data => {
    const msg = {
      user: data.user,
      text: data.text,
      isAdmin: data.isAdmin
    };

    messages.push(msg);
    if (messages.length > 100) messages.shift();

    io.emit('chat message', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
