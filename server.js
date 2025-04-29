const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = "331256444";

let users = {};
let messageHistory = [];

// Load chat history from file
const historyPath = path.join(__dirname, 'messages.json');
if (fs.existsSync(historyPath)) {
  try {
    const data = fs.readFileSync(historyPath);
    messageHistory = JSON.parse(data);
  } catch (err) {
    console.error("Failed to load chat history:", err);
  }
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  let currentUser = null;

  // Send chat history to newly connected user
  socket.emit('chatHistory', messageHistory);

  socket.on('join', ({ username, adminKey, profilePicture }) => {
    const isAdmin = adminKey === ADMIN_KEY;
    users[socket.id] = { username, isAdmin, profilePicture };
    currentUser = users[socket.id];

    if (isAdmin) {
      socket.emit('adminStatus', true);
    }
  });

  socket.on('message', (msg) => {
    if (!currentUser) return;

    const messageData = {
      username: currentUser.username,
      message: msg,
      profilePicture: currentUser.profilePicture,
      isAdmin: currentUser.isAdmin
    };

    messageHistory.push(messageData);
    fs.writeFileSync(historyPath, JSON.stringify(messageHistory, null, 2));

    io.emit('chatMessage', messageData);
  });

  socket.on('image', (url) => {
    if (!currentUser) return;

    const imageData = {
      username: currentUser.username,
      imageURL: url,
      profilePicture: currentUser.profilePicture,
      isAdmin: currentUser.isAdmin
    };

    messageHistory.push(imageData);
    fs.writeFileSync(historyPath, JSON.stringify(messageHistory, null, 2));

    io.emit('chatImage', imageData);
  });

  socket.on('updateProfilePicture', (newPic) => {
    if (currentUser) {
      currentUser.profilePicture = newPic;
      users[socket.id].profilePicture = newPic;
    }
  });

  // Admin features
  socket.on('playAudio', (url) => {
    if (currentUser?.isAdmin) {
      io.emit('playAudio', url);
      io.emit('announcement', `${currentUser.username} played audio`);
    }
  });

  socket.on('strobe', (duration) => {
    if (currentUser?.isAdmin) {
      io.emit('strobe', duration);
      io.emit('announcement', `${currentUser.username} strobed screens`);
    }
  });

  socket.on('timeoutUser', ({ user, duration }) => {
    if (currentUser?.isAdmin) {
      const targetSocketId = Object.keys(users).find(
        id => users[id].username === user
      );
      if (targetSocketId) {
        io.to(targetSocketId).emit('timeout', duration);
        io.emit('announcement', `${user} was timed out for ${duration}s`);
      }
    }
  });

  socket.on('redirectUser', ({ user, url }) => {
    if (currentUser?.isAdmin) {
      const targetSocketId = Object.keys(users).find(
        id => users[id].username === user
      );
      if (targetSocketId) {
        io.to(targetSocketId).emit('redirect', url);
        io.emit('announcement', `${user} was redirected`);
      }
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Sharcord server running at http://localhost:${PORT}`);
});
