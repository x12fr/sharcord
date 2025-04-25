const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));
app.use(express.json());

const users = {}; // socket.id -> user data
const allUsers = {}; // username -> { password, profilePic }
const dms = {}; // 'user1_user2': [messages]
const messages = [];

const admins = new Set();
const owner = { username: "X12", password: "331256444" };

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (allUsers[username]) return res.json({ success: false, message: "Username taken" });
  allUsers[username] = { password, profilePic: '' };
  return res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === owner.username && password === owner.password) return res.json({ success: true, isOwner: true });
  if (allUsers[username]?.password === password) return res.json({ success: true, isAdmin: admins.has(username) });
  return res.json({ success: false, message: "Wrong credentials" });
});

io.on('connection', (socket) => {
  let currentUser = null;

  socket.on('login', ({ username }) => {
    currentUser = username;
    users[socket.id] = { username, socketId: socket.id };
    socket.emit('chat-history', messages);
    io.emit('user-list', Object.values(users).map(u => u.username));
  });

  socket.on('send-message', (msg) => {
    const message = { username: currentUser, msg, type: "text" };
    messages.push(message);
    io.emit('new-message', message);
  });

  socket.on('send-image', (url) => {
    const message = { username: currentUser, msg: url, type: "image" };
    messages.push(message);
    io.emit('new-message', message);
  });

  socket.on('send-audio', (url) => {
    const message = { username: currentUser, msg: url, type: "audio" };
    messages.push(message);
    io.emit('new-message', message);
  });

  socket.on('send-dm', ({ to, message }) => {
    const key = [currentUser, to].sort().join('_');
    if (!dms[key]) dms[key] = [];
    const dm = { from: currentUser, to, msg: message };
    dms[key].push(dm);
    for (const id in users) {
      if ([currentUser, to].includes(users[id].username)) {
        io.to(users[id].socketId).emit('new-dm', dm);
      }
    }
  });

  socket.on('admin-action', ({ action, target, data }) => {
    const targetSocket = Object.values(users).find(u => u.username === target)?.socketId;
    if (!targetSocket) return;
    if (action === 'flash') io.to(targetSocket).emit('flash', data);
    if (action === 'timeout') io.to(targetSocket).emit('timeout', data);
    if (action === 'redirect') io.to(targetSocket).emit('redirect', data);
    if (action === 'kick') io.to(targetSocket).emit('kick');
    if (action === 'announce') io.emit('announcement', data);
    if (action === 'grantAdmin') admins.add(target);
    if (action === 'removeAdmin') admins.delete(target);
  });

  socket.on('jumpscare', () => {
    if (currentUser === owner.username) io.emit('jumpscare');
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('user-list', Object.values(users).map(u => u.username));
  });
});

http.listen(3000, () => {
  console.log("Sharcord is live on port 3000!");
});
