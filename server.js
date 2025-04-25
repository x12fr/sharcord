const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const multer = require('multer');

// Static files served from "public"
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for profile pictures and image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Handle image upload
app.post('/upload', upload.single('image'), (req, res) => {
  res.json({ imageUrl: '/uploads/' + req.file.filename });
});

// Fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================
// SERVER DATA
// ==================
const users = {}; // socket.id -> { username, profilePic, timeoutUntil, isAdmin }
const privateMessages = {}; // "userA-userB" -> [messages]
let grantedAdmins = {}; // username -> expiration timestamp

// ==================
// SOCKET.IO HANDLERS
// ==================
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register/Login
  socket.on('register', ({ username, password, profilePic }) => {
    users[socket.id] = { username, profilePic, timeoutUntil: 0, isAdmin: false };
    io.emit('updateUserList', getAllUsers());
  });

  socket.on('login', ({ username, password }) => {
    let isAdmin = false;
    if (username === 'X12' && password === '331256444') {
      isAdmin = true;
    }
    users[socket.id] = { username, profilePic: '', timeoutUntil: 0, isAdmin };
    io.emit('updateUserList', getAllUsers());
  });

  // Global Chat
  socket.on('sendMessage', (message) => {
    const user = users[socket.id];
    if (!user) return;

    if (Date.now() < user.timeoutUntil) {
      socket.emit('timeoutMessage', 'You are currently timed out.');
      return;
    }

    io.emit('receiveMessage', {
      username: user.username,
      profilePic: user.profilePic,
      message,
      type: 'text'
    });
  });

  // Image Message
  socket.on('sendImage', (imageUrl) => {
    const user = users[socket.id];
    if (!user) return;

    io.emit('receiveMessage', {
      username: user.username,
      profilePic: user.profilePic,
      message: imageUrl,
      type: 'image'
    });
  });

  // Private DMs
  socket.on('privateMessage', ({ to, message, type }) => {
    const fromUser = users[socket.id];
    const toSocketId = findSocketIdByUsername(to);
    if (fromUser && toSocketId) {
      io.to(toSocketId).emit('receivePrivateMessage', {
        from: fromUser.username,
        profilePic: fromUser.profilePic,
        message,
        type
      });
    }
  });

  // ==================
  // ADMIN PANEL
  // ==================
  socket.on('strobeScreen', () => {
    if (!isAdmin(socket)) return;
    io.emit('strobeScreen');
  });

  socket.on('playAudio', (audioUrl) => {
    if (!isAdmin(socket)) return;
    io.emit('playAudio', audioUrl);
  });

  socket.on('timeoutUser', ({ username, duration }) => {
    if (!isAdmin(socket)) return;
    const id = findSocketIdByUsername(username);
    if (id && users[id]) {
      users[id].timeoutUntil = Date.now() + (duration * 1000);
      io.to(id).emit('timeoutApplied', duration);
    }
  });

  socket.on('redirectUser', ({ username, url }) => {
    if (!isAdmin(socket)) return;
    const id = findSocketIdByUsername(username);
    if (id) {
      io.to(id).emit('redirect', url);
    }
  });

  socket.on('spamTabs', ({ username, url }) => {
    if (!isAdmin(socket)) return;
    const id = findSocketIdByUsername(username);
    if (id) {
      io.to(id).emit('spamTabs', url);
    }
  });

  socket.on('jumpscare', ({ imageUrl, audioUrl }) => {
    if (!isAdmin(socket)) return;
    io.emit('jumpscare', { imageUrl, audioUrl });
  });

  socket.on('sendAnnouncement', (announcement) => {
    if (!isAdmin(socket)) return;
    io.emit('announcement', announcement);
  });

  socket.on('clearChat', () => {
    if (!isAdmin(socket)) return;
    io.emit('clearChat');
  });

  socket.on('grantAdmin', ({ username, duration }) => {
    if (!isAdmin(socket)) return;
    const id = findSocketIdByUsername(username);
    if (id && users[id]) {
      users[id].isAdmin = true;
      grantedAdmins[username] = Date.now() + (duration * 1000);
      io.to(id).emit('adminGranted', duration);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];
    io.emit('updateUserList', getAllUsers());
  });
});

// ==================
// HELPER FUNCTIONS
// ==================
function getAllUsers() {
  return Object.values(users).map(u => ({
    username: u.username,
    profilePic: u.profilePic
  }));
}

function findSocketIdByUsername(username) {
  return Object.keys(users).find(id => users[id].username === username);
}

function isAdmin(socket) {
  const user = users[socket.id];
  if (!user) return false;
  if (user.username === 'X12') return true;
  if (grantedAdmins[user.username] && grantedAdmins[user.username] > Date.now()) return true;
  return false;
}

// ==================
// SERVER START
// ==================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sharcord server is running on http://localhost:${PORT}`);
});
