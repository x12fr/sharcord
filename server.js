const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {}; // socket.id -> username
const userSockets = {}; // username -> socket.id
const admins = new Set(['X12']); // Add usernames here to give admin rights

io.on('connection', (socket) => {
  let currentUser = '';

  socket.on('check admin', ({ username }, cb) => {
    cb({ isAdmin: admins.has(username) });
  });

  socket.on('chat message', ({ user, message }) => {
    currentUser = user;
    users[socket.id] = user;
    userSockets[user] = socket.id;
    io.emit('chat message', { user, message });
  });

  socket.on('private message', ({ to, from, message }) => {
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('private message', { from, message });
    }
  });

  socket.on('announcement', (msg) => {
    io.emit('announcement', msg);
  });

  socket.on('flash', (targetUsername) => {
    const targetSocket = userSockets[targetUsername];
    if (targetSocket) {
      io.to(targetSocket).emit('flash');
    }
  });

  socket.on('jumpscare', () => {
    for (let id in users) {
      io.to(id).emit('jumpscare');
    }
  });

  socket.on('redirect', ({ user, url }) => {
    const socketId = userSockets[user];
    if (socketId) {
      io.to(socketId).emit('redirect', url);
    }
  });

  socket.on('timeout', ({ user, seconds }) => {
    const socketId = userSockets[user];
    if (socketId) {
      io.to(socketId).emit('timeout', seconds);
    }
  });

  socket.on('kick', (user) => {
    const socketId = userSockets[user];
    if (socketId) {
      io.to(socketId).emit('kick');
      io.sockets.sockets.get(socketId)?.disconnect();
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    delete userSockets[user];
    delete users[socket.id];
  });
});

server.listen(3000, () => {
  console.log('Sharcord server running on http://localhost:3000');
});
