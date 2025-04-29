const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let messages = [];

io.on('connection', (socket) => {
  // Send existing messages to the newly connected client
  messages.slice(-100).forEach(msg => socket.emit("message", msg));

  // Handle incoming messages
  socket.on("message", data => {
    const msg = { ...data };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit("message", msg);
  });

  // Handle background change requests
  socket.on("setBackground", (url) => {
    io.emit("changeBackground", url);
  });

  // Handle sound play requests
  socket.on("playSound", (url) => {
    io.emit("playSound", url);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord running on http://localhost:${PORT}`);
});
