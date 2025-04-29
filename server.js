const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const CHAT_HISTORY_FILE = 'chat-history.json';

let users = {};
let chatHistory = [];

// Load saved chat history
function loadChatHistory() {
  if (fs.existsSync(CHAT_HISTORY_FILE)) {
    try {
      chatHistory = JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, 'utf-8'));
    } catch (err) {
      console.error('Error reading chat history:', err);
    }
  }
}

// Save chat history (keep last 100 messages only)
function saveChatHistory() {
  fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(chatHistory.slice(-100), null, 2));
}

loadChatHistory();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  let username = null;

  socket.on('set-username', ({ name, profilePic, isAdmin }) => {
    if (Object.values(users).some(user => user.name === name)) {
      socket.emit('username-taken');
      return;
    }

    username = name;
    users[socket.id] = { name, profilePic, isAdmin };

    // Send chat history to new user
    socket.emit('chat-history', chatHistory);

    console.log(`${name} connected.`);
  });

  socket.on('send-message', (text) => {
    if (!username) return;
    const msg = {
      type: 'text',
      name: users[socket.id].name,
      profilePic: users[socket.id].profilePic,
      isAdmin: users[socket.id].isAdmin,
      content: text
    };
    chatHistory.push(msg);
    saveChatHistory();
    io.emit('chat-message', msg);
  });

  socket.on('send-image', (imgUrl) => {
    if (!username) return;
    const msg = {
      type: 'image',
      name: users[socket.id].name,
      profilePic: users[socket.id].profilePic,
      isAdmin: users[socket.id].isAdmin,
      content: imgUrl
    };
    chatHistory.push(msg);
    saveChatHistory();
    io.emit('chat-message', msg);
  });

  socket.on('disconnect', () => {
    if (username) {
      console.log(`${username} disconnected.`);
      delete users[socket.id];
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
