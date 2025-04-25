const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const path = require("path");

const PORT = process.env.PORT || 3000;

let users = {};
let timeouts = {};

app.use(express.static("public")); // assumes your client files are in /public

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("login", ({ username, password }) => {
    users[socket.id] = { username, isAdmin: username === "X12", timeout: false };
    socket.emit("loginSuccess", users[socket.id]);
    io.emit("chat", { user: "System", msg: `${username} joined.` });
  });

  socket.on("chat", (msg) => {
    const user = users[socket.id];
    if (user && !user.timeout) {
      io.emit("chat", { user: user.username, msg, pic: user.pic });
    }
  });

  socket.on("register", ({ username, password, pic }) => {
    users[socket.id] = { username, isAdmin: username === "X12", pic, timeout: false };
    socket.emit("loginSuccess", users[socket.id]);
    io.emit("chat", { user: "System", msg: `${username} joined.` });
  });

  socket.on("sendImage", (url) => {
    const user = users[socket.id];
    if (user && !user.timeout) {
      io.emit("image", { user: user.username, url, pic: user.pic });
    }
  });

  socket.on("flash", (duration) => {
    const user = users[socket.id];
    if (user?.isAdmin) {
      io.emit("flash", duration);
    }
  });

  socket.on("timeout", ({ userToTimeout, mins }) => {
    const userId = Object.keys(users).find(id => users[id].username === userToTimeout);
    if (userId) {
      users[userId].timeout = true;
      timeouts[userToTimeout] = Date.now() + mins * 60000;
      io.emit("timeoutInfo", { user: userToTimeout, mins });
    }
  });

  socket.on("playAudio", (url) => {
    const user = users[socket.id];
    if (user?.isAdmin) {
      io.emit("playAudio", url);
    }
  });

  socket.on("redirectUser", ({ userToRedirect, link }) => {
    const userId = Object.keys(users).find(id => users[id].username === userToRedirect);
    if (userId) {
      io.to(userId).emit("redirect", link);
    }
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      io.emit("chat", { user: "System", msg: `${user.username} left.` });
      delete users[socket.id];
    }
  });
});

server.listen(PORT, () => console.log("Sharcord server live on port", PORT));
