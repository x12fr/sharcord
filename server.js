const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let registeredUsers = {}; // { username: { password, pic, isAdmin } }
let onlineUsers = {};     // { socket.id: { username, isAdmin, pic } }

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // REGISTER
  socket.on("register", ({ username, password, pic }) => {
    if (registeredUsers[username]) {
      socket.emit("registerFailed", "Username is taken");
    } else {
      registeredUsers[username] = {
        password,
        pic,
        isAdmin: username === "X12" && password === "331256444"
      };
      onlineUsers[socket.id] = {
        username,
        isAdmin: registeredUsers[username].isAdmin,
        pic
      };
      socket.emit("loginSuccess", onlineUsers[socket.id]);
      io.emit("chat", { user: "System", msg: `${username} joined.` });
    }
  });

  // LOGIN
  socket.on("login", ({ username, password }) => {
    const user = registeredUsers[username];
    if (!user || user.password !== password) {
      socket.emit("loginFailed", "Invalid username or password");
    } else {
      onlineUsers[socket.id] = {
        username,
        isAdmin: user.isAdmin,
        pic: user.pic
      };
      socket.emit("loginSuccess", onlineUsers[socket.id]);
      io.emit("chat", { user: "System", msg: `${username} joined.` });
    }
  });

  // CHAT MESSAGE
  socket.on("chat", (msg) => {
    const user = onlineUsers[socket.id];
    if (user) {
      io.emit("chat", { user: user.username, msg, pic: user.pic });
    }
  });

  // IMAGE
  socket.on("sendImage", (url) => {
    const user = onlineUsers[socket.id];
    if (user) {
      io.emit("image", { user: user.username, url, pic: user.pic });
    }
  });

  // ADMIN STUFF
  socket.on("flash", (duration) => {
    const user = onlineUsers[socket.id];
    if (user?.isAdmin) {
      io.emit("flash", duration);
    }
  });

  socket.on("playAudio", (url) => {
    const user = onlineUsers[socket.id];
    if (user?.isAdmin) {
      io.emit("playAudio", url);
    }
  });

  socket.on("timeout", ({ userToTimeout, mins }) => {
    const targetId = Object.keys(onlineUsers).find(id => onlineUsers[id].username === userToTimeout);
    if (targetId) {
      io.to(targetId).emit("timeout", mins);
    }
  });

  socket.on("redirectUser", ({ userToRedirect, link }) => {
    const targetId = Object.keys(onlineUsers).find(id => onlineUsers[id].username === userToRedirect);
    if (targetId) {
      io.to(targetId).emit("redirect", link);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    const user = onlineUsers[socket.id];
    if (user) {
      io.emit("chat", { user: "System", msg: `${user.username} left.` });
      delete onlineUsers[socket.id];
    }
  });
});

server.listen(PORT, () => console.log(`Sharcord server running on ${PORT}`));
