const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('chat image', (msg) => {
    io.emit('chat image', msg);
  });

  socket.on('admin strobe', () => {
    io.emit('strobe');
  });

  socket.on('admin stopstrobe', () => {
    io.emit('stop strobe');
  });

  socket.on('admin play audio', (url) => {
    io.emit('play audio', url);
  });

  socket.on('admin timeout', (data) => {
    io.emit('timeout', data);
  });

  socket.on('admin redirect', (data) => {
    io.emit('redirect', data.link);
  });

  socket.on('admin jumpscare', (data) => {
    io.emit('jumpscare', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
