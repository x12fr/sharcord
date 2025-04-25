const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const users = {};
const admins = ["X12"];
const owner = "X12";
const passwords = {
  X12: "331256444"
};

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.json({ success: false, message: "Username taken" });

  users[username] = { username, password, socketId: null };
  const isAdmin = admins.includes(username) && passwords[username] === password;
  const isOwner = username === owner && passwords[username] === password;
  res.json({ success: true, isAdmin, isOwner });
});

io.on("connection", (socket) => {
  socket.on("register-user", (username) => {
    if (users[username]) users[username].socketId = socket.id;
    socket.username = username;
    io.emit("chat-message", { user: "System", message: `${username} has joined.` });
  });

  socket.on("send-message", (msg) => {
    io.emit("chat-message", { user: socket.username, message: msg });
  });

  socket.on("private-message", ({ to, message }) => {
    const recipient = users[to];
    if (recipient && recipient.socketId) {
      io.to(recipient.socketId).emit("private-message", {
        from: socket.username,
        message
      });
    }
  });

  socket.on("admin-action", ({ type, target, data }) => {
    const targetUser = users[target];
    if (!targetUser) return;

    switch (type) {
      case "flash":
        io.to(targetUser.socketId).emit("flash-screen", data);
        break;
      case "announce":
        io.emit("announcement", data);
        break;
      case "redirect":
        io.to(targetUser.socketId).emit("redirect", data);
        break;
      case "timeout":
        io.to(targetUser.socketId).emit("timeout", data);
        break;
      case "kick":
        io.to(targetUser.socketId).emit("kick");
        break;
      case "jumpscare":
        io.emit("jumpscare", data);
        break;
    }
  });
});

http.listen(3000, () => console.log("Sharcord running on port 3000"));
