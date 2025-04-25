
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const path = require('path');

let users = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const USER_DB = './users.json';
const ADMIN_USER = 'X12';
const ADMIN_PASS = '331256444';

if (!fs.existsSync(USER_DB)) fs.writeFileSync(USER_DB, '{}');

app.post('/register', (req, res) => {
  const db = JSON.parse(fs.readFileSync(USER_DB));
  const { username, password } = req.body;
  if (db[username]) return res.json({ success: false, message: "Username taken" });
  db[username] = password;
  fs.writeFileSync(USER_DB, JSON.stringify(db));
  res.json({ success: true, isAdmin: username === ADMIN_USER && password === ADMIN_PASS });
});

app.post('/login', (req, res) => {
  const db = JSON.parse(fs.readFileSync(USER_DB));
  const { username, password } = req.body;
  if (db[username] !== password) return res.json({ success: false, message: "Invalid credentials" });
  res.json({ success: true, isAdmin: username === ADMIN_USER && password === ADMIN_PASS });
});

io.on('connection', socket => {
  socket.on("join", username => {
    users[username] = socket;
    socket.username = username;
  });

  socket.on("message", data => {
    io.emit("message", data);
  });

  socket.on("jumpscare", () => {
    io.emit("jumpscare");
  });

  socket.on("strobe", duration => {
    io.emit("strobe", duration);
  });

  socket.on("kickUser", user => {
    if (users[user]) users[user].emit("kick");
  });

  socket.on("timeoutUser", ({ user, duration }) => {
    if (users[user]) users[user].emit("timeout", duration);
  });

  socket.on("redirectUser", ({ user, link }) => {
    if (users[user]) users[user].emit("redirect", link);
  });

  socket.on('disconnect', () => {
    delete users[socket.username];
  });
});

server.listen(3000, () => console.log('Sharcord server running on port 3000'));
