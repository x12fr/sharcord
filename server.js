const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

const users = {}; // username -> socket id

app.use(express.static('public'));
app.use(express.json());

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (fs.existsSync(`./users/${username}.json`)) {
    return res.json({ success: false, message: "Username taken!" });
  }
  fs.writeFileSync(`./users/${username}.json`, JSON.stringify({ username, password }));
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!fs.existsSync(`./users/${username}.json`)) {
    return res.json({ success: false, message: "No such user!" });
  }
  const user = JSON.parse(fs.readFileSync(`./users/${username}.json`));
  if (user.password !== password) {
    return res.json({ success: false, message: "Wrong password!" });
  }
  res.json({ success: true, token: username });
});

app.get('/api/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !fs.existsSync(`./users/${token}.json`)) {
    return res.json({ success: false });
  }
  res.json({ success: true, username: token });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  const filePath = `/uploads/${req.file.filename}${path.extname(req.file.originalname)}`;
  fs.renameSync(req.file.path, `./public${filePath}`);
  res.json({ success: true, url: filePath });
});

io.on('connection', (socket) => {
  socket.on('join', ({ username }) => {
    users[username] = socket.id;
  });

  socket.on('chat message', (data) => {
    io.emit('chat message', data);
  });

  socket.on('admin announcement', (msg) => {
    io.emit('announcement', msg);
  });

  socket.on('admin strobe', () => {
    io.emit('strobe');
  });

  socket.on('admin kick', (username) => {
    if (users[username]) {
      io.to(users[username]).emit('kick');
    }
  });

  socket.on('admin timeout', ({ user, duration }) => {
    if (users[user]) {
      io.to(users[user]).emit('timeout', duration);
    }
  });

  socket.on('admin broadcast', ({ fileUrl, type }) => {
    io.emit('broadcastMedia', fileUrl, type);
  });
});

http.listen(3000, () => {
  console.log('Sharcord server running on http://localhost:3000');
});
