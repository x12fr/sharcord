const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
let messages = [];

io.on('connection', (socket) => {
  messages.slice(-100).forEach(msg => socket.emit("message", msg));

  socket.on("message", data => {
    const msg = { ...data };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit("message", msg);
  });

  socket.on("setBackground", (url) => {
    io.emit("changeBackground", url);
  });

  socket.on("playSound", (url) => {
    io.emit("playSound", url);
  });
});

http.listen(3000, () => {
  console.log('Sharcord running on http://localhost:3000');
});
