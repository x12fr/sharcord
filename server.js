const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const path = require("path");

app.use(express.static("public"));
app.use(bodyParser.json());

let users = {}; // { username: { password, socketId, isAdmin, isTimedOut } }
let messages = [];
let privateMessages = {}; // { 'user1_user2': [msgs] }

function getDMKey(user1, user2) {
  return [user1, user2].sort().join("_");
}

// Serve login/register pages
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/login", (req, res) => res.sendFile(__dirname + "/public/login.html"));
app.get("/register", (req, res) => res.sendFile(__dirname + "/public/register.html"));
app.get("/chat", (req, res) => res.sendFile(__dirname + "/public/chat.html"));

io.on("connection", (socket) => {
  socket.on("register", ({ username, password }, cb) => {
    if (users[username]) return cb({ success: false, msg: "Username taken." });
    users[username] = { password, socketId: socket.id, isAdmin: username === "X12", isTimedOut: false };
    cb({ success: true });
  });

  socket.on("login", ({ username, password }, cb) => {
    if (!users[username] || users[username].password !== password) return cb({ success: false });
    users[username].socketId = socket.id;
    cb({ success: true, isAdmin: users[username].isAdmin });
    socket.broadcast.emit("announcement", `${username} joined.`);
  });

  socket.on("sendMessage", ({ from, message, file }) => {
    if (users[from]?.isTimedOut) return;
    const msg = { from, message, file };
    messages.push(msg);
    io.emit("chatMessage", msg);
  });

  socket.on("sendPrivateMessage", ({ from, to, message, file }) => {
    const key = getDMKey(from, to);
    if (!privateMessages[key]) privateMessages[key] = [];
    const msg = { from, message, file };
    privateMessages[key].push(msg);
    [from, to].forEach(user => {
      const sid = users[user]?.socketId;
      if (sid) io.to(sid).emit("privateMessage", { key, msg });
    });
  });

  socket.on("requestPrivateMessages", ({ from, to }) => {
    const key = getDMKey(from, to);
    socket.emit("loadPrivateMessages", privateMessages[key] || []);
  });

  // Admin tools
  socket.on("adminFlash", (target, duration) => {
    const sid = users[target]?.socketId;
    if (sid) io.to(sid).emit("flashScreen", duration);
  });

  socket.on("adminTimeout", (target, duration) => {
    users[target].isTimedOut = true;
    const sid = users[target]?.socketId;
    if (sid) io.to(sid).emit("timedOut", duration);
    setTimeout(() => {
      users[target].isTimedOut = false;
      const sid = users[target]?.socketId;
      if (sid) io.to(sid).emit("timeoutOver");
    }, duration * 1000);
  });

  socket.on("adminRedirect", (target, url) => {
    const sid = users[target]?.socketId;
    if (sid) io.to(sid).emit("redirect", url);
  });

  socket.on("adminAnnounce", (msg) => {
    io.emit("announcement", msg);
  });

  socket.on("adminKick", (target) => {
    const sid = users[target]?.socketId;
    if (sid) io.to(sid).emit("kicked");
  });

  socket.on("adminGrant", (target) => {
    if (users[target]) users[target].isAdmin = true;
  });

  socket.on("adminRevoke", (target) => {
    if (users[target]) users[target].isAdmin = false;
  });
});

http.listen(3000, () => console.log("Sharcord running on http://localhost:3000"));
