const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Route to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle socket.io connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle incoming chat messages
  socket.on('chat message', (data) => {
    io.emit('chat message', data); // Send message to everyone
  });

  // Handle private messages
  socket.on('private message', ({ to, message, from }) => {
    io.to(to).emit('private message', { message, from });
  });

  // Handle jumpscare (image + audio)
  socket.on('jumpscare', ({ imageUrl, audioUrl }) => {
    io.emit('jumpscare', { imageUrl, audioUrl });
  });

  // Handle kicks
  socket.on('kick user', (userId) => {
    io.to(userId).emit('kicked');
  });

  // Handle other admin features (flash screen, etc.)
  socket.on('flash', (color) => {
    io.emit('flash', color);
  });

  socket.on('play audio', (audioUrl) => {
    io.emit('play audio', audioUrl);
  });

  socket.on('redirect user', ({ userId, link }) => {
    io.to(userId).emit('redirect', link);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
